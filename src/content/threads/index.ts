import { CLASS_CUSTOM_BUTTON } from '../../constants';
import { addCustomBtn } from '../button';
import type { IconColor } from '../../types/global';
import type { PageHandler } from '../handlers';
import { storageCache } from '../utils/storage';
import { handleThreadsButton } from "./button";

const LIKE_BUTTON = "M16.5 2C14.8335 2 13.2217 2.70703 12 3.93652C10.7783 2.70704 9.1665 2 7.5 2C3.3785 2 0.5 5.08423 0.5 9.5C0.5 14.1284 4.84516 19.4619 11.311 22.7719C11.5267 22.8827 11.7633 22.9379 12 22.9379C12.2367 22.9379 12.4733 22.8827 12.689 22.7719C19.1548 19.4619 23.5 14.1284 23.5 9.5C23.5 5.08423 20.6217 2 16.5 2ZM12 20.8764C6.30767 17.8962 2.5 13.3467 2.5 9.5C2.5 6.15893 4.4625 4 7.5 4C9.5 4 11.25 5.75 12 7.5C12.75 5.75 14.5 4 16.5 4C19.5377 4 21.5 6.15893 21.5 9.5C21.5 13.3467 17.6923 17.8962 12 20.8764Z"

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
