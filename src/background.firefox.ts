function listener(details: { requestId: string }) {
    //@ts-ignore
    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    const data: any[] = [];
    filter.ondata = (event: { data: ArrayBuffer }) => {
        data.push(event.data);
    };

    filter.onstop = () => {
        let str = "";
        if (data.length === 1) {
            str = decoder.decode(data[0]);
        } else {
            for (let i = 0; i < data.length; i++) {
                let stream = i !== data.length - 1;
                str += decoder.decode(data[i], {stream});
            }
        }
        const jsonData = JSON.parse(str)
        chrome.storage.local.set({[jsonData.reels_media[0].id]: jsonData})
        filter.write(encoder.encode(str));
        filter.close();
    };
}


chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight%3A')) {
            listener(details)
        }
        return undefined

    },
    {urls: ["https://www.instagram.com/*"]},
    ["blocking"],
);
