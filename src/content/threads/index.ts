import { CLASS_CUSTOM_BUTTON } from '../../constants';
import { addCustomBtn } from '../button';
import type { IconColor } from '../../types/global';
import type { PageHandler } from '../handlers';
import { storageCache } from '../utils/storage';
import { handleThreadsButton } from "./button";

const LIKE_BUTTON = "M16.5 2c-1.666 0-3.278.707-4.5 1.937C10.778 2.707 9.166 2 7.5 2c-4.122 0-7 3.084-7 7.5 0 4.628 4.345 9.962 10.811 13.272a1.507 1.507 0 0 0 1.378 0C19.155 19.462 23.5 14.128 23.5 9.5c0-4.416-2.878-7.5-7-7.5zM12 20.876c-5.692-2.98-9.5-7.53-9.5-11.376 0-3.341 1.963-5.5 5-5.5 2 0 3.75 1.75 4.5 3.5.75-1.75 2.5-3.5 4.5-3.5 3.038 0 5 2.159 5 5.5 0 3.847-3.808 8.396-9.5 11.376z"

function handleList(list: NodeListOf<Element>) {
    const iconColor = window.getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
    list.forEach((n) => {
        const node = n.firstElementChild?.firstElementChild;
        if (!node) return;
        // text post doesn't need to add button
        if (node.querySelector('picture') || node.querySelector('video')) {
            const likeBtn = node.querySelector(`path[d="${LIKE_BUTTON}"]`);
            const btnContainer = likeBtn?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
            if (btnContainer && btnContainer.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
                addCustomBtn(btnContainer, iconColor);
            }
        }
    });
}

export function handleThreads() {
    const pathname = window.location.pathname;
    const pathnameList = pathname.split('/').filter((e) => e);

    const isPostDetailPage = pathnameList.length === 3 && pathnameList[1] === 'post';

    if (pathname === '/') {
        const notLoginNode = document.querySelector('div[data-nosnippet="true"]>div>div');
        if (notLoginNode) {
            handleList(notLoginNode.querySelectorAll('div[data-pagelet^="threads_logged_out_feed_"]'));
        } else {
            const layoutDiv = document.querySelector('div[id="barcelona-page-layout"]')
            const headerDiv = layoutDiv?.querySelector('div[id="barcelona-header"]');
            const wrapper = headerDiv?.parentElement?.parentElement?.nextElementSibling?.querySelector(
                'div[data-visualcompletion="ignore"][data-thumb="1"]'
            )?.parentElement?.firstElementChild;
            if (wrapper) {
                handleList(wrapper.querySelectorAll('div[data-pagelet^="threads_feed_"]'));
            }
        }
    } else if (pathname === '/search') {
        const wrapperNode = document.querySelector('div[data-thumb="1"][data-visualcompletion="ignore"]')?.parentElement?.firstElementChild;
        if (wrapperNode) {
            handleList(wrapperNode.querySelectorAll('div[data-pagelet^="threads_search_results_"]'));
        }
    } else if (isPostDetailPage) {
        const layout = document.querySelectorAll('#barcelona-page-layout');
        let wrapper;
        for (const item of layout) {
            if (item.parentElement?.hidden) {

            } else {
                wrapper = item;
                break;
            }
        }
        if (wrapper) {
            handleList(wrapper.querySelectorAll('div[data-pagelet^="threads_post_page_"]'));
        }
    } else if (pathname.startsWith('/@')) {
        const layout = document.querySelectorAll('#barcelona-page-layout');
        let wrapper;
        for (const item of layout) {
            if (item.parentElement?.hidden) {

            } else {
                wrapper = item;
                break;
            }
        }
        if (wrapper) {
            handleList(wrapper.querySelectorAll('div[data-pagelet^="threads_profile_posts_timeline_"]'));
        }
    }
}

export class ThreadsPageHandler implements PageHandler {
    match(url: URL) {
        return url.origin === 'https://www.threads.com';
    }

    process(iconColor: IconColor) {
        if (storageCache.settings.setting_enable_threads) {
            handleThreads();
        }
    }

    async onCustomButtonClick(target: HTMLAnchorElement) {
        return handleThreadsButton(target);
    }
}
