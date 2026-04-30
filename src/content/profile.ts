import { MESSAGE_FETCH_PROFILE_PICTURE_HD } from '../constants';
import { downloadResource, openInNewTab } from './utils/fn';

const PROFILE_AVATAR_CACHE_KEY = 'user_profile_pic_url';
const PROFILE_AVATAR_HD_CACHE_KEY = 'user_profile_hd_pic_url_v2';
const WEB_PROFILE_APP_ID = '936619743392459';

type AvatarQuality = 'fallback' | 'high';

interface AvatarCandidate {
    quality: AvatarQuality;
    url?: string;
}

interface AvatarVersion {
    height?: number;
    url?: string;
    width?: number;
}

interface ProfileAvatarUser {
    hd_profile_pic_url_info?: {
        url?: string;
    };
    hd_profile_pic_versions?: AvatarVersion[];
    id?: number | string;
    pk?: number | string;
    pk_id?: number | string;
    profile_pic_url?: string;
    profile_pic_url_hd?: string;
    username?: string;
}

interface ProfilePictureResponse {
    url?: string | null;
}

function normalizeUsername(username: string) {
    return username.trim().toLowerCase();
}

function getStringMap(value: unknown) {
    return new Map<string, string>(
        Array.isArray(value)
            ? value.filter((entry): entry is [string, string] => (
                Array.isArray(entry) &&
                typeof entry[0] === 'string' &&
                typeof entry[1] === 'string'
            ))
            : []
    );
}

function getProfileUsername() {
    const reservedPathSegments = new Set([
        'accounts',
        'direct',
        'explore',
        'p',
        'reel',
        'reels',
        'stories',
    ]);
    const pathnameParts = window.location.pathname.split('/').filter(Boolean);
    const usernameFromPath = pathnameParts[0];

    if (usernameFromPath && !reservedPathSegments.has(usernameFromPath)) {
        return usernameFromPath;
    }

    return document.querySelector('main header h2')?.textContent?.trim() || null;
}

function getProfileAvatarImage(root: ParentNode = document) {
    const username = getProfileUsername();
    const normalizedUsername = username ? normalizeUsername(username) : null;
    const header = document.querySelector('section>main>div>header') || document.querySelector('header') || root;
    const images = [...header.querySelectorAll<HTMLImageElement>('img')];

    return images.find((img) => {
        const alt = img.alt.toLowerCase();
        return (
            alt.includes('profile') ||
            alt.includes('profil') ||
            Boolean(normalizedUsername && alt.includes(normalizedUsername))
        );
    }) || images[0] || null;
}

function getProfileAvatarUrl(root: ParentNode = document) {
    return getProfileAvatarImage(root)?.getAttribute('src') || undefined;
}

function getRecord(value: unknown): Record<string, any> | null {
    return value && typeof value === 'object' ? value as Record<string, any> : null;
}

function findProfileAvatarUser(value: unknown): ProfileAvatarUser | null {
    const record = getRecord(value);
    if (!record) return null;

    if (
        typeof record.username === 'string' &&
        (
            typeof record.profile_pic_url === 'string' ||
            typeof record.profile_pic_url_hd === 'string' ||
            getRecord(record.hd_profile_pic_url_info) ||
            Array.isArray(record.hd_profile_pic_versions)
        )
    ) {
        return record as ProfileAvatarUser;
    }

    for (const nestedValue of Object.values(record)) {
        const result = findProfileAvatarUser(nestedValue);
        if (result) return result;
    }

    return null;
}

function normalizeAvatarCandidateUrl(url: unknown) {
    return typeof url === 'string' && url.trim()
        ? url.replace(/&amp;/g, '&')
        : undefined;
}

function getLargestAvatarVersionUrl(versions: unknown) {
    if (!Array.isArray(versions)) return undefined;

    return versions
        .filter((version): version is AvatarVersion => typeof version?.url === 'string')
        .sort((left, right) => {
            const leftSize = (left.width || 0) * (left.height || 0);
            const rightSize = (right.width || 0) * (right.height || 0);
            return rightSize - leftSize;
        })[0]?.url;
}

function isLikelyLowResolutionAvatarUrl(url: string) {
    const sizeMatches = url.matchAll(/(?:^|[_/-])s(\d+)x(\d+)(?=[_./-]|$)/gi);

    for (const match of sizeMatches) {
        const width = Number(match[1]);
        const height = Number(match[2]);

        if (Number.isFinite(width) && Number.isFinite(height) && Math.max(width, height) <= 320) {
            return true;
        }
    }

    return /(?:^|[_/-])p150x150(?=[_./-]|$)/i.test(url);
}

function getProfileAvatarCandidatesFromApiData(data: unknown): AvatarCandidate[] {
    const user = findProfileAvatarUser(data);
    if (!user) return [];

    return [
        { quality: 'high', url: user.hd_profile_pic_url_info?.url },
        { quality: 'high', url: user.profile_pic_url_hd },
        { quality: 'high', url: getLargestAvatarVersionUrl(user.hd_profile_pic_versions) },
        { quality: 'fallback', url: user.profile_pic_url },
    ];
}

