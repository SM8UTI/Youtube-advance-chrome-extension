const UIPanel = {
  inject(state, onStateChange) {
    if (document.getElementById('yt-learning-panel-container')) return;

    const container = document.createElement('div');
    container.id = 'yt-learning-panel-container';

    // Floating Action Button
    const fabButton = document.createElement('div');
    fabButton.id = 'yt-learning-fab';
    fabButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
      </svg>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.id = 'yt-learning-panel';
    panel.style.display = 'none';

    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-drag-handle">Duration Filter</div>
        <div class="panel-close-btn">&times;</div>
      </div>

      <div class="panel-toggle-row">
        <span>Enable Filter</span>
        <label class="toggle-switch">
          <input type="checkbox" id="toggle-filterEnabled" ${state.filterEnabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>

      <div id="filter-controls" style="display: ${state.filterEnabled ? 'block' : 'none'}; padding-top: 4px;">
        <select id="filter-dropdown" class="yt-learning-select">
          <option value="all"      ${state.filterId === 'all'       ? 'selected' : ''}>Any Duration</option>
          <option value="under-5"  ${state.filterId === 'under-5'   ? 'selected' : ''}>Under 5 minutes</option>
          <option value="5-10"     ${state.filterId === '5-10'      ? 'selected' : ''}>5 – 10 minutes</option>
          <option value="10-20"    ${state.filterId === '10-20'     ? 'selected' : ''}>10 – 20 minutes</option>
          <option value="20-60"    ${state.filterId === '20-60'     ? 'selected' : ''}>20 – 60 minutes</option>
          <option value="1-3-hr"   ${state.filterId === '1-3-hr'    ? 'selected' : ''}>1 – 3 hours</option>
          <option value="3-10-hr"  ${state.filterId === '3-10-hr'   ? 'selected' : ''}>3 – 10 hours</option>
          <option value="over-10-hr" ${state.filterId === 'over-10-hr' ? 'selected' : ''}>Over 10 hours</option>
          <option value="custom"   ${state.filterId === 'custom'    ? 'selected' : ''}>Custom Range</option>
        </select>

        <div id="custom-range-inputs" style="display: ${state.filterId === 'custom' ? 'flex' : 'none'};">
          <input type="number" id="custom-min" placeholder="Min" min="0" value="${state.customMin}">
          <span>to</span>
          <input type="number" id="custom-max" placeholder="Max" min="0" value="${state.customMax}">
          <select id="custom-unit" class="yt-learning-select-small">
            <option value="minutes" ${state.customUnit === 'minutes' ? 'selected' : ''}>Min</option>
            <option value="hours"   ${state.customUnit === 'hours'   ? 'selected' : ''}>Hour</option>
          </select>
        </div>
      </div>
    `;

    container.appendChild(fabButton);
    container.appendChild(panel);
    document.body.appendChild(container);

    this.makeDraggable(panel);
    this.bindEvents(onStateChange, panel, fabButton);
  },

  bindEvents(onStateChange, panel, fabButton) {
    fabButton.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') fabButton.style.display = 'none';
    });

    panel.querySelector('.panel-close-btn').addEventListener('click', () => {
      panel.style.display = 'none';
      fabButton.style.display = 'flex';
    });

    const updateState = async (updates) => {
      const state = await StorageManager.get();
      Object.assign(state, updates);
      await StorageManager.set(state);
      onStateChange();
    };

    document.getElementById('toggle-filterEnabled').addEventListener('change', async (e) => {
      document.getElementById('filter-controls').style.display = e.target.checked ? 'block' : 'none';
      updateState({ filterEnabled: e.target.checked });
    });

    document.getElementById('filter-dropdown').addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('custom-range-inputs').style.display = isCustom ? 'flex' : 'none';
      updateState({ filterId: e.target.value });
    });

    document.getElementById('custom-min').addEventListener('input', (e) => { updateState({ customMin: e.target.value }); });
    document.getElementById('custom-max').addEventListener('input', (e) => { updateState({ customMax: e.target.value }); });
    document.getElementById('custom-unit').addEventListener('change', (e) => { updateState({ customUnit: e.target.value }); });
  },

  makeDraggable(panel) {
    const handle = panel.querySelector('.panel-drag-handle');
    let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    handle.addEventListener('mousedown', e => { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; isDragging = true; });
    document.addEventListener('mouseup', () => { initialX = currentX; initialY = currentY; isDragging = false; });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      currentX = e.clientX - initialX; currentY = e.clientY - initialY;
      xOffset = currentX; yOffset = currentY;
      panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    });
  }
};
