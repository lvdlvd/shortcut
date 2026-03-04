const toggle = document.getElementById('toggleFilter');
const hiddenCountEl = document.getElementById('hiddenCount');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Load saved state
chrome.storage.sync.get(['filterEnabled'], (result) => {
  const enabled = result.filterEnabled !== false;
  toggle.checked = enabled;
  updateUI(enabled);
});

// Get current count from active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response) {
        toggle.checked = response.filterEnabled;
        hiddenCountEl.textContent = response.hiddenCount;
        updateUI(response.filterEnabled);
      }
    });
  }
});

// Toggle handler
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ filterEnabled: enabled });
  updateUI(enabled);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_FILTER', enabled }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          hiddenCountEl.textContent = response.hiddenCount;
        }
      });
    }
  });
});

function updateUI(enabled) {
  if (enabled) {
    statusDot.classList.remove('off');
    statusText.textContent = 'Active on this tab';
  } else {
    statusDot.classList.add('off');
    statusText.textContent = 'Filter is disabled';
  }
}
