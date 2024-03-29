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

function findHighlight(obj: Record<string, any>): Record<string, any> | undefined {
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
   const sectionNode = storyGetSectionNode(target);
   const pathname = window.location.pathname;
   const pathnameArr = pathname.split('/');

   const action = target.className.includes('download-btn') ? 'download' : 'open';

   let mediaIndex = 0;
   if (document.querySelectorAll('section').length === 1) {
      // single highlight
      sectionNode
         .querySelector(':scope>div>div>div>div>div>div')
         ?.querySelectorAll(':scope>div')
         .forEach((i, idx) => {
            if (i.childNodes.length === 1) {
               mediaIndex = idx;
            }
         });
   } else {
      // multi highlight
      sectionNode
         .querySelector(':scope>div>div>div>div>div>div>div')
         ?.querySelectorAll(':scope>div')
         .forEach((i, idx) => {
            if (i.childNodes.length === 1) {
               mediaIndex = idx;
            }
         });
   }

   const { highlights } = await chrome.storage.local.get(['highlights']);
   const localData = highlights?.find((i: any) => i.id === 'highlight:' + pathnameArr[3]);
   if (localData) {
      let url;
      const media = localData.items[mediaIndex];
      if (media['video_versions']) {
         url = media['video_versions'][0].url;
      } else if (media['image_versions2']) {
         url = media['image_versions2'].candidates[0].url;
      }
      if (url) {
         const fileName = localData.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
         if (action === 'download') {
            downloadResource(url, fileName);
         } else {
            openInNewTab(url);
         }
         return;
      }
   }

   [...window.document.scripts].forEach((script) => {
      try {
         const innerHTML = script.innerHTML;
         const data = JSON.parse(innerHTML);
         if (innerHTML.includes('xdt_api__v1__feed__reels_media__connection')) {
            const res = findHighlight(data);
            const edges = res?.edges;
            let url;
            const media = edges[0].node.items[mediaIndex];
            if (media['video_versions']) {
               url = media['video_versions'][0].url;
            } else if (media['image_versions2']) {
               url = media['image_versions2'].candidates[0].url;
            }
            if (url) {
               const fileName =
                  edges[0].node.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
               if (action === 'download') {
                  downloadResource(url, fileName);
               } else {
                  openInNewTab(url);
               }
               return;
            }
         }
      } catch (e) {}
   });

   const url = await storyGetUrl(target, sectionNode);
   if (url && url.length > 0) {
      const posterName = pathnameArr[2];
      const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');
      const fileName = posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
      if (action === 'download') {
         downloadResource(url, fileName);
      } else {
         openInNewTab(url);
      }
   }
}
