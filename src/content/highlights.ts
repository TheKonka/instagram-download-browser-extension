import dayjs from 'dayjs';
import { checkType, downloadResource, getMediaName, openInNewTab } from './utils';
import type { Highlight } from '../types/highlights';
import type { ReelsMedia } from '../types/types';

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

   const final = (url: string, filename?: string) => {
      if (target.className.includes('download-btn')) {
         if (!filename) {
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
            filename = posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
         }
         downloadResource(url, filename);
      } else {
         openInNewTab(url);
      }
   };

   const handleMeidas = (data: Highlight.Node) => {
      const media = data.items[mediaIndex];
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      const filename = data.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
      final(url, filename);
   };

   let mediaIndex = 0;
   if (document.querySelectorAll('section').length === 1) {
      // single highlight (open from new tab)
      sectionNode
         .querySelector(':scope>div>div>div>div>div>div>div')
         ?.querySelectorAll(':scope>div')
         .forEach((i, idx) => {
            if (i.childNodes.length === 1) {
               mediaIndex = idx;
            }
         });
   } else {
      // multi highlight (open from profile page)
      sectionNode
         .querySelector(':scope>div>div>div>div>div>div>div>div>div')
         ?.querySelectorAll(':scope>div')
         .forEach((i, idx) => {
            if (i.childNodes.length === 1) {
               mediaIndex = idx;
            }
         });
   }

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
         handleMeidas(itemOnAndroid);
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
      handleMeidas(localData);
      return;
   }

   for (const script of window.document.scripts) {
      try {
         const innerHTML = script.innerHTML;
         const data = JSON.parse(innerHTML);
         if (innerHTML.includes('xdt_api__v1__feed__reels_media__connection')) {
            const res = findHighlight(data);
            if (res) {
               handleMeidas(res.edges[0].node);
               return;
            }
         }
      } catch (e) {}
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
