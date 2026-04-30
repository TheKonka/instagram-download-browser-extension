import type { Stories } from '../types/stories';
import type { Highlight } from '../types/highlights';
import type { Reels } from '../types/reels';
import type { ProfileReel } from '../types/profileReel';

// save highlights data from json
export async function saveHighlights(jsonData: Record<string, any>) {
    if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media__connection?.edges)) {
        const data = (jsonData as Highlight.Root).data.xdt_api__v1__feed__reels_media__connection.edges.map((i) => i.node);
        const { highlights_data } = await chrome.storage.local.get(['highlights_data']);
        const newMap = new Map(highlights_data);
        data.forEach((i) => newMap.set(i.id, i));
        await chrome.storage.local.set({ highlights_data: [...newMap] });

        //? The presentation stories in home page top url is /stories/{username} now
        //? before was /stories/highlights/{pk}
        //? so we need to save the data to stories_reels_media
        saveStoriesToLocal(data);
    }
}

// save reels data from json
export async function saveReels(jsonData: Record<string, any>) {
    if (Array.isArray(jsonData.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
        const data = (jsonData as Reels.Root).data.xdt_api__v1__clips__home__connection_v2.edges.map((i) => i.node.media);
        const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
        const newMap = new Map(reels_edges_data);
        data.forEach((i) => newMap.set(i.code, i));
        await chrome.storage.local.set({ reels_edges_data: [...newMap] });
    }
}

export async function saveProfileReel(jsonData: Record<string, any>) {
    if (Array.isArray(jsonData.data?.xdt_api__v1__clips__user__connection_v2?.edges)) {
        const data = (jsonData as ProfileReel.Root).data.xdt_api__v1__clips__user__connection_v2.edges.map((i) => i.node.media);
        const { profile_reels_edges_data } = await chrome.storage.local.get(['profile_reels_edges_data']);
        const newMap = new Map(profile_reels_edges_data);
        data.forEach((i) => newMap.set(i.code, i));
        await chrome.storage.local.set({ profile_reels_edges_data: [...newMap] });
    }
}

// save stories data from json
export async function saveStories(jsonData: Record<string, any>) {
    if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
        const data = (jsonData as Stories.Root).data.xdt_api__v1__feed__reels_media.reels_media;
        saveStoriesToLocal(data);
    }
}

export async function saveStoriesToLocal(data: Stories.ReelsMedum[]) {
    const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
    const newMap = new Map(stories_reels_media);
    data.forEach((i) => newMap.set(i.id, i));
    await chrome.storage.local.set({ stories_reels_media: [...newMap] });
}

export function findValueByKey(obj: Record<string, any>, key: string): any {
    for (const property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            if (property === key) {
                return obj[property];
            } else if (typeof obj[property] === 'object') {
                const result = findValueByKey(obj[property], key);
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }
}

type InstagramCookieReader = (name: string) => Promise<string | null | undefined>;

interface ProfilePictureVersion {
    height?: number;
    url?: string;
    width?: number;
}

function getRecord(value: unknown): Record<string, any> | null {
    return value && typeof value === 'object' ? value as Record<string, any> : null;
}

function getLargestProfilePictureVersionUrl(versions: unknown): string | null {
    if (!Array.isArray(versions)) return null;

    const largestVersion = versions
        .filter((version): version is ProfilePictureVersion => typeof version?.url === 'string')
        .sort((left, right) => {
            const leftSize = (left.width || 0) * (left.height || 0);
            const rightSize = (right.width || 0) * (right.height || 0);
            return rightSize - leftSize;
        })[0];

    return largestVersion?.url || null;
}

function getProfilePictureUrlFromInfoResponse(data: unknown): string | null {
    const root = getRecord(data);
    const user = getRecord(root?.user);
    if (!user) return null;

    const hdInfo = getRecord(user.hd_profile_pic_url_info);
    return (
        (typeof hdInfo?.url === 'string' && hdInfo.url) ||
        getLargestProfilePictureVersionUrl(user.hd_profile_pic_versions) ||
        (typeof user.profile_pic_url_hd === 'string' && user.profile_pic_url_hd) ||
        (typeof user.profile_pic_url === 'string' && user.profile_pic_url) ||
        null
    );
}

function getProfilePictureRequestHeaders(authHeader: string, includeUserAgent: boolean) {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: authHeader,
        'X-IG-App-ID': '350685531728',
    };

    if (includeUserAgent) {
        headers['User-Agent'] = 'Instagram 219.0.0.12.117 Android';
    }

    return headers;
}

async function fetchProfilePictureInfo(userId: string, authHeader: string) {
    const url = `https://i.instagram.com/api/v1/users/${encodeURIComponent(userId)}/info/`;

    try {
        return await fetch(url, {
            headers: getProfilePictureRequestHeaders(authHeader, true),
        });
    } catch (error) {
        console.log(`Retrying profile picture request without User-Agent header: ${error}`);
        return fetch(url, {
            headers: getProfilePictureRequestHeaders(authHeader, false),
        });
    }
}

export async function fetchInstagramProfilePictureHdUrl(userId: string, getCookie: InstagramCookieReader) {
    const [sessionId, dsUserId] = await Promise.all([
        getCookie('sessionid'),
        getCookie('ds_user_id'),
    ]);

    if (!sessionId || !dsUserId) return null;

    const authPayload = JSON.stringify({ ds_user_id: dsUserId, sessionid: sessionId });
    const response = await fetchProfilePictureInfo(userId, `Bearer IGT:2:${btoa(authPayload)}`);

    if (!response.ok) {
        throw new Error(`Instagram profile picture request failed with status ${response.status}`);
    }

    return getProfilePictureUrlFromInfoResponse(await response.json());
}
