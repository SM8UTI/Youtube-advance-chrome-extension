/**
 * VideoScanner Module
 * Responsible for robust detection of video containers across different YouTube pages.
 */
const VideoScanner = {
  // Target all possible video containers
  selectors: [
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-compact-video-renderer',
    'ytd-shelf-renderer',
    'ytd-reel-item-renderer'
  ],

  /**
   * Scans the DOM for video elements that haven't been processed yet.
   * @returns {Array<HTMLElement>}
   */
  scan(root = document) {
    const selectorString = this.selectors.join(', ');
    const allVideos = root.querySelectorAll(selectorString);
    
    // Filter out already processed elements using the data attribute
    return Array.from(allVideos).filter(video => video.dataset.processed !== 'true');
  },

  /**
   * Robust selector for the duration label within a video card.
   * @(param) {HTMLElement} videoElement
   * @returns {HTMLElement|null}
   */
  getDurationElement(videoElement) {
    const timeSelectors = [
      'span#text.ytd-thumbnail-overlay-time-status-renderer',
      'ytd-thumbnail-overlay-time-status-renderer',
      '.badge-shape-wiz__text',
      '#time-status span',
      '.ytd-thumbnail-overlay-time-status-renderer span'
    ];

    for (const selector of timeSelectors) {
      const el = videoElement.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el;
      }
    }
    return null;
  }
};
