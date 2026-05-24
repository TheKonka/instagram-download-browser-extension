import { CLASS_CUSTOM_BUTTON } from '../constants';
import { handleVideoCoverDownloadBtn } from './button';
import { initStorageCache } from './utils/storage';
import { registeredHandlers } from './handlers';
import type { PageHandler } from './handlers';

let activeHandler: PageHandler | null = null;

async function init() {
    await initStorageCache();

    setInterval(() => {
        if (document.hidden) return;
        requestIdleCallback(processPage);
    }, 2 * 1000);

    document.body.addEventListener('click', handleGlobalClick);
}

function processPage() {
    const url = new URL(window.location.href);
    const pathnameList = url.pathname.split('/').filter((e) => e);

    const cs = document.documentElement.style.colorScheme || getComputedStyle(document.documentElement).colorScheme;
    const isDark = cs === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
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