(async () => {
    await import(chrome.runtime.getURL('content/index.js'));
})();
