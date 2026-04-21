const DOMCleaner = {
  apply(state) {
    if (state.antiDistraction) {
      document.body.classList.add('distraction-free');
      this.toggleShorts(true);
    } else {
      document.body.classList.remove('distraction-free');
      this.toggleShorts(false);
    }
  },

  toggleShorts(hide) {
    const shortsShelves = document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer');
    shortsShelves.forEach(shelf => {
      const isShortsShelf = shelf.querySelector('ytd-reel-item-renderer') || shelf.querySelector('[overlay-style="SHORTS"]');
      if (isShortsShelf) {
        shelf.style.display = hide ? 'none' : '';
      }
    });

    const videos = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer');
    videos.forEach(video => {
      const isShort = video.tagName.toLowerCase() === 'ytd-reel-item-renderer' || video.querySelector('[overlay-style="SHORTS"]') || video.querySelector('[href^="/shorts/"]');
      if (isShort) {
        video.style.display = hide ? 'none' : '';
      }
    });
  }
};
