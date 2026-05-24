import dayjs from 'dayjs';
import { checkType, downloadResource, getUrlFromInfoApi, openInNewTab, } from './utils/fn';
import { getMediaName } from './utils/filename';
import { getCurrentStepFromDotsList, getParentArticleNode } from "./utils/dom";
import { CLASS_CUSTOM_BUTTON, likeIconSelector, MediaType, tagIconSelector } from "../constants";
import { storageCache } from './utils/storage';
import type { IconColor } from '../types/global';
import { handleVideoMaskClip } from "./utils/video";
import { addCustomBtn } from './button';
import type { PageHandler } from './handlers';
import { postDetailOnClicked } from './post-detail';

async function fetchVideoURL(articleNode: HTMLElement, videoElem: HTMLVideoElement) {
    const poster = videoElem.getAttribute('poster');
    const timeNodes = articleNode.querySelectorAll('time');
    const posterUrl = (timeNodes[timeNodes.length - 1].parentNode!.parentNode as any).href;
    const posterPattern = /\/([^/?]*)\?/;
    const posterMatch = poster?.match(posterPattern);
    const postFileName = posterMatch?.[1];
    const resp = await fetch(posterUrl);
    const content = await resp.text();
    const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
    const match = content.match(pattern);
    let videoUrl = JSON.parse(match?.[1] ?? '');
    videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/g, 'https://scontent.cdninstagram.com');
    videoElem.setAttribute('videoURL', videoUrl);
    return videoUrl;
}

const getVideoSrc = async (articleNode: HTMLElement, videoElem: HTMLVideoElement) => {
    let url = videoElem.getAttribute('src');
    if (videoElem.hasAttribute('videoURL')) {
        url = videoElem.getAttribute('videoURL');
    } else if (url === null || url.includes('blob')) {
        url = await fetchVideoURL(articleNode, videoElem);
    }
    return url;
};

async function postGetUrl(articleNode: HTMLElement) {
    let url, res;
    let mediaIndex = -1;

    if (articleNode.querySelectorAll('li[style][class]').length === 0) {
        // single img or video
        res = await getUrlFromInfoApi(articleNode);
        url = res?.url;
        if (!url) {
            const videoElem = articleNode.querySelector<HTMLVideoElement>('article  div > video');
            const imgElem = articleNode.querySelector<HTMLImageElement>('article  div[role] div > img');
            if (videoElem) {
                // media type is video
                if (videoElem) {
                    url = await getVideoSrc(articleNode, videoElem);
                }
            } else if (imgElem) {
                // media type is image
                url = imgElem.getAttribute('src');
            } else {
                console.log('Err: not find media at handle post single');
            }
        }
    } else {
        // multiple media
        const isPostView = window.location.pathname.startsWith('/p/');
        const idxFromUrl = new URLSearchParams(window.location.search).get('img_index');
        if (idxFromUrl) {
            mediaIndex = +idxFromUrl - 1
        } else {
            let dotsList: any
            if (isPostView) {
                dotsList = articleNode.querySelectorAll(`:scope>div>div:nth-child(1)>div>div>div:nth-child(2)>div`);
            } else {
                if (checkType() === 'pc') {
                    dotsList = articleNode.querySelector('button[aria-current]')?.parentNode?.children
                } else {
                    dotsList = articleNode.querySelectorAll(`:scope > div > div:nth-child(2) > div>div>div>div>div>div>div:nth-child(2)>div`);
                }
            }
            // if get dots list fail, try get img url from img element attribute
            if (dotsList.length === 0) {
                console.warn("cannot get dotsList!")
                const imgList = articleNode.querySelectorAll(`${isPostView ? ':scope>div>div:nth-child(1)' : ''} li img`);
                const { x, right } = articleNode.getBoundingClientRect();
                for (const item of [...imgList]) {
                    const rect = item.getBoundingClientRect();
                    if (rect.x > x && rect.right < right) {
                        url = item.getAttribute('src');
                        return { url };
                    }
                }
                return null;
            }
            mediaIndex = getCurrentStepFromDotsList(dotsList)  // pc feed page
            if (mediaIndex == -1) {
                console.warn("No media index found.");
                mediaIndex = 0
            }
        }
        res = await getUrlFromInfoApi(articleNode, mediaIndex);
        url = res?.url;
        if (!url) {
            console.warn("get media url from api failed, fallback to html attr")
            const listElements = [
                ...articleNode.querySelectorAll(
                    `:scope > div > div:nth-child(${isPostView ? 1 : 2}) > div > div:nth-child(1) ul li[style*="translateX"]`
                ),
            ] as HTMLLIElement[];
            const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
            const positionsMap = listElements.reduce<Record<string, HTMLLIElement>>((result, element) => {
                const position = Math.round(Number(element.style.transform.match(/-?(\d+)/)?.[1]) / listElementWidth);
                return { ...result, [position]: element };
            }, {});

            const node = positionsMap[mediaIndex];
            const videoElem = node.querySelector('video');
            const imgElem = node.querySelector('img');
            if (videoElem) {
                // media type is video
                url = await getVideoSrc(articleNode, videoElem);
            } else if (imgElem) {
                // media type is image
                url = imgElem.getAttribute('src');
            }
        }
    }
    return { url, res, mediaIndex };
}

