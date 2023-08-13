const oldXHROpen = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function (method, url) {
    if (
        method === 'GET' &&
        typeof url === 'string' &&
        url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight%3A')
    ) {
        this.addEventListener('load', function () {
            try {
                const data = JSON.parse(this.responseText);
                chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', {type: 'highlight', data});
            } catch (error) {
                console.log(error);
            }
        });
    }

    return oldXHROpen.apply(this, [].slice.call(arguments) as any);
};
