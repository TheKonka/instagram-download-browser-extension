import type { PageHandler } from "./handlers";
import { CLASS_CUSTOM_BUTTON, likeIconSelector, tagIconSelector } from "../constants";
import type { IconColor } from "../types/global";
import { addCustomBtn } from "./button";
import { postOnClicked } from "./post";
import { storageCache } from "./utils/storage";
import { handleVideoMaskClip } from "./utils/video";

export class FeedPageHandler implements PageHandler {
    match(url: URL, pathnameList: string[]) {
        const isFeedPage = pathnameList.length === 2 && pathnameList[1] === 'feed';
        return url.pathname === '/' || isFeedPage;
    }

    process(iconColor: IconColor) {
        this.handleVideo();

        const articleList = document.querySelectorAll('article');
        for (let i = 0; i < articleList.length; i++) {
            const tagNode = articleList[i].querySelector(tagIconSelector);
            if (tagNode) {
                articleList[i].querySelectorAll<HTMLImageElement>('img').forEach((img) => {
                    const emptyNode = img.parentElement?.nextElementSibling;
                    if (emptyNode instanceof HTMLDivElement && emptyNode.childNodes.length === 0) {
                        emptyNode.style.pointerEvents = 'none';
                    }
                });
            } else {
                articleList[i].querySelectorAll<HTMLImageElement>(':scope img').forEach((img) => {
                    img.style.zIndex = '999';
                });
            }
            const likeBtn = articleList[i].querySelector(likeIconSelector);
            if (likeBtn && articleList[i].getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(likeBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
            }
        }
    }

    async onCustomButtonClick(target: HTMLAnchorElement) {
        return postOnClicked(target);
    }

    private handleVideo() {
        const { setting_enable_video_controls } = storageCache.settings;
        if (!setting_enable_video_controls) return;

        const videos = document.querySelectorAll('video');
        for (let i = 0; i < videos.length; i++) {
            const videoPlayerMaskDiv = videos[i].closest('[data-visualcompletion="ignore-late-mutation"]')?.querySelector('div[role="group"]');
            if (videoPlayerMaskDiv instanceof HTMLDivElement) {
                handleVideoMaskClip(videoPlayerMaskDiv, videos[i])
            }
        }
    }
}
