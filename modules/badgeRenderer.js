const BadgeRenderer = {
  processVideo(video) {
    if (video.dataset.badgeProcessed === "true") return;

    const isLive = video.querySelector('[overlay-style="LIVE"]') || video.querySelector('.badge-style-type-live-now-alternate');
    if (isLive) {
      video.dataset.badgeProcessed = "true";
      return; 
    }

    const timeElements = video.querySelectorAll('ytd-thumbnail-overlay-time-status-renderer span#text, ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text');
    let durationText = '';
    for (let el of timeElements) {
       const text = el.textContent || '';
       if (text.includes(':')) {
           durationText = text.trim();
           break;
       }
    }

    if (!durationText) {
        const ariaEl = video.querySelector('#video-title, #video-title-link, a#thumbnail');
        if (ariaEl) {
            const label = ariaEl.getAttribute('aria-label') || '';
            if (label.match(/\d+\s*(second|minute|hour)s?/i)) {
                durationText = label;
            }
        }
    }

    const durationInSeconds = DurationParser.parse(durationText);
    const isShort = video.querySelector('[overlay-style="SHORTS"]') || video.querySelector('[href^="/shorts/"]') || video.tagName.toLowerCase() === 'ytd-reel-item-renderer';

    if (durationInSeconds > 0 && !isShort) {
      this.injectBadge(video, durationInSeconds);
    }

    video.dataset.badgeProcessed = "true";
  },

  injectBadge(video, seconds) {
    const minutes = seconds / 60;
    let badgeClass = '';
    let label = '';

    if (minutes < 5) {
      badgeClass = 'badge-red';
      label = '< 5m';
    } else if (minutes <= 20) {
      badgeClass = 'badge-orange';
      label = '5-20m';
    } else if (minutes <= 60) {
      badgeClass = 'badge-green';
      label = '20-60m';
    } else {
      badgeClass = 'badge-blue';
      label = '> 1hr';
    }

    const thumbnail = video.querySelector('ytd-thumbnail');
    if (thumbnail) {
      if (thumbnail.querySelector('.yt-learning-badge')) return; 

      const badge = document.createElement('div');
      badge.className = `yt-learning-badge ${badgeClass}`;
      badge.textContent = label;
      thumbnail.style.position = 'relative';
      thumbnail.appendChild(badge);
    }
  },

  removeAll() {
    document.querySelectorAll('.yt-learning-badge').forEach(e => e.remove());
    document.querySelectorAll('[data-badge-processed]').forEach(v => {
      delete v.dataset.badgeProcessed;
    });
  }
};
