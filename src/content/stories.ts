import dayjs from 'dayjs';
import {downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab} from './utils';

function storyGetSectionNode(target: HTMLAnchorElement) {
    let sectionNode: HTMLElement = target;
    while (sectionNode && sectionNode.tagName !== 'SECTION') {
        sectionNode = sectionNode.parentNode as HTMLElement;
    }
    return sectionNode;
}

async function storyGetUrl(target: HTMLElement, sectionNode: any) {
    let url: string | null = null;

    url = await getUrlFromInfoApi(target);

    if (!url) {
        if (sectionNode.querySelector('video > source')) {
            url = sectionNode.querySelector('video > source').getAttribute('src');
        } else if (sectionNode.querySelector('img[decoding="sync"]')) {
            const img = sectionNode.querySelector('img[decoding="sync"]');
            url = img.srcset.split(/ \d+w/g)[0].trim(); // extract first src from srcset attr. of img
            if (url && url.length > 0) {
                return url;
            }
            url = sectionNode.querySelector('img[decoding="sync"]').getAttribute('src');
        } else if (sectionNode.querySelector('video')) {
            url = sectionNode.querySelector('video').getAttribute('src');
        }
    }
    return url;
}

export async function storyOnClicked(target: HTMLAnchorElement) {
    const sectionNode = storyGetSectionNode(target);
    const pathname = window.location.pathname
    const pathnameArr = pathname.split('/')
    const posterName = pathnameArr[2];
    const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');


    const action = target.className.includes('download-btn') ? 'download' : 'open'

    let mediaIndex = 0
    let url = null

    sectionNode.querySelector('header>div')?.childNodes.forEach((item, idx) => {
        if (item instanceof HTMLDivElement && item.querySelector('div:nth-child(2)')?.classList.length === 2) {
            mediaIndex = idx
        }
    })


    if (pathname.startsWith('/stories/highlights/')) {
        const id = "highlight:" + pathnameArr[3]
        const res = await chrome.storage.local.get([id])
        if (res[id]) {
            const reels_media = res[id].reels_media[0]
            const media = reels_media.items[mediaIndex]
            if ('video_versions' in media) {
                url = media['video_versions'][0].url
            } else if ('image_versions2' in media) {
                url = media['image_versions2'].candidates[0].url
            }
            if (url) {
                const fileName = reels_media.user.username + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url)
                if (action === 'download') {
                    downloadResource(url, fileName);
                } else {
                    openInNewTab(url);
                }
                return
            }
        }


    }

    url = await storyGetUrl(target, sectionNode);
    if (url && url.length > 0) {
        const fileName = posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url)
        if (action === 'download') {
            downloadResource(url, fileName);
        } else {
            openInNewTab(url);
        }
    }
}


