import dayjs from 'dayjs';
import {downloadResource, getMediaName, openInNewTab} from '../utils/fn';

function findFeedDataEdges(obj: Record<string, any>): Array<Record<string, any>> | null {
    if (obj) {
        if (Array.isArray(obj.edges)) {
            return obj.edges;
        }
        if (Array.isArray(obj.relatedPosts?.threads)) {
            return obj.relatedPosts.threads;
        }
    }

    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            const result = findFeedDataEdges(obj[key]);
            if (result) {
                return result;
            }
        } else if (Array.isArray(obj[key])) {
            for (const item of obj[key]) {
                const result = findFeedDataEdges(item);
                if (result) {
                    return result;
                }
            }
        }
    }

    return null;
}

function handleMedia(post: any, action: 'download' | 'open') {
    const {giphy_media_info, carousel_media, image_versions2, video_versions, text_post_app_info} = post;
    if (giphy_media_info?.first_party_cdn_proxied_images?.fixed_height?.webp) {
        const url = giphy_media_info?.first_party_cdn_proxied_images?.fixed_height?.webp;
        if (action === 'download') {
            downloadResource({
                url: url,
                username: post.user.username,
                datetime: dayjs.unix(post.taken_at),
                fileId: getMediaName(url),
            });
        } else {
            openInNewTab(url);
        }
    }
    if (Array.isArray(carousel_media) && carousel_media.length > 0) {
        carousel_media.forEach((item: any) => {
            const url = item.video_versions?.[0]?.url || item.image_versions2?.candidates?.[0]?.url;
            console.log('url', post, url);
            if (!url) return;
            if (action === 'download') {
                downloadResource({
                    url: url,
                    username: post.user.username,
                    datetime: dayjs.unix(post.taken_at),
                    fileId: getMediaName(url),
                });
            } else {
                openInNewTab(url);
            }
        });
    } else {
        const url = video_versions?.[0]?.url || image_versions2?.candidates?.[0]?.url;
        if (url) {
            console.log('url', post, url);
            if (action === 'download') {
                downloadResource({
                    url: url,
                    username: post.user.username,
                    datetime: dayjs.unix(post.taken_at),
                    fileId: getMediaName(url),
                });
            } else {
                openInNewTab(url);
            }
        } else {
            const data = text_post_app_info?.linked_inline_media;
            if (data && Array.isArray(data.video_versions)) {
                const url = data.video_versions[0]?.url;
                if (!url) return;
                if (action === 'download') {
                    downloadResource({
                        url: url,
                        username: post.user.username,
                        datetime: dayjs.unix(post.taken_at),
                        fileId: getMediaName(url),
                    });
                } else {
                    openInNewTab(url);
                }
            } else if (data && Array.isArray(data.carousel_media)) {
                data.carousel_media.forEach((item: any) => {
                    const url = item.video_versions?.[0]?.url || item.image_versions2?.candidates?.[0]?.url;
                    console.log('url', post, url);
                    if (!url) return;
                    if (action === 'download') {
                        downloadResource({
                            url: url,
                            username: post.user.username,
                            datetime: dayjs.unix(post.taken_at),
                            fileId: getMediaName(url),
                        });
                    } else {
                        openInNewTab(url);
                    }
                });
            }
        }
    }
}

export async function handleThreadsPost(container: HTMLDivElement, action: 'download' | 'open') {
    const postCode = [...container.querySelectorAll('a')].find((i) => /\w+\/post\/\w+/.test(i.href))?.href.split('/post/')[1];
    const {threads} = await chrome.storage.local.get(['threads']);
    const data = new Map(threads);
    const thread = data.get(postCode) as Record<string, any> | undefined;

    if (thread) {
        handleMedia(thread.post || thread, action);
        return;
    } else {
        for (const script of window.document.scripts) {
            try {
                const innerHTML = script.innerHTML;
                const data = JSON.parse(innerHTML);
                if (innerHTML.includes('thread_items')) {
                    const arr = findFeedDataEdges(data);

                    if (Array.isArray(arr)) {
                        const data = arr
                            .map(
                                (i) =>
                                    i.node?.text_post_app_thread?.thread_items ||
                                    i.node?.thread_items ||
                                    i.node?.thread?.thread_items ||
                                    i.text_post_app_thread?.thread_items ||
                                    i.thread_items
                            )
                            .flat()
                            .find((i: Record<string, any> | undefined) => i?.post.code === postCode);

                        if (data) {
                            const {post} = data;
                            handleMedia(post, action);
                            return;
                        }
                    }
                }
            } catch {
            }
        }
    }
}
