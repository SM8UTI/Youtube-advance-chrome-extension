/**
 * FilterEngine Module
 * Central coordinator for scanning, parsing, and filtering videos.
 */
const FilterEngine = {
  activeState: null,
  debug: true,

  // Pre-defined ranges in seconds
  ranges: {
    'all': { min: 0, max: Infinity },
    'under-5': { min: 0, max: 5 * 60 },
    '5-10': { min: 5 * 60, max: 10 * 60 },
    '10-20': { min: 10 * 60, max: 20 * 60 },
    '20-60': { min: 20 * 60, max: 60 * 60 },
    '1-3-hr': { min: 1 * 3600, max: 3 * 3600 },
    '3-10-hr': { min: 3 * 3600, max: 10 * 3600 },
    'over-10-hr': { min: 10 * 3600, max: Infinity }
  },

  /**
   * Initializes the engine with the current storage state.
   */
  async init() {
    this.activeState = await StorageManager.get();
    this.log('Initialized with state:', this.activeState);
  },

  /**
   * Applies filters to all unprocessed videos.
   */
  apply() {
    if (!this.activeState || !this.activeState.filterEnabled) {
      this.resetAllProcessing();
      return;
    }

    const videos = VideoScanner.scan();
    if (videos.length > 0) {
      this.log(`Processing ${videos.length} new videos...`);
      videos.forEach(video => this.processVideo(video));
    }
  },

  /**
   * Processes a single video card.
   * Implements retry mechanism if duration is missing.
   * @param {HTMLElement} videoElement
   * @param {number} retryCount
   */
  processVideo(videoElement, retryCount = 0) {
    const durationEl = VideoScanner.getDurationElement(videoElement);
    const durationText = durationEl ? durationEl.textContent.trim() : null;
    const durationValue = DurationParser.parse(durationText);

    // 1. Check for missing duration (Retry Logic)
    if (durationValue === null) {
      if (retryCount < 3) {
        this.log(`Duration missing for video, retrying (${retryCount + 1}/3)...`);
        setTimeout(() => this.processVideo(videoElement, retryCount + 1), 1000);
      } else {
        // After 3 retries, mark as processed anyway to avoid infinite loop
        videoElement.dataset.processed = 'true';
      }
      return;
    }

    // 2. Mark as processed
    videoElement.dataset.processed = 'true';

    // 3. Apply Filter Logic
    const range = this.getCurrentRange();
    
    // Handle LIVE videos
    if (durationValue === 'LIVE') {
      // Typically hide LIVE if a specific duration range is set
      if (range.min > 0 || range.max < Infinity) {
        this.hideElement(videoElement);
      } else {
        this.showElement(videoElement);
      }
      return;
    }

    // Handle Shorts (Harsher check)
    const isShort = videoElement.querySelector('[overlay-style="SHORTS"]') || 
                    videoElement.querySelector('[href^="/shorts/"]') || 
                    videoElement.tagName.toLowerCase() === 'ytd-reel-item-renderer';

    if (isShort) {
      this.hideElement(videoElement);
      return;
    }

    // Normal video filtering
    if (durationValue >= range.min && durationValue <= range.max) {
      this.showElement(videoElement);
    } else {
      this.hideElement(videoElement);
    }
  },

  /**
   * Calculates the current min/max seconds based on UI state.
   */
  getCurrentRange() {
    if (this.activeState.filterId === 'custom') {
      const multiplier = this.activeState.customUnit === 'hours' ? 3600 : 60;
      const min = parseFloat(this.activeState.customMin) || 0;
      const max = (this.activeState.customMax === '' || isNaN(parseFloat(this.activeState.customMax))) ? Infinity : parseFloat(this.activeState.customMax);
      return { min: min * multiplier, max: max * multiplier };
    }
    return this.ranges[this.activeState.filterId] || this.ranges['all'];
  },

  /**
   * Resets the 'processed' flag on all videos (used when filter settings change).
   */
  resetAllProcessing() {
    const selector = VideoScanner.selectors.join(', ');
    document.querySelectorAll(selector).forEach(el => {
      delete el.dataset.processed;
      this.showElement(el);
    });
  },

  /**
   * Navigation and change handler.
   */
  async refreshState() {
    this.activeState = await StorageManager.get();
    this.resetAllProcessing();
    this.apply();
  },

  /**
   * Helper to hide element.
   */
  hideElement(el) {
    el.style.display = 'none';
  },

  /**
   * Helper to show element.
   */
  showElement(el) {
    el.style.display = '';
  },

  /**
   * Debug logger.
   */
  log(...args) {
    if (this.debug) {
      console.log('[FilterEngine]', ...args);
    }
  }
};

