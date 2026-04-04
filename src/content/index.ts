import { CLASS_CUSTOM_BUTTON } from '../constants';
import { addCustomBtn, addVideoDownloadCoverBtn, handleVideoCoverDownloadBtn, onClickHandler } from './button';
import { handleThreads } from './threads';
import { checkType } from './utils/fn';
import { handleReelsVideoVolumeChange, handleStoriesVideoVolumeChange, handleVideo } from "./utils/video";

const VIDEO_SVG_PATH = "M22.942 7.464c-.062-1.36-.306-2.143-.511-2.671a5.366 5.366 0 0 0-1.272-1.952 5.364 5.364 0 0 0-1.951-1.27c-.53-.207-1.312-.45-2.673-.513-1.2-.054-1.557-.066-4.535-.066s-3.336.012-4.536.066c-1.36.062-2.143.306-2.672.511-.769.3-1.371.692-1.951 1.272s-.973 1.182-1.27 1.951c-.207.53-.45 1.312-.513 2.673C1.004 8.665.992 9.022.992 12s.012 3.336.066 4.536c.062 1.36.306 2.143.511 2.671.298.77.69 1.373 1.272 1.952.58.581 1.182.974 1.951 1.27.53.207 1.311.45 2.673.513 1.199.054 1.557.066 4.535.066s3.336-.012 4.536-.066c1.36-.062 2.143-.306 2.671-.511a5.368 5.368 0 0 0 1.953-1.273c.58-.58.972-1.181 1.27-1.95.206-.53.45-1.312.512-2.673.054-1.2.066-1.557.066-4.535s-.012-3.336-.066-4.536Zm-7.085 6.055-5.25 3c-1.167.667-2.619-.175-2.619-1.519V9c0-1.344 1.452-2.186 2.619-1.52l5.25 3c1.175.672 1.175 2.368 0 3.04Z"
const tagIconSelector = `path[d="M12 12c3.032 0 5.5-2.468 5.5-5.5S15.032 1 12 1a5.507 5.507 0 0 0-5.5 5.5C6.5 9.532 8.968 12 12 12Zm9.553 6.27C19.396 15.283 15.825 13.5 12 13.5c-3.824 0-7.396 1.782-9.552 4.768a2.317 2.317 0 0 0-.315 2.149 2.45 2.45 0 0 0 1.665 1.537C5.517 22.431 8.335 23 12 23c3.668 0 6.479-.565 8.19-1.04a2.464 2.464 0 0 0 1.678-1.544 2.312 2.312 0 0 0-.315-2.146Z"]`;
const likeIconSelector = `path[d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"]`
const shareIconSelector = `path[d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z"]`

