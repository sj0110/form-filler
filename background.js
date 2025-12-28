// Background service worker (minimal - PDF parsing moved to popup)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Background script can handle other tasks if needed
  // PDF parsing is now done in popup.js where DOM is available
  return true;
});