export async function postOnClicked(target: HTMLAnchorElement) {
    const { setting_format_use_indexing } = storageCache.settings;
    try {
        const articleNode = getParentArticleNode(target);
        if (!articleNode) throw new Error('Cannot find article node');

        if (target.className.includes('zip-btn')) {
            const { handleZipDownload } = await import("./utils/zip")
            return handleZipDownload(articleNode)
        }

        const data = await postGetUrl(articleNode);
        if (!data?.url) throw new Error('post cannot get url');
        const { url, res, mediaIndex } = data;
        console.log('post url=', url);
        if (target.className.includes('download-btn')) {
            let postTime, posterName;
            if (res) {
                posterName = res.owner;
                postTime = dayjs.unix(res.taken_at);
            } else {
                postTime = articleNode.querySelector('time')?.getAttribute('datetime');
                posterName = articleNode.querySelector('a')?.getAttribute('href')?.replace(/\//g, '');
                const tagNode = document.querySelector(
                    'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
                );
                if (tagNode) {
                    const name = document.querySelector<HTMLSpanElement>('article header>div:nth-child(2) span');
                    if (name) {
                        posterName = name.innerText || posterName;
                    }
                }
            }
            downloadResource({
                url: url,
                username: posterName,
                datetime: dayjs(postTime),
                id: res?.origin_data?.id || getMediaName(url),
                index: setting_format_use_indexing && mediaIndex !== undefined && mediaIndex >= 0 ? mediaIndex + 1 : undefined,
                type: MediaType.Post,
            });
        } else {
            openInNewTab(url);
        }
    } catch (e: any) {
        alert('post get media failed!');
        console.log(`Uncaught in postOnClicked(): ${e}\n${e.stack}`);
    }
}

export class PostPageHandler implements PageHandler {
    match(url: URL, pathnameList: string[]) {
        const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p'; // https://www.instagram.com/frankinjection/p/CwAb4TEoRE_/?img_index=1
        const isReelDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'reel'; // https://www.instagram.com/philsnelgrove/reel/B5GeRJoBAc1/
        return url.pathname.startsWith('/p/') || isPostDetailWithNameInUrl || isReelDetailWithNameInUrl || url.pathname.startsWith('/tv/');
    }

    process(iconColor: IconColor) {
        const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
        const wrapperNode = dialogNode ?? document.querySelector('section main');
        const tagNode = document.querySelector(tagIconSelector);

        this.handleVideo(dialogNode);
        if (tagNode) {
            if (wrapperNode) {
                wrapperNode.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
                    const emptyNode = img.parentElement?.nextElementSibling;
                    if (emptyNode instanceof HTMLDivElement && emptyNode.childNodes.length === 0) {
                        emptyNode.style.pointerEvents = 'none';
                    }
                });
            }
        } else if (dialogNode) {
            dialogNode.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
                img.style.zIndex = '999';
            });
        } else {
            document
                .querySelector('main > div > div')
                ?.querySelectorAll<HTMLImageElement>('img')
                .forEach((img) => (img.style.zIndex = '999'));
        }

        const likeBtn = wrapperNode?.querySelector(likeIconSelector);
        const btnsContainer =
            document.querySelector('div[role="presentation"] section') ||
            document.querySelector('main[role="main"] section') ||
            likeBtn?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;
        if (btnsContainer instanceof HTMLElement && btnsContainer.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
            addCustomBtn(window.getComputedStyle(btnsContainer).display == "grid" ? btnsContainer.firstElementChild : btnsContainer, iconColor);
        }
    }

    async onCustomButtonClick(target: HTMLAnchorElement) {
        if (document.querySelector('div[role="dialog"]')) {
            return postOnClicked(target);
        } else {
            return postDetailOnClicked(target);
        }
    }

    private handleVideo(dialogNode: HTMLDivElement | null) {
        const { setting_enable_video_controls } = storageCache.settings;
        if (!setting_enable_video_controls) return;

        const videos = (dialogNode || document).querySelectorAll('video');
        for (let i = 0; i < videos.length; i++) {
            const videoPlayerMaskDiv = videos[i].closest('[tabindex="-1"]')?.querySelector('div[role="group"]');
            if (videoPlayerMaskDiv instanceof HTMLDivElement) {
                handleVideoMaskClip(videoPlayerMaskDiv, videos[i])
            }
        }
    }
}
