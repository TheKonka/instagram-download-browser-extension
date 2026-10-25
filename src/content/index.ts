import { CLASS_CUSTOM_BUTTON } from '../constants';
import { handleVideoCoverDownloadBtn } from './button';
import { initStorageCache, storageCache } from './utils/storage';
import type { PageHandler } from './handlers';
import { registeredHandlers } from './handlers';

let activeHandler: PageHandler | null = null;

function shouldDoNothing() {
    if (window.location.host === 'www.threads.com' && !storageCache.settings.setting_enable_threads) {
        return true;
    }
    const pathnameList = window.location.pathname.split("/").filter(e => e)
    if (pathnameList.length === 3 && pathnameList[0] === "p" && pathnameList[2] === "comments") {
        return true
    }
    return document.hidden
}

async function init() {
    await initStorageCache();

    setInterval(() => {
        if (shouldDoNothing()) return;
        requestIdleCallback(processPage);
    }, 2 * 1000);

    document.body.addEventListener('click', handleGlobalClick);
}

function processPage() {
    const url = new URL(window.location.href);
    const pathnameList = url.pathname.split('/').filter((e) => e);

    const cs = document.documentElement.style.colorScheme || getComputedStyle(document.documentElement).colorScheme;
    const isDark = cs === 'dark' ? true : cs === 'light' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const iconColor = isDark ? 'white' : 'black';

    // Reset activeHandler
    activeHandler = null;

    for (const handler of registeredHandlers) {
        if (handler.match(url, pathnameList)) {
            activeHandler = handler;
            handler.process(iconColor);
            break;
        }
    }
}

function handleGlobalClick(e: MouseEvent) {
    if (e.target instanceof Element) {
        const btn = e.target.closest(`.${CLASS_CUSTOM_BUTTON}`);
        if (btn && btn instanceof HTMLAnchorElement) {
            e.preventDefault();
            if (btn.getAttribute("data-video-cover-download") == "true") {
                handleVideoCoverDownloadBtn(btn.parentElement!);
                return;
            }
            if (activeHandler && activeHandler.onCustomButtonClick) {
                activeHandler.onCustomButtonClick(btn).catch(console.error);
            }
        }
    }
}

init();
