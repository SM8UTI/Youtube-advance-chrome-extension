(function() {
  let currentUrl = window.location.href;

  function checkUrlChange() {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      const oldBtn = document.getElementById("yt-advanced-download-btn");
      if (oldBtn) oldBtn.remove();
    }
    if (window.location.href.includes("watch?v=")) {
      injectDownloadButton();
    }
  }

  setInterval(checkUrlChange, 1000);

  if (window.location.href.includes("watch?v=")) {
    injectDownloadButton();
  }

  function injectDownloadButton() {
    if (document.getElementById("yt-advanced-download-btn")) return;

    const playerEl = document.querySelector("#movie_player");
    if (!playerEl) return;

    const selectors = [
      "ytd-watch-metadata #top-level-buttons-computed",
      "ytd-video-primary-info-renderer #top-level-buttons-computed",
      "#top-level-buttons-computed",
      "ytd-watch-metadata #actions",
      "ytd-menu-renderer.ytd-watch-metadata"
    ];

    let targetContainer = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.isConnected) {
        targetContainer = el;
        break;
      }
    }

    if (!targetContainer) return;

    const btn = document.createElement("button");
    btn.id = "yt-advanced-download-btn";
    btn.className = "yt-premium-download-btn";

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
      </svg>
      <span>Download</span>
    `;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDownloadModal();
    });

    targetContainer.appendChild(btn);
  }

  function openDownloadModal() {
    let modalOverlay = document.getElementById("yt-download-advanced-modal");
    if (modalOverlay) {
      modalOverlay.style.display = "flex";
      return;
    }

    modalOverlay = document.createElement("div");
    modalOverlay.id = "yt-download-advanced-modal";
    modalOverlay.className = "yt-modal-overlay";

    modalOverlay.innerHTML = `
      <div class="yt-modal-container">
        <div class="yt-modal-header">
          <h3 id="yt-modal-title">Advanced Downloader</h3>
          <button id="yt-modal-close-btn" class="yt-modal-close">&times;</button>
        </div>
        <div id="yt-modal-body" class="yt-modal-body">
          <div class="yt-modal-loading">
            <div class="yt-spinner"></div>
            <p>Fetching download qualities...</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector("#yt-modal-close-btn").addEventListener("click", () => {
      modalOverlay.style.display = "none";
    });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = "none";
      }
    });

    const url = window.location.href;
    fetch(`http://127.0.0.1:8000/video-info?url=${encodeURIComponent(url)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to extract video info.");
        return res.json();
      })
      .then(data => {
        renderModalContent(data);
      })
      .catch(err => {
        renderError(err.message);
      });
  }

  function renderModalContent(data) {
    const modalBody = document.getElementById("yt-modal-body");
    if (!modalBody) return;

    chrome.storage.local.get(["lastSelectedQuality"], (res) => {
      const lastQuality = res.lastSelectedQuality || null;

      // Render Video Formats
      let videoFormatsHtml = "";
      if (data.formats && data.formats.length > 0) {
        data.formats.forEach(f => {
          const isBest = f.best;
          const isSelected = lastQuality === f.quality;
          const bestBadge = isBest ? `<span class="yt-badge-best">BEST QUALITY</span>` : "";
          const sizeStr = f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : "Unknown Size";

          videoFormatsHtml += `
            <div class="yt-format-row ${isBest ? "yt-best-option" : ""} ${isSelected ? "yt-last-selected" : ""}">
              <div class="yt-format-info">
                <span class="yt-format-quality">${f.quality} - ${f.ext.toUpperCase()}</span>
                ${bestBadge}
                <span class="yt-format-size">${sizeStr}</span>
              </div>
              <button class="yt-format-download-btn" data-itag="${f.itag}" data-quality="${f.quality}">
                Download
              </button>
            </div>
          `;
        });
      } else {
        videoFormatsHtml = `<p class="yt-empty-formats">No video formats available.</p>`;
      }

      // Render Audio Formats
      let audioFormatsHtml = "";
      const audios = data.audio_formats || [];
      if (audios.length > 0) {
        audios.forEach(f => {
          const sizeStr = f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(1)} MB` : "Unknown Size";
          audioFormatsHtml += `
            <div class="yt-format-row">
              <div class="yt-format-info">
                <span class="yt-format-quality">${f.quality} - ${f.ext.toUpperCase()}</span>
                <span class="yt-format-size">${sizeStr}</span>
              </div>
              <button class="yt-format-download-btn" data-itag="${f.itag}" data-quality="Audio">
                Download
              </button>
            </div>
          `;
        });
      } else {
        audioFormatsHtml = `<p class="yt-empty-formats">No audio formats available.</p>`;
      }

      modalBody.innerHTML = `
        <div class="yt-meta-row">
          <img class="yt-meta-thumb" src="${data.thumbnail}" alt="Video Thumbnail" />
          <div class="yt-meta-details">
            <h4 class="yt-meta-title">${data.title}</h4>
          </div>
        </div>
        <div class="yt-tabs-header">
          <button id="yt-tab-btn-video" class="yt-tab-btn yt-tab-active" data-tab="video">Video Options</button>
          <button id="yt-tab-btn-audio" class="yt-tab-btn" data-tab="audio">Audio Options</button>
        </div>
        <div id="yt-tab-content-video" class="yt-tab-content">
          <div class="yt-formats-list">
            ${videoFormatsHtml}
          </div>
        </div>
        <div id="yt-tab-content-audio" class="yt-tab-content" style="display:none;">
          <div class="yt-formats-list">
            ${audioFormatsHtml}
          </div>
        </div>
        <div id="yt-download-progress-container" class="yt-progress-container" style="display:none;">
          <div class="yt-progress-bar-wrapper">
            <div id="yt-download-progress-bar" class="yt-progress-bar" style="width:0%;"></div>
          </div>
          <p id="yt-download-progress-status" class="yt-progress-status">Starting download...</p>
        </div>
      `;

      // Tab logic
      const videoBtn = modalBody.querySelector("#yt-tab-btn-video");
      const audioBtn = modalBody.querySelector("#yt-tab-btn-audio");
      const videoContent = modalBody.querySelector("#yt-tab-content-video");
      const audioContent = modalBody.querySelector("#yt-tab-content-audio");

      videoBtn.addEventListener("click", () => {
        videoBtn.classList.add("yt-tab-active");
        audioBtn.classList.remove("yt-tab-active");
        videoContent.style.display = "block";
        audioContent.style.display = "none";
      });

      audioBtn.addEventListener("click", () => {
        audioBtn.classList.add("yt-tab-active");
        videoBtn.classList.remove("yt-tab-active");
        audioContent.style.display = "block";
        videoContent.style.display = "none";
      });

      modalBody.querySelectorAll(".yt-format-download-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const itag = btn.getAttribute("data-itag");
          const quality = btn.getAttribute("data-quality");

          if (quality !== "Audio") {
            chrome.storage.local.set({ lastSelectedQuality: quality });
          }
          startDownloadFlow(itag, quality);
        });
      });
    });
  }

  function startDownloadFlow(itag, quality) {
    const currentUrl = window.location.href;
    const downloadUrl = `http://127.0.0.1:8000/download?url=${encodeURIComponent(currentUrl)}&itag=${itag}`;

    const progressContainer = document.getElementById("yt-download-progress-container");
    const progressBar = document.getElementById("yt-download-progress-bar");
    const progressStatus = document.getElementById("yt-download-progress-status");

    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "40%";
    if (progressStatus) progressStatus.textContent = "Starting your download...";

    chrome.runtime.sendMessage({ action: "download", url: downloadUrl }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        if (progressBar) progressBar.style.width = "0%";
        if (progressStatus) {
          progressStatus.textContent = `Error: ${response ? response.error : (chrome.runtime.lastError ? chrome.runtime.lastError.message : "Download failed.")}`;
          progressStatus.style.color = "#FF4B4B";
        }
      } else {
        if (progressBar) progressBar.style.width = "100%";
        if (progressStatus) {
          progressStatus.textContent = "Successfully triggered in the browser!";
          progressStatus.style.color = "#28A745";
        }
      }
    });
  }

  function renderError(message) {
    const modalBody = document.getElementById("yt-modal-body");
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="yt-modal-error">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#FF4B4B">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>${message || "An error occurred while loading the formats."}</p>
        </div>
      `;
    }
  }
})();
