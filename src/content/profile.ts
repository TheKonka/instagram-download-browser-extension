import { downloadResource, openInNewTab } from './utils/fn';

export async function profileOnClicked(target: HTMLAnchorElement) {
    const { user_profile_pic_url } = await chrome.storage.local.get(['user_profile_pic_url']);
    const data = new Map(user_profile_pic_url || []);
    const arr = window.location.pathname.split('/').filter((e) => e);
    const username = arr.length === 1 ? arr[0] : document.querySelector('main header h2')?.textContent;
    const url = data.get(username) || document.querySelector('header img')?.getAttribute('src');
    if (typeof url === 'string') {
        if (target.className.includes('download-btn')) {
            downloadResource({
                url: url,
                id: username!,
            });
        } else {
            openInNewTab(url);
        }
    }
}


import type { IconColor } from '../types/global';
import { CLASS_CUSTOM_BUTTON } from '../constants';
import { addCustomBtn, addVideoDownloadCoverBtn } from './button';
import type { PageHandler } from './handlers';
import { VIDEO_SVG_PATH } from '../constants';
import { postOnClicked } from './post';

export class ProfilePageHandler implements PageHandler {
    match(url: URL, pathnameList: string[]) {
        return pathnameList.length === 1 || (pathnameList.length === 2 && ['tagged', 'reels'].includes(pathnameList[1]));
    }

    process(iconColor: IconColor) {
        const profileHeader = document.querySelector('section>main>div>header>section:nth-child(2)');
        if (profileHeader && profileHeader.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
            const profileBtn = profileHeader.querySelector('svg circle');
            if (profileBtn) {
                addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
            }
        }

        const pathnameList = window.location.pathname.split('/').filter(e => e);
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

    async onCustomButtonClick(target: HTMLAnchorElement) {
        if (document.querySelector('section>main>div>header>section:nth-child(2)')?.contains(target)) {
            return profileOnClicked(target);
        }
        return postOnClicked(target);
    }
}
