import { downloadResource, openInNewTab } from './utils/fn';
import { storageCache } from './utils/storage';

export async function profileOnClicked(target: HTMLAnchorElement) {
    const data = new Map(storageCache.data.user_profile_pic_url || []);
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
