import dayjs from 'dayjs';
import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';
import type { Stories } from '../types/stories';
import type { ReelsMedia } from '../types/types';

function storyGetSectionNode(target: HTMLAnchorElement) {
   let sectionNode: HTMLElement = target;
   while (sectionNode && sectionNode.tagName !== 'SECTION' && sectionNode.parentElement) {
      sectionNode = sectionNode.parentElement;
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

function findStories(obj: Record<string, any>): Stories.XdtApiV1FeedReelsMedia | undefined {
   for (const key in obj) {
      if (key === 'xdt_api__v1__feed__reels_media') {
         return obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
         const result = findStories(obj[key]);
         if (result) {
            return result;
         }
      }
   }
}

export async function storyOnClicked(target: HTMLAnchorElement) {
   const sectionNode = storyGetSectionNode(target);
   const pathname = window.location.pathname;
   const pathnameArr = pathname.split('/').filter((e) => e);
   const posterName = pathnameArr[1];

   const handleMedia = (item: Stories.ReelsMedum, mediaIndex: number) => {
      const media = item.items[mediaIndex];
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      const filename = item.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
      if (target.className.includes('download-btn')) {
         downloadResource(url, filename);
      } else {
         openInNewTab(url);
      }
   };

   const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
   const stories_reels_media_data: Map<string, Stories.ReelsMedum> = new Map(stories_reels_media);

   // no media_id in url
   if (pathnameArr.length === 2) {
      let mediaIndex = 0;
      const steps = target.parentElement!.firstElementChild!.querySelectorAll('div');
      // multiple media
      if (steps && steps.length > 1) {
         steps.forEach((item, index) => {
            if (item.childNodes.length === 1) {
               mediaIndex = index;
            }
         });
      }

      // when open the page from an empty tab, data return with html but not xhr
      if (window.history.length <= 2) {
         for (const script of window.document.scripts) {
            try {
               const innerHTML = script.innerHTML;
               const data = JSON.parse(innerHTML);
               if (innerHTML.includes('xdt_api__v1__feed__reels_media')) {
                  const res = findStories(data);
                  if (res) {
                     handleMedia(res.reels_media[0], mediaIndex);
                     return;
                  }
               }
            } catch (e) {}
         }
      }

      const { stories_user_ids } = await chrome.storage.local.get(['stories_user_ids']);
      const user_id = new Map(stories_user_ids).get(posterName);
      if (typeof user_id === 'string') {
         const item = stories_reels_media_data.get(user_id);
         if (item) {
            handleMedia(item, mediaIndex);
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
               const item = stories_reels_media_data.get(id);
               if (item) {
                  handleMedia(item, mediaIndex);
                  return;
               }
            }
         } catch (e) {}
      }
   } else {
      const mediaId = pathnameArr.at(-1)!;

      for (const item of [...stories_reels_media_data.values()]) {
         for (let i = 0; i < item.items.length; i++) {
            if (item.items[i].pk === mediaId) {
               handleMedia(item, i);
               return;
            }
         }
      }

      for (const script of window.document.scripts) {
         try {
            const innerHTML = script.innerHTML;
            const data = JSON.parse(innerHTML);
            if (innerHTML.includes('xdt_api__v1__feed__reels_media')) {
               const res = findStories(data);
               if (res) {
                  handleMedia(
                     res.reels_media[0],
                     res.reels_media[0].items.findIndex((i) => i.pk === mediaId)
                  );
                  return;
               }
            }
         } catch (e) {}
      }

      const { reels_media } = await chrome.storage.local.get(['reels_media']);
      const item = (reels_media || []).find((i: ReelsMedia.ReelsMedum) => i.media_ids?.includes(mediaId));
      if (item) {
         handleMedia(item, item.media_ids.indexOf(mediaId));
         return;
      }

      const url = await storyGetUrl(target, sectionNode);
      if (url) {
         const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');
         const filename = posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
         if (target.className.includes('download-btn')) {
            downloadResource(url, filename);
         } else {
            openInNewTab(url);
         }
      }
   }
}
