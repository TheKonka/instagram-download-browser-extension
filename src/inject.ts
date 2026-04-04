const script = document.createElement('script');
script.setAttribute('type', 'module');
script.setAttribute('src', chrome.runtime.getURL('xhr.js'));
script.onload = () => {
   script.remove();
};
(document.head || document.documentElement).appendChild(script);
