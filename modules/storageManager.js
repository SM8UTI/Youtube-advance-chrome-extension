const StorageManager = {
  defaultState: {
    antiDistraction: true,
    smartClean: true,
    durationBadges: true,
    compactView: false,
    filterEnabled: true,
    filterId: 'all',
    customMin: '',
    customMax: '',
    customUnit: 'minutes'
  },

  /**
   * Checks if the extension context is still valid.
   */
  isValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  },

  async get() {
    if (!this.isValid()) {
      console.warn('[StorageManager] Context invalidated. Returning default state.');
      return this.defaultState;
    }

    return new Promise(resolve => {
      try {
        chrome.storage.local.get('learningState', data => {
          if (chrome.runtime.lastError) {
            console.error('[StorageManager] Storage error:', chrome.runtime.lastError);
            resolve(this.defaultState);
          } else {
            resolve(data.learningState || this.defaultState);
          }
        });
      } catch (e) {
        console.warn('[StorageManager] Catch block: Context invalidated.');
        resolve(this.defaultState);
      }
    });
  },

  async set(state) {
    if (!this.isValid()) return;

    return new Promise(resolve => {
      try {
        chrome.storage.local.set({ learningState: state }, () => {
          if (chrome.runtime.lastError) {
            console.error('[StorageManager] Set storage error:', chrome.runtime.lastError);
          }
          resolve();
        });
      } catch (e) {
        console.warn('[StorageManager] Catch block: Context invalidated during set.');
        resolve();
      }
    });
  }
};

