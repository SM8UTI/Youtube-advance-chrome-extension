const UIInjector = {
  inject() {
    if (document.getElementById('yt-custom-duration-filter')) return;

    // Build the UI wrapper
    const filterContainer = document.createElement('div');
    filterContainer.id = 'yt-custom-duration-filter';
    filterContainer.innerHTML = `
      <div class="custom-filter-wrapper">
        <select id="duration-select">
          <option value="all">Any Duration</option>
          <option value="under-5">Under 5 minutes</option>
          <option value="5-10">5–10 minutes</option>
          <option value="10-20">10–20 minutes</option>
          <option value="20-60">20–60 minutes</option>
          <option value="1-3-hr">1–3 hours</option>
          <option value="3-10-hr">3–10 hours</option>
          <option value="over-10-hr">Over 10 hours</option>
          <option value="custom">Custom...</option>
        </select>
        
        <div id="custom-range-inputs" style="display: none;">
          <input type="number" id="min-min" placeholder="Min" min="0">
          <span style="color:var(--yt-spec-text-primary, #fff)">-</span>
          <input type="number" id="max-min" placeholder="Max" min="0">
          <select id="custom-unit">
            <option value="60">Min</option>
            <option value="3600">Hour</option>
          </select>
          <button id="apply-custom-btn">Apply</button>
        </div>

        <label class="toggle-switch" title="Shortcut: Alt+F / Opt+F">
          <input type="checkbox" id="filter-toggle" checked>
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Inject as a floating UI layer at the bottom right. Avoids fragile DOM structures in YouTube angular updates.
    document.body.appendChild(filterContainer);

    this.bindEvents();
    this.loadState();
  },

  bindEvents() {
    const select = document.getElementById('duration-select');
    const customInputs = document.getElementById('custom-range-inputs');
    const applyBtn = document.getElementById('apply-custom-btn');
    const toggle = document.getElementById('filter-toggle');
    const minInput = document.getElementById('min-min');
    const maxInput = document.getElementById('max-min');
    const unitSelect = document.getElementById('custom-unit');

    // Handle dropdown selection
    select.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'custom') {
        customInputs.style.display = 'flex';
      } else {
        customInputs.style.display = 'none';
        if (toggle.checked) {
          FilterEngine.setFilter(val);
        }
      }
      this.saveState();
    });

    // Handle custom duration form submission
    applyBtn.addEventListener('click', () => {
      const min = parseInt(minInput.value) || 0;
      const max = parseInt(maxInput.value) || Infinity;
      const unitMultiplier = parseInt(unitSelect.value) || 60;
      if (toggle.checked) {
        FilterEngine.setFilter('custom', { min: min * unitMultiplier, max: max === Infinity ? Infinity : max * unitMultiplier });
      }
      this.saveState();
    });

    // Master switch ON/OFF
    toggle.addEventListener('change', (e) => {
      if (e.target.checked) {
         const val = select.value;
         if (val === 'custom') {
             applyBtn.click();
         } else {
             FilterEngine.setFilter(val);
         }
      } else {
         FilterEngine.resetFilter();
      }
      this.saveState();
    });
  },

  saveState() {
     const select = document.getElementById('duration-select');
     const toggle = document.getElementById('filter-toggle');
     const minInput = document.getElementById('min-min');
     const maxInput = document.getElementById('max-min');
     const unitSelect = document.getElementById('custom-unit');
     
     chrome.storage.local.set({
         filterState: {
             selected: select.value,
             enabled: toggle.checked,
             min: minInput.value,
             max: maxInput.value,
             unit: unitSelect.value
         }
     });
  },

  loadState() {
     chrome.storage.local.get('filterState', (data) => {
         if (data && data.filterState) {
             const state = data.filterState;
             document.getElementById('duration-select').value = state.selected || 'all';
             document.getElementById('filter-toggle').checked = state.enabled !== false;
             document.getElementById('min-min').value = state.min || '';
             document.getElementById('max-min').value = state.max || '';
             if (state.unit) document.getElementById('custom-unit').value = state.unit;
             
             if (state.selected === 'custom') {
                 document.getElementById('custom-range-inputs').style.display = 'flex';
             }

             // Auto apply filter based on memory
             if (state.enabled !== false) {
                 if (state.selected === 'custom') {
                     document.getElementById('apply-custom-btn').click();
                 } else {
                     FilterEngine.setFilter(state.selected || 'all');
                 }
             }
         }
     });
  }
};
