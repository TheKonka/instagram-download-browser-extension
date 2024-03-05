import dayjs from 'dayjs';
import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';
import { ReelsMedia } from '../types';

function storyGetSectionNode(target: HTMLAnchorElement) {
   let sectionNode: HTMLElement = target;
   while (sectionNode && sectionNode.tagName !== 'SECTION') {
      sectionNode = sectionNode.parentNode as HTMLElement;
   }
   return sectionNode;
}

async function storyGetUrl(target: HTMLElement, sectionNode: any) {
   const res = await getUrlFromInfoApi(target);
   let url = res?.url;
   if (!url) {
      if (sectionNode.querySelector('video > source')) {
         url = sectionNode.querySelector('video > source').getAttribute('src');
      } else if (sectionNode.querySelector('img[decoding="sync"]')) {
         const img = sectionNode.querySelector('img[decoding="sync"]');
         url = img.srcset.split(/ \d+w/g)[0].trim(); // extract first src from srcset attr. of img
         if (url && url.length > 0) {
            return url;
         }
         url = sectionNode.querySelector('img[decoding="sync"]').getAttribute('src');
      } else if (sectionNode.querySelector('video')) {
         url = sectionNode.querySelector('video').getAttribute('src');
      }
   }
   return url;
}

function findReelsMedia(obj: Record<string, any>): Array<ReelsMedia.ReelsMedum> | null {
   if (obj && obj.reels_media) {
      return obj.reels_media;
   }

   for (const key in obj) {
      if (typeof obj[key] === 'object') {
         const result = findReelsMedia(obj[key]);
         if (result) {
            return result;
         }
      }
   }

   return null;
}

// 递归搜索包含 rootView 的对象
function findRootView(obj: Record<string, any>): Record<string, any> | undefined {
   for (const key in obj) {
      if (key === 'rootView') {
         return obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
         const result = findRootView(obj[key]);
         if (result) {
            return result;
         }
      }
   }
}

function handleMedia(item: ReelsMedia.ReelsMedum, mediaIndex: number, action: 'download' | 'open') {
   let url;
   const media = item.items[mediaIndex];
   if (!media) return false;
   if (Array.isArray(media['video_versions'])) {
      url = media['video_versions'][0].url;
   } else if (media['image_versions2']) {
      url = media['image_versions2'].candidates[0].url;
   }
   if (url) {
      const fileName = item.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
      if (action === 'download') {
         downloadResource(url, fileName);
      } else {
         openInNewTab(url);
      }
      return true;
   }
   return false;
}

export async function storyOnClicked(target: HTMLAnchorElement) {
   const sectionNode = storyGetSectionNode(target);
   const pathname = window.location.pathname;
   const pathnameArr = pathname.split('/').filter((e) => e);
   const posterName = pathnameArr[1];
   const action = target.className.includes('download-btn') ? 'download' : 'open';

   // no media_id in url
   if (pathnameArr.length === 2) {
      let mediaIndex = 0;
      const steps = document.querySelectorAll('section>div>div>div>div:nth-child(1)>div:nth-child(1)>div:nth-child(1)>div');
      // mutiple media
      if (steps.length > 1) {
         steps.forEach((item, index) => {
            if (item.childNodes.length === 1) {
               mediaIndex = index;
            }
         });
      }

      // when refresh the page, data return with html but not xhr
      if (window.history.length <= 2) {
         for (const script of window.document.scripts) {
            try {
               const innerHTML = script.innerHTML;
               const data = JSON.parse(innerHTML);
               if (innerHTML.includes('reels_media')) {
                  const arr = findReelsMedia(data);
                  if (Array.isArray(arr)) {
                     const item = arr[0];
                     if (item && handleMedia(item, mediaIndex, action)) {
                        return;
                     }
                  }
               }
            } catch (e) {}
         }
      }

      const { stories_user_ids, v1_feed_reels_media } = await chrome.storage.local.get(['stories_user_ids', 'v1_feed_reels_media']);
      const user_id = new Map(stories_user_ids).get(posterName);
      if (user_id && Array.isArray(v1_feed_reels_media)) {
         const item = v1_feed_reels_media.find((i: any) => i.id === user_id);
         if (item && handleMedia(item, mediaIndex, action)) {
            return;
         }
      }

      for (const script of window.document.scripts) {
         try {
            const innerHTML = script.innerHTML;
            const data = JSON.parse(innerHTML);
            if (innerHTML.includes('rootView')) {
               const rootViewData = findRootView(data);
               const id = rootViewData?.props.media_owner_id || rootViewData?.props.id;
               const item = v1_feed_reels_media?.find((i: any) => i.id === id);
               if (item && handleMedia(item, mediaIndex, action)) {
                  return;
               }
            }
         } catch (e) {}
      }
   } else {
      const mediaId = pathnameArr.at(-1)!;
      const { reels_media } = await chrome.storage.local.get(['reels_media']);
      const item = ((reels_media as ReelsMedia.ReelsMedum[]) || []).find((i) => i.media_ids?.includes(mediaId));
      if (item && handleMedia(item, item.media_ids.indexOf(mediaId), action)) {
         return;
      }

      const url = await storyGetUrl(target, sectionNode);
      if (url && url.length > 0) {
         const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');
         const fileName = posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
         if (action === 'download') {
            downloadResource(url, fileName);
         } else {
            openInNewTab(url);
         }
      }
   }
}
