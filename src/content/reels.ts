import dayjs from 'dayjs';
import { checkType, downloadResource, fetchHtml, getUrlFromInfoApi, openInNewTab } from './utils/fn';
import { DownloadParams, getMediaName } from './utils/filename';
import type { Reels } from '../types/reels';
import { CLASS_CUSTOM_BUTTON, MediaType } from "../constants";
import type { IconColor } from '../types/global';
import { handleVideoMaskClip } from "./utils/video";
import { addCustomBtn } from './button';
import type { PageHandler } from './handlers';
import { likeIconSelector } from '../constants';
import { storageCache } from './utils/storage';

function findReels(obj: Record<string, any>): Reels.XdtApiV1ClipsHomeConnectionV2 | undefined {
    for (const key in obj) {
        if (key === 'xdt_api__v1__clips__home__connection_v2') {
            return obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            const result = findReels(obj[key]);
            if (result) {
                return result;
            }
        }
    }
}

export class ReelsPageHandler implements PageHandler {
    match(url: URL) {
        return url.pathname.startsWith('/reels/');
    }

    process(iconColor: IconColor) {
        this.handleVideo()
        const reelsList =
            checkType() === 'pc'
                ? document.querySelectorAll('section>main>div>div')
                : document.querySelectorAll('section>main>div>div>div');
        for (const item of reelsList) {
            const likeBtn = item.querySelector(likeIconSelector);
            if (likeBtn && item.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(
                    likeBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode,
                    checkType() === 'pc' ? iconColor : 'white',
                    'before'
                );
            }
        }
    }

    async onCustomButtonClick(target: HTMLAnchorElement) {
        const final = (obj: DownloadParams) => {
            if (target.className.includes('download-btn')) {
                downloadResource({ ...obj, type: MediaType.Reel });
            } else {
                openInNewTab(obj.url);
            }
        };

        const handleMedia = (media: Reels.Media) => {
            const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
            final({
                url: url,
                username: media.user.username,
                datetime: dayjs.unix(media.taken_at),
                id: getMediaName(url),
            });
        };

        const code = window.location.pathname.split('/').at(-2);
        const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
        const media = new Map(reels_edges_data || []).get(code) as Reels.Media | undefined;
        if (media) {
            handleMedia(media);
            return;
        }

        const scripts = await fetchHtml();
        for (const script of [...window.document.scripts, ...scripts]) {
            try {
                const innerHTML = script.innerHTML;
                const data = JSON.parse(innerHTML);
                if (innerHTML.includes('xdt_api__v1__clips__home__connection_v2')) {
                    const res = findReels(data);
                    if (res) {
                        for (const item of res.edges) {
                            if (item.node.media.code === code) {
                                handleMedia(item.node.media);
                                return;
                            }
                        }
                    }
                }
            } catch {
            }
        }

        const wrapperNode = target.parentNode!.parentNode as HTMLDivElement;
        try {
            const res = await getUrlFromInfoApi(wrapperNode);
            if (!res) return;
            console.log('url', res.url);
            final({
                url: res.url,
                username: res.owner,
                datetime: dayjs.unix(res.taken_at),
                id: getMediaName(res.url),
            });
        } catch (e: any) {
            alert('Reels Download Failed!');
            console.log(`Uncaught in postDetailOnClicked(): ${e}\n${e.stack}`);
            return;
        }
    }

    private handleVideo() {
        if (!storageCache.settings.setting_enable_video_controls) {
            return
        }

        const points = document.querySelector('svg polyline[points="20.643 3.357 12 12 3.353 20.647"]')
        if (points) {
            const listDiv = points.closest('div[tabindex="-1"]')?.children[1]
            if (listDiv) {
                for (const wrapperDiv of listDiv.children) {
                    const videoTarget = wrapperDiv.querySelector('video');
                    if (videoTarget instanceof HTMLVideoElement) {
                        videoTarget.controls = true;
                        const videoPlayerDiv = wrapperDiv.querySelector('div[role="group"]')
                        if (videoPlayerDiv instanceof HTMLDivElement) {
                            handleVideoMaskClip(videoPlayerDiv, videoTarget, { bottomDiv: videoPlayerDiv.firstElementChild?.firstElementChild });
                        }
                    }
                }
            }
        } else {
            const mainDiv = document.querySelector("main")
            if (mainDiv) {
                for (const videoContainer of mainDiv.firstElementChild!.children) {
                    const videoPlayerDiv = videoContainer.querySelector('div[role="group"]')
                    const videoTarget = videoContainer.querySelector('video');
                    if (videoPlayerDiv instanceof HTMLDivElement && videoTarget) {
                        handleVideoMaskClip(videoPlayerDiv, videoTarget, { bottomDiv: videoPlayerDiv.firstElementChild?.firstElementChild })
                    }
                }
            }
        }
    }
}
