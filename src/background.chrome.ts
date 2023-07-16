chrome.runtime.onMessageExternal.addListener((message) => {
    const {type, data} = message
    if (type === "highlight") {
        chrome.storage.local.set({[data.reels_media[0].id]: data})
    }

    return undefined;
});


