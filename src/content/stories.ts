import dayjs from 'dayjs';
import { downloadResource, getMediaName, getParentSectionNode, getUrlFromInfoApi, openInNewTab } from './utils';
import type { Stories } from '../types/stories';
import type { ReelsMedia } from '../types/global';

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
   const pathname = window.location.pathname;
   const pathnameArr = pathname.split('/').filter((e) => e);
   const posterName = pathnameArr[1];
   const {
      setting_format_use_indexing,
   } = await chrome.storage.sync.get(['setting_format_use_indexing']);

   const handleMedia = (item: Stories.ReelsMedum, mediaIndex: number) => {
      const media = item.items[mediaIndex];
      if (!media) return false;
      if (dayjs.unix(media.expiring_at).isBefore(dayjs())) {
         return false;
      }
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      if (target.className.includes('download-btn')) {
         downloadResource({
            url: url,
            username: item.user.username,
            datetime: dayjs.unix(media.taken_at),
            fileId: setting_format_use_indexing ? `${item.id}_${mediaIndex + 1}` : getMediaName(url),
         });
      } else {
         openInNewTab(url);
      }
      return true;
   };

   const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
   const stories_reels_media_data: Map<string, Stories.ReelsMedum> = new Map(stories_reels_media);

   // no media_id in url
   if (pathnameArr.length === 2) {
      let mediaIndex = 0;
      const steps = target.parentElement!.firstElementChild!.querySelectorAll(':scope>div');
      // multiple media, find the media index
      if (steps.length > 1) {
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
            } catch {}
         }
      }

      const { stories_user_ids } = await chrome.storage.local.get(['stories_user_ids']);
      const user_id = new Map(stories_user_ids).get(posterName);
      if (typeof user_id === 'string') {
         const item = stories_reels_media_data.get(user_id);
         if (item && steps.length === item.items.length) {
            const result = handleMedia(item, mediaIndex);
            if (result) return;
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
         } catch {}
      }
   } else {
      const mediaId = pathnameArr.at(-1)!;

      for (const item of [...stories_reels_media_data.values()]) {
         for (let i = 0; i < item.items.length; i++) {
            if (item.items[i].pk === mediaId) {
               const result = handleMedia(item, i);
               if (result) return;
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
         } catch {}
      }

      const { reels_media } = await chrome.storage.local.get(['reels_media']);
      const item = (reels_media || []).find((i: ReelsMedia.ReelsMedum) => i.media_ids?.includes(mediaId));
      if (item) {
         handleMedia(item, item.media_ids.indexOf(mediaId));
         return;
      }
      const sectionNode = getParentSectionNode(target);
      if (!sectionNode) return;
      const url = await storyGetUrl(target, sectionNode);
      if (url) {
         const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');
         if (target.className.includes('download-btn')) {
            downloadResource({
               url: url,
               username: posterName,
               datetime: dayjs(postTime),
               fileId: getMediaName(url),
            });
         } else {
            openInNewTab(url);
         }
      }
   }
}
