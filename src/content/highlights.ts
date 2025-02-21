import dayjs from 'dayjs';
import { checkType, DownloadParams, downloadResource, getMediaName, openInNewTab } from './utils';
import type { Highlight } from '../types/highlights';
import type { ReelsMedia } from '../types/global';

function getSectionNode(target: HTMLAnchorElement) {
   let sectionNode: HTMLElement = target;
   while (sectionNode.tagName !== 'SECTION' && sectionNode.parentElement) {
      sectionNode = sectionNode.parentElement;
   }
   return sectionNode;
}

function findHighlight(obj: Record<string, any>): Highlight.XdtApiV1FeedReelsMediaConnection | undefined {
   for (const key in obj) {
      if (key === 'xdt_api__v1__feed__reels_media__connection') {
         return obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
         const result = findHighlight(obj[key]);
         if (result) {
            return result;
         }
      }
   }
}

export async function highlightsOnClicked(target: HTMLAnchorElement) {
   const sectionNode = getSectionNode(target);
   const pathname = window.location.pathname; // "/stories/highlights/18023929792378379/"
   const pathnameArr = pathname.split('/');
   const {
      setting_format_use_indexing,
   } = await chrome.storage.sync.get(['setting_format_use_indexing']);

   const final = (url: string, filenameObj?: Omit<DownloadParams, 'url'>) => {
      if (target.className.includes('download-btn')) {
         if (filenameObj) {
            downloadResource({
               url: url,
               ...filenameObj,
            });
         } else {
            let posterName = 'highlights';
            for (const item of sectionNode.querySelectorAll('a[role=link]')) {
               const hrefArr = item
                  .getAttribute('href')
                  ?.split('/')
                  .filter((_) => _);
               if (hrefArr?.length === 1) {
                  posterName = hrefArr[1];
                  break;
               }
            }
            const postTime = [...sectionNode.querySelectorAll('time')].find((i) => i.classList.length !== 0)?.getAttribute('datetime');
            downloadResource({
               url: url,
               username: posterName,
               datetime: postTime,
               fileId: getMediaName(url),
            });
         }
      } else {
         openInNewTab(url);
      }
   };

   let mediaIndex = 0;

   const handleMedias = (data: Highlight.Node) => {
      const media = data.items[mediaIndex];
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      final(url, {
         username: data.user.username,
         datetime: dayjs.unix(media.taken_at),
         fileId: setting_format_use_indexing ? `${data.id}_${mediaIndex + 1}` : getMediaName(url) 
      });
   };

   target.parentElement?.firstElementChild?.querySelectorAll(':scope>div').forEach((i, idx) => {
      if (i.childNodes.length === 1) {
         mediaIndex = idx;
      }
   });

   //  profile page highlight on Android
   if (checkType() === 'android') {
      sectionNode.querySelectorAll('header>div:nth-child(1)>div').forEach((item, index) => {
         item.querySelectorAll('div').forEach((i) => {
            if (i.classList.length === 2) {
               mediaIndex = index;
            }
         });
      });
      const { reels_media } = await chrome.storage.local.get(['reels_media']);
      const itemOnAndroid = (reels_media || []).find((i: ReelsMedia.ReelsMedum) => i.id === 'highlight:' + pathnameArr[3]);
      if (itemOnAndroid) {
         handleMedias(itemOnAndroid);
         return;
      }
      for (const item of sectionNode.querySelectorAll<HTMLImageElement>('img')) {
         if (item.srcset !== '') {
            final(item.src);
            return;
         }
      }
   }

   const { highlights_data } = await chrome.storage.local.get(['highlights_data']);
   const localData = new Map(highlights_data).get('highlight:' + pathnameArr[3]) as Highlight.Node | undefined;
   if (localData) {
      handleMedias(localData);
      return;
   }

   for (const script of window.document.scripts) {
      try {
         const innerHTML = script.innerHTML;
         const data = JSON.parse(innerHTML);
         if (innerHTML.includes('xdt_api__v1__feed__reels_media__connection')) {
            const res = findHighlight(data);
            if (res) {
               handleMedias(res.edges[0].node);
               return;
            }
         }
      } catch {}
   }

   const videoUrl = sectionNode.querySelector('video')?.getAttribute('src');
   if (videoUrl) {
      final(videoUrl);
      return;
   }

   for (const item of sectionNode.querySelectorAll<HTMLImageElement>('img[referrerpolicy="origin-when-cross-origin"]')) {
      if (item.classList.length > 1) {
         final(item.src);
         return;
      }
   }

   alert('download highlights failed!');
}
