import type { ReelsMedia } from '../types/global';
import {
    fetchInstagramProfilePictureHdUrl,
    findValueByKey,
    saveHighlights,
    saveProfileReel,
    saveReels,
    saveStories
} from './fn';
import {
    CONFIG_LIST,
    DEFAULT_DATETIME_FORMAT,
    DEFAULT_FILENAME_FORMAT,
    MESSAGE_FETCH_PROFILE_PICTURE_HD,
    MESSAGE_OPEN_URL
} from '../constants';

chrome.runtime.onInstalled.addListener(async () => {
    const result = await chrome.storage.sync.get(CONFIG_LIST);
    const defaults: Record<string, any> = {
        setting_format_filename: DEFAULT_FILENAME_FORMAT,
        setting_format_datetime: DEFAULT_DATETIME_FORMAT,
    };

    const updates: Record<string, any> = {};
    CONFIG_LIST.forEach((i) => {
        if (result[i] === undefined) {
            updates[i] = defaults[i] ?? true;
        }
    });

    if (Object.keys(updates).length > 0) {
        chrome.storage.sync.set(updates);
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.set({ stories_user_ids: [], id_to_username_map: [] });
});

function getInstagramCookie(name: string) {
    return new Promise<string | null>((resolve) => {
        chrome.cookies.get({ url: 'https://www.instagram.com/', name }, (cookie) => {
            const lastError = (chrome.runtime as any).lastError;

            if (lastError) {
                console.log(`Could not read Instagram cookie ${name}: ${lastError.message}`);
                resolve(null);
                return;
            }

            resolve(cookie?.value || null);
        });
    });
}

function getProfilePictureUserId(data: unknown) {
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).userId === 'string') {
        return (data as Record<string, string>).userId;
    }
    return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message, sender);
    const { type, data } = message;
    if (type === MESSAGE_OPEN_URL) {
        chrome.tabs.create({ url: data, index: sender.tab!.index + 1 });
    }
    if (type === MESSAGE_FETCH_PROFILE_PICTURE_HD) {
        const userId = getProfilePictureUserId(data);
        if (!userId) {
            sendResponse({ url: null });
            return false;
        }

        fetchInstagramProfilePictureHdUrl(userId, getInstagramCookie)
            .then((url) => sendResponse({ url }))
            .catch((error) => {
                console.log(`Could not fetch HD profile picture: ${error}`);
                sendResponse({ url: null });
            });

        return true;
    }
    return false;
});

async function addThreads(data: any[]) {
    const { threads } = await chrome.storage.local.get(['threads']);
    const newMap = new Map(threads);
    for (const item of data) {
        const code = item?.post?.code;
        if (code) {
            newMap.set(code, item);
        }
    }
    await chrome.storage.local.set({ threads: Array.from(newMap) });
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    // console.log(message, sender);
    const { type, data, api } = message;

    if (sender.origin === 'https://www.threads.com') {
        if (type === 'threads_searchResults') {
            data
                .split(/\s*for\s+\(;;\);\s*/)
                .filter((_: any) => _)
                .map(async (i: any) => {
                    try {
                        const result = findValueByKey(JSON.parse(i), 'searchResults');
                        if (result && Array.isArray(result.edges)) {
                            await addThreads(result.edges.map((i: any) => i.node.thread.thread_items).flat());
                        }
                    } catch {
                    }
                });
        } else {
            addThreads(data);
        }
        return false;
    }

    (async () => {
        if (type === 'stories') {
            const {
                stories_user_ids,
                id_to_username_map
            } = await chrome.storage.local.get(['stories_user_ids', 'id_to_username_map']);
            const nameToId = new Map(stories_user_ids);
            const idToName = new Map(id_to_username_map);
            nameToId.set(data.username, data.user_id);
            idToName.set(data.user_id, data.username);
            await chrome.storage.local.set({
                stories_user_ids: Array.from(nameToId),
                id_to_username_map: Array.from(idToName)
            });
        } else {
            try {
                const jsonData = JSON.parse(data);

                switch (api) {
                    case 'https://www.instagram.com/api/graphql':
                        saveStories(jsonData);
                        break;
                    case 'https://www.instagram.com/graphql/query':
                        saveHighlights(jsonData);
                        saveReels(jsonData);
                        saveStories(jsonData);
                        saveProfileReel(jsonData);
                        break;
                    // presentation stories in home page top
                    case '/api/v1/feed/reels_media/?reel_ids=':
                        const { reels, reels_media } = await chrome.storage.local.get(['reels', 'reels_media']);
                        const newArr = (reels_media || []).filter(
                            (i: ReelsMedia.ReelsMedum) => !(jsonData as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
                        );
                        chrome.storage.local.set({
                            reels: Object.assign({}, reels, data.reels),
                            reels_media: [...newArr, ...jsonData.reels_media],
                        });
                        break;
                }
            } catch {
            }
        }
        sendResponse();
    })();

    return true;
});
