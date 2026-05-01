from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import httpx
import re
import asyncio
from typing import Dict, List, Optional
from collections import defaultdict
import time

app = FastAPI(title="YouTube Advanced Downloader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caching video info for repeated requests
# Cache stores url -> (timestamp, data)
info_cache = {}
CACHE_TTL = 3600  # 1 hour

# Simple rate limiting in-memory
rate_limit_db = defaultdict(list)

def cleanup_cache():
    now = time.time()
    expired = [k for k, v in info_cache.items() if now - v[0] > CACHE_TTL]
    for k in expired:
        del info_cache[k]

def is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    rate_limit_db[client_ip] = [t for t in rate_limit_db[client_ip] if now - t < 60]
    if len(rate_limit_db[client_ip]) >= 60:
        return True
    rate_limit_db[client_ip].append(now)
    return False

def validate_url(url: str) -> bool:
    # Basic YouTube URL regex
    pattern = r"^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[a-zA-Z0-9_-]+.*$"
    return bool(re.match(pattern, url))

def get_yt_dlp_options():
    return {
        'extract_flat': False,
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
    }

def extract_metadata(url: str) -> dict:
    with yt_dlp.YoutubeDL(get_yt_dlp_options()) as ydl:
        info = ydl.extract_info(url, download=False)
        if not info:
            raise ValueError("Could not extract metadata.")
        return info

@app.get("/video-info")
async def get_video_info(url: str, request: Request):
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

    cleanup_cache()

    if not url or not validate_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    if url in info_cache:
        cached_time, data = info_cache[url]
        if time.time() - cached_time < CACHE_TTL:
            return data

    try:
        # Run yt-dlp synchronously in an async thread pool
        info = await asyncio.to_thread(extract_metadata, url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting info: {str(e)}")

    formats = info.get("formats", [])
    formats_by_quality = {}

    # Supported quality ranges
    valid_heights = [2160, 1440, 1080, 720, 480, 360]

    for f in formats:
        if f.get("format_id") in ["sb0", "sb1", "sb2", "sb3"] or f.get("ext") == "mhtml":
            continue

        height = f.get("height")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        ext = f.get("ext", "mp4")

        has_video = vcodec != "none" and vcodec is not None
        has_audio = acodec != "none" and acodec is not None

        # Include both WEBM and MP4 per resolution
        if has_video and height in valid_heights:
            quality_str = f"{height}p"
            key = f"{quality_str}_{ext}"
            
            format_item = {
                "itag": f.get("format_id"),
                "quality": quality_str,
                "ext": ext,
                "filesize": f.get("filesize") or f.get("filesize_approx") or None,
                "has_audio": has_audio,
                "has_video": has_video,
                "best": False
            }

            if key not in formats_by_quality:
                formats_by_quality[key] = format_item
            else:
                existing = formats_by_quality[key]
                # Keep audio+video if available
                if has_audio and not existing["has_audio"]:
                    formats_by_quality[key] = format_item
                elif has_audio == existing["has_audio"]:
                    if (format_item["filesize"] or 0) > (existing["filesize"] or 0):
                        formats_by_quality[key] = format_item

    filtered_formats = list(formats_by_quality.values())

    # Add Audio options
    audio_formats = []
    seen_audio_exts = set()
    for f in formats:
        if f.get("vcodec") == "none" and f.get("acodec") != "none":
            ext = f.get("ext", "mp3")
            if ext not in seen_audio_exts:
                seen_audio_exts.add(ext)
                audio_formats.append({
                    "itag": f.get("format_id"),
                    "quality": "Audio only",
                    "ext": ext,
                    "filesize": f.get("filesize") or f.get("filesize_approx") or None,
                    "has_audio": True,
                    "has_video": False,
                    "best": False
                })

    # Sort video formats descending by resolution then by MP4 preference
    def format_sort_key(f):
        q = f["quality"]
        match = re.match(r"(\d+)p", q)
        height = int(match.group(1)) if match else 0
        ext_priority = 2 if f["ext"] == "mp4" else 1
        return (height, ext_priority)

    filtered_formats.sort(key=format_sort_key, reverse=True)

    # Automatically highlight the best quality
    if filtered_formats:
        filtered_formats[0]["best"] = True

    result = {
        "title": info.get("title", "YouTube Video"),
        "thumbnail": info.get("thumbnail") or (info.get("thumbnails")[-1]["url"] if info.get("thumbnails") else None),
        "formats": filtered_formats,
        "audio_formats": audio_formats
    }

    info_cache[url] = (time.time(), result)
    return result

@app.get("/download")
async def download_video(url: str, itag: str, request: Request):
    client_ip = request.client.host
    if is_rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

    if not url or not validate_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    try:
        info = await asyncio.to_thread(extract_metadata, url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting download url: {str(e)}")

    selected_format = None
    for f in info.get("formats", []):
        if f.get("format_id") == itag:
            selected_format = f
            break

    if not selected_format:
        raise HTTPException(status_code=404, detail="Requested format itag not found.")

    stream_url = selected_format.get("url")
    if not stream_url:
        raise HTTPException(status_code=400, detail="Direct download stream not available.")

    filename = f"{info.get('title', 'video')}_{itag}.{selected_format.get('ext', 'mp4')}"
    filename = "".join([c if c.isalnum() or c in " ._-" else "_" for c in filename])

    async def stream_generator():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("GET", stream_url, timeout=None) as response:
                    async for chunk in response.aiter_bytes(chunk_size=128 * 1024):
                        yield chunk
            except Exception:
                pass

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": "application/octet-stream"
    }

    if selected_format.get("filesize"):
        headers["Content-Length"] = str(selected_format["filesize"])

    return StreamingResponse(stream_generator(), headers=headers)
