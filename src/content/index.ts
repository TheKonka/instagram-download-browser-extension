import {CLASS_CUSTOM_BUTTON} from '../constants';
import {addCustomBtn, addVideoDownloadCoverBtn, onClickHandler} from './button';
import {handleThreads} from './threads';
import {checkType, handleVideo} from './utils/fn';

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

        const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
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
                const tagNode = articleList[i].querySelector(
                    'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
                );
                if (tagNode) {
                    articleList[i].querySelectorAll<HTMLImageElement>('ul li img').forEach((img) => {
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
                const likeBtn = articleList[i].querySelector(
                    'path[d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"]'
                );
                if (likeBtn && articleList[i].getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                    addCustomBtn(likeBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
                }
            }
        }

        // post
        if (pathname.startsWith('/p/') || isPostDetailWithNameInUrl || isReelDetailWithNameInUrl) {
            handleVideo();
            const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
            const tagNode = document.querySelector(
                'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
            );
            if (tagNode) {
                const node = dialogNode ?? document.querySelector('section main');
                if (node) {
                    node.querySelectorAll<HTMLImageElement>('ul li img').forEach((img) => {
                        const emptyNode = img.parentElement?.nextElementSibling;
                        if (emptyNode instanceof HTMLDivElement && emptyNode.childNodes.length === 0) {
                            emptyNode.style.zIndex = '-1';
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
            const replyBtn = document.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
            const btnsContainer =
                document.querySelector('div[role="presentation"] section') ||
                replyBtn?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;

            if (btnsContainer instanceof HTMLElement && btnsContainer.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(btnsContainer, iconColor);
            }
        }

        // stories
        if (pathname.startsWith('/stories/')) {
            const node = document.querySelector('section')?.querySelector('img[decoding="sync"]')?.nextSibling;
            if (node instanceof HTMLDivElement) {
                node.style.zIndex = '-1';
            }
            const blockDiv = [...document.querySelectorAll('body>div:not(#splash-screen)>div>div>div>div')].find((el) => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            const storyMenuBtn = blockDiv?.querySelector('svg circle');
            if (storyMenuBtn && blockDiv?.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(storyMenuBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
            }
            chrome.storage.sync.get(['setting_enable_video_controls']).then((result) => {
                if (!result.setting_enable_video_controls) return;
                const videos = document.querySelectorAll('video');
                for (let i = 0; i < videos.length; i++) {
                    if (videos[i].controls === true) continue;
                    videos[i].style.zIndex = '1';
                    videos[i].style.position = 'relative';
                    videos[i].setAttribute('controls', 'true');
                    videos[i].onvolumechange = () => {
                        const isMutingBtn = document.querySelector(
                            'section path[d="M1.5 13.3c-.8 0-1.5.7-1.5 1.5v18.4c0 .8.7 1.5 1.5 1.5h8.7l12.9 12.9c.9.9 2.5.3 2.5-1v-9.8c0-.4-.2-.8-.4-1.1l-22-22c-.3-.3-.7-.4-1.1-.4h-.6zm46.8 31.4-5.5-5.5C44.9 36.6 48 31.4 48 24c0-11.4-7.2-17.4-7.2-17.4-.6-.6-1.6-.6-2.2 0L37.2 8c-.6.6-.6 1.6 0 2.2 0 0 5.7 5 5.7 13.8 0 5.4-2.1 9.3-3.8 11.6L35.5 32c1.1-1.7 2.3-4.4 2.3-8 0-6.8-4.1-10.3-4.1-10.3-.6-.6-1.6-.6-2.2 0l-1.4 1.4c-.6.6-.6 1.6 0 2.2 0 0 2.6 2 2.6 6.7 0 1.8-.4 3.2-.9 4.3L25.5 22V1.4c0-1.3-1.6-1.9-2.5-1L13.5 10 3.3-.3c-.6-.6-1.5-.6-2.1 0L-.2 1.1c-.6.6-.6 1.5 0 2.1L4 7.6l26.8 26.8 13.9 13.9c.6.6 1.5.6 2.1 0l1.4-1.4c.7-.6.7-1.6.1-2.2z"]'
                        );
                        const isUnmutingBtn = document.querySelector(
                            'section path[d="M16.636 7.028a1.5 1.5 0 1 0-2.395 1.807 5.365 5.365 0 0 1 1.103 3.17 5.378 5.378 0 0 1-1.105 3.176 1.5 1.5 0 1 0 2.395 1.806 8.396 8.396 0 0 0 1.71-4.981 8.39 8.39 0 0 0-1.708-4.978Zm3.73-2.332A1.5 1.5 0 1 0 18.04 6.59 8.823 8.823 0 0 1 20 12.007a8.798 8.798 0 0 1-1.96 5.415 1.5 1.5 0 0 0 2.326 1.894 11.672 11.672 0 0 0 2.635-7.31 11.682 11.682 0 0 0-2.635-7.31Zm-8.963-3.613a1.001 1.001 0 0 0-1.082.187L5.265 6H2a1 1 0 0 0-1 1v10.003a1 1 0 0 0 1 1h3.265l5.01 4.682.02.021a1 1 0 0 0 1.704-.814L12.005 2a1 1 0 0 0-.602-.917Z"]'
                        );
                        if (videos[i].muted === false && isMutingBtn) {
                            isMutingBtn.parentElement?.parentElement?.parentElement?.click();
                        }
                        if (videos[i].muted === true && isUnmutingBtn) {
                            isUnmutingBtn.parentElement?.parentElement?.parentElement?.click();
                        }
                    };
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
                    if (videos[i].controls === true) continue;
                    videos[i].style.zIndex = '1';
                    videos[i].style.position = 'relative';
                    videos[i].controls = true;
                    videos[i].onvolumechange = () => {
                        const isMutingBtn = videos[i].parentElement?.querySelector(
                            'path[d="M1.5 13.3c-.8 0-1.5.7-1.5 1.5v18.4c0 .8.7 1.5 1.5 1.5h8.7l12.9 12.9c.9.9 2.5.3 2.5-1v-9.8c0-.4-.2-.8-.4-1.1l-22-22c-.3-.3-.7-.4-1.1-.4h-.6zm46.8 31.4-5.5-5.5C44.9 36.6 48 31.4 48 24c0-11.4-7.2-17.4-7.2-17.4-.6-.6-1.6-.6-2.2 0L37.2 8c-.6.6-.6 1.6 0 2.2 0 0 5.7 5 5.7 13.8 0 5.4-2.1 9.3-3.8 11.6L35.5 32c1.1-1.7 2.3-4.4 2.3-8 0-6.8-4.1-10.3-4.1-10.3-.6-.6-1.6-.6-2.2 0l-1.4 1.4c-.6.6-.6 1.6 0 2.2 0 0 2.6 2 2.6 6.7 0 1.8-.4 3.2-.9 4.3L25.5 22V1.4c0-1.3-1.6-1.9-2.5-1L13.5 10 3.3-.3c-.6-.6-1.5-.6-2.1 0L-.2 1.1c-.6.6-.6 1.5 0 2.1L4 7.6l26.8 26.8 13.9 13.9c.6.6 1.5.6 2.1 0l1.4-1.4c.7-.6.7-1.6.1-2.2z"]'
                        );
                        const isUnmutingBtn = videos[i].nextElementSibling?.querySelector(
                            'path[d="M16.636 7.028a1.5 1.5 0 10-2.395 1.807 5.365 5.365 0 011.103 3.17 5.378 5.378 0 01-1.105 3.176 1.5 1.5 0 102.395 1.806 8.396 8.396 0 001.71-4.981 8.39 8.39 0 00-1.708-4.978zm3.73-2.332A1.5 1.5 0 1018.04 6.59 8.823 8.823 0 0120 12.007a8.798 8.798 0 01-1.96 5.415 1.5 1.5 0 002.326 1.894 11.672 11.672 0 002.635-7.31 11.682 11.682 0 00-2.635-7.31zm-8.963-3.613a1.001 1.001 0 00-1.082.187L5.265 6H2a1 1 0 00-1 1v10.003a1 1 0 001 1h3.265l5.01 4.682.02.021a1 1 0 001.704-.814L12.005 2a1 1 0 00-.602-.917z"]'
                        );
                        if (videos[i].muted === false && isMutingBtn) {
                            isMutingBtn.parentElement?.parentElement?.click();
                        }
                        if (videos[i].muted === true && isUnmutingBtn) {
                            isUnmutingBtn.parentElement?.parentElement?.click();
                        }
                    };
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
                const likeBtn = item.querySelector(
                    'path[d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"]'
                );
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

            const VIDEO_SVG_PATH = "M22.942 7.464c-.062-1.36-.306-2.143-.511-2.671a5.366 5.366 0 0 0-1.272-1.952 5.364 5.364 0 0 0-1.951-1.27c-.53-.207-1.312-.45-2.673-.513-1.2-.054-1.557-.066-4.535-.066s-3.336.012-4.536.066c-1.36.062-2.143.306-2.672.511-.769.3-1.371.692-1.951 1.272s-.973 1.182-1.27 1.951c-.207.53-.45 1.312-.513 2.673C1.004 8.665.992 9.022.992 12s.012 3.336.066 4.536c.062 1.36.306 2.143.511 2.671.298.77.69 1.373 1.272 1.952.58.581 1.182.974 1.951 1.27.53.207 1.311.45 2.673.513 1.199.054 1.557.066 4.535.066s3.336-.012 4.536-.066c1.36-.062 2.143-.306 2.671-.511a5.368 5.368 0 0 0 1.953-1.273c.58-.58.972-1.181 1.27-1.95.206-.53.45-1.312.512-2.673.054-1.2.066-1.557.066-4.535s-.012-3.336-.066-4.536Zm-7.085 6.055-5.25 3c-1.167.667-2.619-.175-2.619-1.519V9c0-1.344 1.452-2.186 2.619-1.52l5.25 3c1.175.672 1.175 2.368 0 3.04Z"
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
            onClickHandler(btn);
        }
    }
});
