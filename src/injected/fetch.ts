const { fetch: originFetch } = window;

window.fetch = function (...args) {
  chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', args);
  return originFetch(...args);
};
