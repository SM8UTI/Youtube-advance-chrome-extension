/**
 * ObserverManager Module
 * Centralized DOM mutation and navigation management for optimized filtering.
 */
const ObserverManager = {
  observer: null,
  isNavigating: false,

  /**
   * Initializes the mutation observer on ytd-app.
   * @param {Function} onMutation - Callback for new mutations.
   * @param {Function} onNavigation - Callback for navigation changes.
   */
  init(onMutation, onNavigation) {
    const target = document.querySelector('ytd-app');
    if (!target) {
      // Check context before retrying
      if (!StorageManager.isValid()) return;
      
      console.warn('[ObserverManager] ytd-app not found, retrying in 500ms...');
      setTimeout(() => this.init(onMutation, onNavigation), 500);
      return;
    }

    // 1. Mutation Observer
    this.observer = new MutationObserver((mutations) => {
      // Guard: Stop if context is dead
      if (!StorageManager.isValid()) {
        this.observer.disconnect();
        return;
      }

      let filteredMutations = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          filteredMutations = true;
          break;
        }
      }
      if (filteredMutations) {
        onMutation();
      }
    });

    this.observer.observe(target, {
      childList: true,
      subtree: true
    });

    // 2. Navigation Detection
    window.addEventListener('yt-navigate-finish', () => {
      if (StorageManager.isValid()) {
        onNavigation();
      }
    });

    // History API override for SPA behavior
    const originalPushState = history.pushState;
    const self = this;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      if (StorageManager.isValid()) {
        onNavigation();
      }
    };

    console.log('[ObserverManager] Initialized');
  },


  /**
   * Debounce helper function.
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
};
