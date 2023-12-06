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
   let url: string | null = null;

   url = await getUrlFromInfoApi(target);

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
   // 检查对象是否包含 reels_media 属性
   if (obj && obj.reels_media) {
      return obj.reels_media;
   }

   // 遍历对象的属性
   for (const key in obj) {
      // 如果属性的值是对象，递归调用函数
      if (typeof obj[key] === 'object') {
         const result = findReelsMedia(obj[key]);
         // 如果找到了，返回结果
         if (result) {
            return result;
         }
      }
   }

   // 如果对象中没有 reels_media 属性，则返回 null
   return null;
}

function handleMedia(item: ReelsMedia.ReelsMedum, mediaIndex: number, action: 'download' | 'open') {
   let url;
   const media = item.items[mediaIndex];
   if (Array.isArray(media['video_versions'])) {
      url = media['video_versions'][0].url;
   } else if (media['image_versions2']) {
      url = media['image_versions2'].candidates[0].url;
   }
   if (url) {
      const fileName = item.user.username + '-' + dayjs(media.taken_at).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
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
   const pathnameArr = pathname.split('/');
   const action = target.className.includes('download-btn') ? 'download' : 'open';

   // no media_id in url
   if (pathnameArr.length === 4) {
      [...window.document.scripts].forEach((script) => {
         try {
            const innerHTML = script.innerHTML;
            const data = JSON.parse(innerHTML);
            if (innerHTML.includes('reels_media')) {
               const arr = findReelsMedia(data);
               if (Array.isArray(arr)) {
                  const item = arr[0];
                  let mediaIndex = 0;
                  const step = document.querySelectorAll('section>div>div>div>div:nth-child(1)>div:nth-child(1)>div:nth-child(1)>div');
                  // mutiple media
                  if (step.length > 1) {
                     step.forEach((item, index) => {
                        if (item.childNodes.length === 1) {
                           mediaIndex = index;
                        }
                     });
                  }
                  if (handleMedia(item, mediaIndex, action)) {
                     return;
                  }
               }
            }
         } catch (e) {}
      });
      return;
   }

   const mediaId = pathnameArr.at(-2) as string;
   const { reels_media } = await chrome.storage.local.get(['reels_media']);
   const item = ((reels_media as ReelsMedia.ReelsMedum[]) || []).find((i) => i.media_ids?.includes(mediaId));
   if (item && handleMedia(item, item.media_ids.indexOf(mediaId), action)) {
      return;
   }

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
