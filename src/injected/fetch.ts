const {fetch: origFetch} = window;

window.fetch = function (...args) {
    chrome.runtime.sendMessage('kcjhefeilcjmdamieljjflmbiafblkgg', args);
    return origFetch(...args);
};