function getHighResolutionProfileAvatarUrlFromApiData(data: unknown) {
    return getProfileAvatarCandidatesFromApiData(data)
        .filter((candidate) => candidate.quality === 'high')
        .map((candidate) => normalizeAvatarCandidateUrl(candidate.url))
        .find((url): url is string => Boolean(url && !isLikelyLowResolutionAvatarUrl(url)));
}

function getProfileAvatarUrlFromApiData(data: unknown) {
    const highResolutionUrl = getHighResolutionProfileAvatarUrlFromApiData(data);
    if (highResolutionUrl) return highResolutionUrl;

    return getProfileAvatarCandidatesFromApiData(data)
        .map((candidate) => normalizeAvatarCandidateUrl(candidate.url))
        .find((url): url is string => Boolean(url));
}

function getProfileUserIdFromApiData(data: unknown) {
    const user = findProfileAvatarUser(data);
    const userId = user?.id || user?.pk || user?.pk_id;
    return typeof userId === 'string' || typeof userId === 'number' ? String(userId) : null;
}

async function cacheProfileAvatarUrl(username: string, url: string, quality: AvatarQuality = 'high') {
    const avatarStorage = await chrome.storage.local.get([
        PROFILE_AVATAR_HD_CACHE_KEY,
        PROFILE_AVATAR_CACHE_KEY,
    ]);
    const cacheKey = normalizeUsername(username);
    const data = getStringMap(avatarStorage[PROFILE_AVATAR_CACHE_KEY]);
    const hdData = getStringMap(avatarStorage[PROFILE_AVATAR_HD_CACHE_KEY]);

    data.set(cacheKey, url);
    if (quality === 'high') {
        hdData.set(cacheKey, url);
    }

    await chrome.storage.local.set({
        [PROFILE_AVATAR_CACHE_KEY]: [...data],
        [PROFILE_AVATAR_HD_CACHE_KEY]: [...hdData],
    });
}

function fetchHighResolutionProfileAvatarUrl(userId: string) {
    return chrome.runtime
        .sendMessage({
            data: { userId },
            type: MESSAGE_FETCH_PROFILE_PICTURE_HD,
        })
        .then((response?: ProfilePictureResponse) => normalizeAvatarCandidateUrl(response?.url))
        .catch((error) => {
            console.log(`Could not fetch HD profile picture: ${error}`);
            return undefined;
        });
}

async function fetchProfileAvatarData(endpoint: string) {
    const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-IG-App-ID': WEB_PROFILE_APP_ID,
        },
    });

    if (!response.ok) {
        throw new Error(`Instagram profile request failed with status ${response.status}`);
    }

    return response.json();
}

async function fetchProfileAvatarUrl(username: string) {
    const encodedUsername = encodeURIComponent(username);
    const endpoints = [
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodedUsername}`,
        `https://www.instagram.com/api/v1/feed/user/${encodedUsername}/username/`,
    ];

    for (const endpoint of endpoints) {
        try {
            const data = await fetchProfileAvatarData(endpoint);
            const userId = getProfileUserIdFromApiData(data);
            const highResolutionUrl = getHighResolutionProfileAvatarUrlFromApiData(data);
            const fallbackUrl = getProfileAvatarUrlFromApiData(data);

            if (userId) {
                const mobileApiUrl = await fetchHighResolutionProfileAvatarUrl(userId);

                if (mobileApiUrl) {
                    await cacheProfileAvatarUrl(username, mobileApiUrl);
                    return mobileApiUrl;
                }
            }

            if (highResolutionUrl) {
                await cacheProfileAvatarUrl(username, highResolutionUrl);
                return highResolutionUrl;
            }

            if (fallbackUrl) {
                await cacheProfileAvatarUrl(username, fallbackUrl, 'fallback');
                return fallbackUrl;
            }
        } catch (error) {
            console.log(`Failed to fetch profile avatar from ${endpoint}: ${error}`);
        }
    }

    return undefined;
}

async function resolveProfileAvatarUrl(username: string | null) {
    const avatarStorage = await chrome.storage.local.get([
        PROFILE_AVATAR_HD_CACHE_KEY,
        PROFILE_AVATAR_CACHE_KEY,
    ]);
    const cacheKey = username ? normalizeUsername(username) : null;
    const hdData = getStringMap(avatarStorage[PROFILE_AVATAR_HD_CACHE_KEY]);
    const data = getStringMap(avatarStorage[PROFILE_AVATAR_CACHE_KEY]);
    const cachedHdUrl = cacheKey ? hdData.get(cacheKey) || hdData.get(username || '') : undefined;
    const cachedUrl = cacheKey ? data.get(cacheKey) || data.get(username || '') : undefined;

    if (cachedHdUrl && !isLikelyLowResolutionAvatarUrl(cachedHdUrl)) {
        return cachedHdUrl;
    }

    const apiUrl = username ? await fetchProfileAvatarUrl(username) : undefined;
    return apiUrl || cachedUrl || getProfileAvatarUrl();
}

export async function profileOnClicked(target: HTMLAnchorElement) {
    const username = getProfileUsername();
    const url = await resolveProfileAvatarUrl(username);

    if (!url) return;

    if (target.className.includes('download-btn')) {
        downloadResource({
            id: username || 'profile-picture',
            url,
        });
    } else {
        openInNewTab(url);
    }
}
