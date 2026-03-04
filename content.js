// Shortcut - Content Script

let filterEnabled = true;
let hiddenCount = 0;
let observer = null;

// Load settings from storage
chrome.storage.sync.get(['filterEnabled'], (result) => {
  filterEnabled = result.filterEnabled !== false; // default ON
  if (filterEnabled) {
    init();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_FILTER') {
    filterEnabled = message.enabled;
    if (filterEnabled) {
      init();
      filterAll();
    } else {
      showAll();
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
    sendResponse({ hiddenCount });
  }
  if (message.type === 'GET_STATUS') {
    sendResponse({ filterEnabled, hiddenCount });
  }
});

function isShort(element) {
  // Method 1: Check for shorts shelf/section
  if (element.tagName && element.tagName.toLowerCase() === 'ytd-reel-shelf-renderer') return true;
  if (element.tagName && element.tagName.toLowerCase() === 'ytd-shorts') return true;

  // Method 2: Check href links containing /shorts/
  const links = element.querySelectorAll ? element.querySelectorAll('a[href]') : [];
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('/shorts/')) return true;
  }

  // Method 3: Check for "Shorts" label text in shelf titles
  const titleEl = element.querySelector ? element.querySelector('#title, .title, ytd-shelf-renderer #title-text') : null;
  if (titleEl && titleEl.textContent.trim().toLowerCase() === 'shorts') return true;

  // Method 4: aria labels / badges
  const badges = element.querySelectorAll ? element.querySelectorAll('[aria-label="Shorts"], ytd-badge-supported-renderer') : [];
  for (const badge of badges) {
    if (badge.textContent && badge.textContent.trim().toUpperCase() === 'SHORTS') return true;
  }

  // Method 5: overlay badge
  const overlayBadge = element.querySelector ? element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') : null;
  if (overlayBadge) return true;

  // Method 6: Check for shorts in the URL of video renderer
  const videoLink = element.querySelector ? element.querySelector('a#thumbnail, a.ytd-thumbnail') : null;
  if (videoLink) {
    const href = videoLink.getAttribute('href') || '';
    if (href.startsWith('/shorts/')) return true;
  }

  return false;
}

function filterElement(element) {
  if (!filterEnabled) return;
  if (element.__shortsFiltered) return;

  if (isShort(element)) {
    element.style.display = 'none';
    element.__shortsFiltered = true;
    element.__wasHidden = true;
    hiddenCount++;
    updateBadge();
  }
}

function filterAll() {
  if (!filterEnabled) return;

  // Target all common YouTube video container elements
  const selectors = [
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-compact-video-renderer',
    'ytd-reel-shelf-renderer',
    'ytd-reel-item-renderer',
    'ytd-shorts',
    'ytd-shelf-renderer',
    'ytd-item-section-renderer',
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      filterElement(el);
    });
  });

  // Also hide the entire Shorts sidebar link
  document.querySelectorAll('ytd-guide-entry-renderer').forEach(el => {
    const titleEl = el.querySelector('.title');
    if (titleEl && titleEl.textContent.trim().toLowerCase() === 'shorts') {
      el.style.display = 'none';
      el.__shortsFiltered = true;
    }
  });

  // Hide Shorts section in mini guide
  document.querySelectorAll('ytd-mini-guide-entry-renderer').forEach(el => {
    const label = el.getAttribute('aria-label') || '';
    if (label.toLowerCase() === 'shorts') {
      el.style.display = 'none';
      el.__shortsFiltered = true;
    }
  });
}

function showAll() {
  document.querySelectorAll('*').forEach(el => {
    if (el.__wasHidden) {
      el.style.display = '';
      el.__wasHidden = false;
      el.__shortsFiltered = false;
    }
  });
  hiddenCount = 0;
  updateBadge();
}

function updateBadge() {
  chrome.runtime.sendMessage({ type: 'UPDATE_COUNT', count: hiddenCount }).catch(() => {});
}

function init() {
  // Run immediately
  filterAll();

  // Watch for dynamic content (YouTube is a SPA)
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    if (!filterEnabled) return;

    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return; // Element nodes only

        // Check the node itself
        filterElement(node);

        // Check children
        const selectors = [
          'ytd-video-renderer',
          'ytd-grid-video-renderer',
          'ytd-rich-item-renderer',
          'ytd-compact-video-renderer',
          'ytd-reel-shelf-renderer',
          'ytd-reel-item-renderer',
          'ytd-shorts',
          'ytd-shelf-renderer',
          'ytd-guide-entry-renderer',
          'ytd-mini-guide-entry-renderer',
        ];

        selectors.forEach(selector => {
          if (node.querySelectorAll) {
            node.querySelectorAll(selector).forEach(el => filterElement(el));
          }
        });
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// Handle YouTube SPA navigation (yt-navigate-finish fires on page changes)
window.addEventListener('yt-navigate-finish', () => {
  if (filterEnabled) {
    hiddenCount = 0;
    setTimeout(filterAll, 300); // small delay for DOM to settle
    setTimeout(filterAll, 800);
    setTimeout(filterAll, 1500);
  }
});
