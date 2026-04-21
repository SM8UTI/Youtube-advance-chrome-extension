/**
 * VideoTypeEnforcer Module
 * Automatically applies the YouTube "Type: Video" filter when custom duration filters are enabled.
 */
const VideoTypeEnforcer = {
  VIDEO_FILTER_PARAM: 'EgIQAQ%3D%3D', // Encoded value for "Type: Video"
  SESSION_FLAG: 'videoFilterApplied',

  /**
   * Enforces the "Video" type filter if appropriate.
   * @param {Object} state - The current extension state.
   */
  async enforce(state) {
    // 1. Only run on search results page
    if (window.location.pathname !== '/results') {
      return;
    }

    // 2. Check if duration filter is enabled
    // Note: state.filterEnabled is the property from StorageManager
    if (!state || !state.filterEnabled) {
      return;
    }

    // 3. Check if the "Type: Video" filter is already applied in URL
    const url = new URL(window.location.href);
    const currentSp = url.searchParams.get('sp');
    
    // YouTube's 'sp' parameter for Video type is typically EgIQAQ%3D%3D (which encodes to EgIQAQ%253D%253D in URL)
    if (currentSp === this.VIDEO_FILTER_PARAM || currentSp === decodeURIComponent(this.VIDEO_FILTER_PARAM)) {
      return;
    }

    // 4. Prevent infinite reload loop using sessionStorage
    if (sessionStorage.getItem(this.SESSION_FLAG)) {
      // Re-load detected, don't redirect again
      // We clear it after a short delay so manual searches can still trigger it
      setTimeout(() => sessionStorage.removeItem(this.SESSION_FLAG), 2000);
      return;
    }

    // 5. Apply filter (Safe Redirect)
    console.log('[VideoTypeEnforcer] Automatically applying "Type: Video" filter...');
    
    sessionStorage.setItem(this.SESSION_FLAG, 'true');
    
    // Set the parameter. url.searchParams.set will handle the extra encoding needed
    url.searchParams.set('sp', this.VIDEO_FILTER_PARAM);
    
    window.location.href = url.toString();
  }
};
