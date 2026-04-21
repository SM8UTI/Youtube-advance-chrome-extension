/**
 * Content Script Entry Point
 * Initializes the Filtering Engine and UI Panel.
 */

async function applyAllFeatures() {
  const state = await StorageManager.get();
  await VideoTypeEnforcer.enforce(state);
  await FilterEngine.refreshState();
}

async function init() {
  const state = await StorageManager.get();
  
  // 1. Initialize UIPanel (injects the settings UI)
  UIPanel.inject(state, applyAllFeatures);

  // 2. Initialize FilterEngine
  await FilterEngine.init();

  // 3. Initialize ObserverManager
  const debouncedApply = ObserverManager.debounce(() => FilterEngine.apply(), 250);
  
  ObserverManager.init(
    // On DOM Mutation (Infinite Scrolling)
    () => debouncedApply(),
    // On Navigation (SPA Transition)
    () => FilterEngine.refreshState()
  );

  // Initial trigger
  await VideoTypeEnforcer.enforce(state);
  FilterEngine.apply();
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

