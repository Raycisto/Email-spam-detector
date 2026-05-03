// SpamShield AI — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("SpamShield AI installed.");
  chrome.storage.local.set({
    stats: { scanned: 0, flagged: 0 },
    gmailAutoScan: false
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "updateStats") {
    chrome.storage.local.get("stats", (data) => {
      const stats = data.stats || { scanned: 0, flagged: 0 };
      stats.scanned += 1;
      if (msg.isSpam) stats.flagged += 1;
      chrome.storage.local.set({ stats });
      sendResponse({ ok: true, stats });
    });
    return true; // async
  }
});
