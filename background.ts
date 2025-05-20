// When the extension is first installed or updated:
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
    // Open the action popup exactly once on install
    if (chrome.action.openPopup) {
        chrome.action.openPopup();
    }
});
