import dayjs from 'dayjs';
import { checkType, downloadResource, openInNewTab } from './utils/fn';
import { DownloadParams, getMediaName } from './utils/filename';
import type { Highlight } from '../types/highlights';
import type { ReelsMedia } from '../types/global';
import { MediaType } from "../constants";
import { storageCache } from './utils/storage';
import { getParentSectionNode } from "./utils/dom";

function findHighlight(obj: Record<string, any>): Highlight.XdtApiV1FeedReelsMediaConnection | undefined {
    for (const key in obj) {
        if (key === 'xdt_api__v1__feed__reels_media__connection') {
            return obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            const result = findHighlight(obj[key]);
            if (result) {
                return result;
            }
        }
    }
}

export async function highlightsOnClicked(target: HTMLAnchorElement, containerNode: Element | null) {
    const sectionNode = getParentSectionNode(target) || containerNode;
    if (!sectionNode) {
        console.warn("cannot find section node");
        return;
    }
    const pathname = window.location.pathname; // "/stories/highlights/18023929792378379/"
    const pathnameArr = pathname.split('/');
    const { setting_format_use_indexing } = storageCache.settings;

    const final = (url: string, filenameObj?: Omit<DownloadParams, 'url' | 'type'>) => {
        if (target.className.includes('download-btn')) {
            if (filenameObj) {
                downloadResource({
                    url: url,
                    ...filenameObj,
                    type: MediaType.Highlight,
                });
            } else {
                let posterName = 'highlights';
                for (const item of sectionNode.querySelectorAll('a[role=link]')) {
                    const hrefArr = item
                        .getAttribute('href')
                        ?.split('/')
                        .filter((_) => _);
                    if (hrefArr?.length === 1) {
                        posterName = hrefArr[1];
                        break;
                    }
                }
                const postTime = [...sectionNode.querySelectorAll('time')].find((i) => i.classList.length !== 0)
                    ?.getAttribute('datetime');
                downloadResource({
                    url: url,
                    username: posterName,
                    datetime: postTime,
                    id: getMediaName(url),
                    type: MediaType.Highlight,
                });
            }
        } else {
            openInNewTab(url);
        }
    };

    let mediaIndex = 0;

    const handleMedias = (data: Highlight.Node) => {
        const media = data.items[mediaIndex];
        const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
        final(url, {
            username: data.user.username,
            datetime: dayjs.unix(media.taken_at),
            id: data.id,
            index: setting_format_use_indexing ? mediaIndex + 1 : undefined
        });
    };

    target.parentElement?.firstElementChild?.querySelectorAll(':scope>div').forEach((i, idx) => {
        if (i.childNodes.length === 1) {
            mediaIndex = idx;
        }
    });

    const { reels_media, highlights_data } = await chrome.storage.local.get(['reels_media', 'highlights_data']);

    //  profile page highlight on Android
    if (checkType() === 'android') {
        const itemOnAndroid = (reels_media || []).find((i: ReelsMedia.ReelsMedum) => i.id === 'highlight:' + pathnameArr[3]);
        if (itemOnAndroid) {
            handleMedias(itemOnAndroid);
            return;
        }
        for (const item of sectionNode.querySelectorAll<HTMLImageElement>('img')) {
            if (item.srcset !== '') {
                final(item.src);
                return;
            }
        }
    }

    const localData = new Map(highlights_data || []).get('highlight:' + pathnameArr[3]) as Highlight.Node | undefined;
    if (localData) {
        handleMedias(localData);
        return;
    }

    for (const script of window.document.scripts) {
        try {
            const innerHTML = script.innerHTML;
            const data = JSON.parse(innerHTML);
            if (innerHTML.includes('xdt_api__v1__feed__reels_media__connection')) {
                const res = findHighlight(data);
                if (res) {
                    handleMedias(res.edges[0].node);
                    return;
                }
            }
        } catch {
        }
    }

    const videoUrl = sectionNode.querySelector('video')?.getAttribute('src');
    if (videoUrl) {
        final(videoUrl);
        return;
    }

    for (const item of sectionNode.querySelectorAll<HTMLImageElement>('img[referrerpolicy="origin-when-cross-origin"]')) {
        if (item.classList.length > 1) {
            final(item.src);
            return;
        }
    }

    alert('download highlights failed!');
}