setInterval(() => {
    requestIdleCallback(() => {
        if (window.location.origin === 'https://www.threads.com') {
            chrome.storage.sync.get(['setting_enable_threads']).then((result) => {
                if (result.setting_enable_threads) {
                    handleThreads();
                }
            });
            return;
        }
        if (window.location.origin !== 'https://www.instagram.com') return;

        const cs = document.documentElement.style.colorScheme || getComputedStyle(document.documentElement).colorScheme;

        const isDark = cs === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;

        const iconColor = isDark ? 'white' : 'black';

        const pathname = window.location.pathname;
        const pathnameList = pathname.split('/').filter((e) => e);

        const isFeedPage = pathnameList.length === 2 && pathnameList[1] === 'feed';
        const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p'; // https://www.instagram.com/frankinjection/p/CwAb4TEoRE_/?img_index=1
        const isReelDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'reel'; // https://www.instagram.com/philsnelgrove/reel/B5GeRJoBAc1/

        // home page and feed page
        if (pathname === '/' || isFeedPage) {
            handleVideo();

            const articleList = document.querySelectorAll('article');
            for (let i = 0; i < articleList.length; i++) {
                const tagNode = articleList[i].querySelector(tagIconSelector);
                if (tagNode) {
                    articleList[i].querySelectorAll<HTMLImageElement>('img').forEach((img) => {
                        const emptyNode = img.parentElement?.nextElementSibling;
                        if (emptyNode instanceof HTMLDivElement && emptyNode.childNodes.length === 0) {
                            emptyNode.style.zIndex = '-1';
                        }
                    });
                } else {
                    articleList[i].querySelectorAll<HTMLImageElement>(':scope img').forEach((img) => {
                        img.style.zIndex = '999';
                    });
                }
                // use like btn to position, because like btn is always exist
                const likeBtn = articleList[i].querySelector(likeIconSelector);
                if (likeBtn && articleList[i].getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                    addCustomBtn(likeBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
                }
            }
        }

        // post
        if (pathname.startsWith('/p/') || isPostDetailWithNameInUrl || isReelDetailWithNameInUrl) {
            handleVideo();
            const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
            const wrapperNode = dialogNode ?? document.querySelector('section main');
            const tagNode = document.querySelector(tagIconSelector);
            if (tagNode) {
                if (wrapperNode) {
                    wrapperNode.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
                        const emptyNode = img.parentElement?.nextElementSibling;
                        if (emptyNode instanceof HTMLDivElement && emptyNode.childNodes.length === 0) {
                            emptyNode.style.zIndex = '-1';  // hide the `position: absolute;` node to allow copy image by right click
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

        // stories
        if (pathname.startsWith('/stories/')) {
            const node = document.querySelector('section')?.querySelector('img[decoding="sync"]')?.nextSibling;
            if (node instanceof HTMLDivElement) {
                node.style.zIndex = '-1';
            }
            const wrapperDiv = [...document.querySelectorAll('body>div:not(#splash-screen)>div>div>div>div')].find((el) => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            if (!wrapperDiv) {
                return;
            }
            const storyMenuBtn = wrapperDiv.querySelector('svg circle');
            if (storyMenuBtn && wrapperDiv?.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(storyMenuBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
            }
            chrome.storage.sync.get(['setting_enable_video_controls']).then((result) => {
                if (!result.setting_enable_video_controls) return;
                const videos = wrapperDiv.querySelectorAll('video');
                for (let i = 0; i < videos.length; i++) {
                    if (videos[i].controls) continue;
                    videos[i].style.zIndex = '1';
                    videos[i].style.position = 'relative';
                    videos[i].setAttribute('controls', 'true');
                    videos[i].onvolumechange = handleStoriesVideoVolumeChange
                    const bottomDiv = wrapperDiv.querySelector(shareIconSelector)?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode
                    if (bottomDiv instanceof HTMLDivElement) {
                        bottomDiv.style.bottom = '4rem';
                    }
                }
            });
        }

        // reels
        if (pathname.startsWith('/reels/')) {
            chrome.storage.sync.get(['setting_enable_video_controls']).then((result) => {
                if (!result.setting_enable_video_controls) return;
                // handle video
                const videos = document.querySelectorAll('video');
                for (let i = 0; i < videos.length; i++) {
                    if (videos[i].controls) continue;
                    if (!videos[i].nextElementSibling?.hasAttribute("data-instancekey")) {
                        continue
                    }
                    videos[i].style.zIndex = '999';
                    videos[i].style.position = 'relative';
                    videos[i].controls = true;
                    videos[i].onvolumechange = handleReelsVideoVolumeChange
                    const btnEl = videos[i].nextElementSibling?.querySelector<HTMLDivElement>('div[role=button]');
                    if (btnEl) {
                        btnEl.style.paddingBottom = '3rem';
                        btnEl.childNodes.forEach((i) => i instanceof HTMLDivElement && (i.style.zIndex = '999'));
                    }
                }
            });

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

        // reel
        if (pathname.startsWith('/reel/')) {
            handleVideo();

            const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
            // use dialogNode because there is already a btn for downloading avatar inside the page
            const node = dialogNode || document;
            const commentBtn = node.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
            if (commentBtn && node.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(commentBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor, 'before');
            }
        }

        // user Avatar
        const profileHeader = document.querySelector('section>main>div>header>section:nth-child(2)');
        if (profileHeader && profileHeader.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
            const profileBtn = profileHeader.querySelector('svg circle');
            if (profileBtn) {
                addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
            }
        }

        // user's profile page video cover
        if (pathnameList.length === 1 || (pathnameList.length === 2 && ['tagged', 'reels'].includes(pathnameList[1]))) {
            const postsRows = document.querySelector('header')?.parentElement
                                      ?.lastElementChild
                                      ?.querySelectorAll(`:scope>div>div>div>div ${pathnameList.length === 1 ? '>div' : ''}`);

            postsRows?.forEach((row) => {
                row.childNodes.forEach((item) => {
                    if (item instanceof HTMLDivElement && item.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                        const videoSvg = item.querySelector(`path[d="${VIDEO_SVG_PATH}"]`);
                        if (videoSvg || pathnameList.includes('reels')) {
                            addVideoDownloadCoverBtn(item);
                        }
                    }
                });
            });
        }
    });
}, 2 * 1000);

document.body.addEventListener('click', (e) => {
    if (e.target instanceof Element) {
        const btn = e.target.closest(`.${CLASS_CUSTOM_BUTTON}`);
        if (btn) {
            e.preventDefault();
            if (btn.getAttribute("data-video-cover-download") == "true") {
                handleVideoCoverDownloadBtn(btn.parentElement!)
                return
            }
            onClickHandler(btn);
        }
    }
});