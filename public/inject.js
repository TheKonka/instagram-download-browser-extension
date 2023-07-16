const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.runtime.getURL('injected.js'));
script.onload = () => {
	script.remove();
};
(document.head || document.documentElement).appendChild(script);
