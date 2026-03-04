# Shortcut

A minimal Chrome extension that removes YouTube Shorts from your feed, search results, and sidebar — so you only see real videos.

## Features

- Hides Shorts from the homepage, search results, and recommendations
- Removes the Shorts section from the YouTube sidebar navigation
- Toggle on/off from the extension popup without reloading the page
- Shows a live count of how many Shorts have been filtered this session
- Works with YouTube's single-page navigation (no reload needed when browsing)
- Remembers your on/off preference across browser sessions

## Installation

Shortcut is not yet on the Chrome Web Store. Install it manually in a few steps:

1. [Download the latest release](../../releases/latest) and unzip it
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked** and select the unzipped `shortcut` folder
5. Navigate to YouTube — Shorts will be hidden immediately

To update, replace the folder contents with the new version and click the refresh icon on the extension card in `chrome://extensions/`.

## How it works

Shortcut uses a `MutationObserver` to watch for dynamically loaded content as YouTube renders its pages. It identifies Shorts by checking element tags, link hrefs starting with `/shorts/`, thumbnail overlay badges, and shelf titles — then hides matching elements before they're visible to you. A CSS stylesheet provides an additional fallback layer.

## License

This is free and unencumbered software released into the public domain. See [LICENSE](LICENSE) for details.
