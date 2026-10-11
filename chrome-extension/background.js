let currentTab = null;
let startTime = Date.now();

async function trackActiveTab() {
  const now = Date.now();

  // Save time spent on the previous tab
  if (currentTab && now > startTime) {
    const seconds = Math.floor((now - startTime) / 1000);

    if (seconds > 0) {
      try {
        await fetch("http://localhost:5000/api/browser-activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            domain: currentTab.domain,
            title: currentTab.title,
            seconds
          })
        });
      } catch (error) {
        // The app server may be stopped; the extension remains optional.
      }
    }
  }

  startTime = now;
  currentTab = null;

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    if (tabs.length > 0 && tabs[0].url) {
      const tab = tabs[0];
      const url = new URL(tab.url);

      if (url.protocol === "http:" || url.protocol === "https:") {
        currentTab = {
          domain: url.hostname,
          title: tab.title || url.hostname
        };
      }
    }
  } catch (error) {
    // Ignore unavailable or restricted tabs.
  }
}

chrome.tabs.onActivated.addListener(trackActiveTab);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === "complete")) {
    trackActiveTab();
  }
});

chrome.windows.onFocusChanged.addListener(() => {
  trackActiveTab();
});

chrome.runtime.onStartup.addListener(trackActiveTab);
chrome.runtime.onInstalled.addListener(trackActiveTab);