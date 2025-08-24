import dayjs from 'dayjs';
import {
   checkType,
   downloadResource,
   getMediaName,
   getParentArticleNode,
   getUrlFromInfoApi,
   handleZipChrome,
   handleZipFirefox,
   openInNewTab,
} from './utils';

async function fetchVideoURL(articleNode: HTMLElement, videoElem: HTMLVideoElement) {
   const poster = videoElem.getAttribute('poster');
   const timeNodes = articleNode.querySelectorAll('time');
   const posterUrl = (timeNodes[timeNodes.length - 1].parentNode!.parentNode as any).href;
   const posterPattern = /\/([^/?]*)\?/;
   const posterMatch = poster?.match(posterPattern);
   const postFileName = posterMatch?.[1];
   const resp = await fetch(posterUrl);
   const content = await resp.text();
   const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
   const match = content.match(pattern);
   let videoUrl = JSON.parse(match?.[1] ?? '');
   videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/g, 'https://scontent.cdninstagram.com');
   videoElem.setAttribute('videoURL', videoUrl);
   return videoUrl;
}

const getVideoSrc = async (articleNode: HTMLElement, videoElem: HTMLVideoElement) => {
   let url = videoElem.getAttribute('src');
   if (videoElem.hasAttribute('videoURL')) {
      url = videoElem.getAttribute('videoURL');
   } else if (url === null || url.includes('blob')) {
      url = await fetchVideoURL(articleNode, videoElem);
   }
   return url;
};

async function postGetUrl(articleNode: HTMLElement) {
   let url, res;
   let mediaIndex = -1;

   if (articleNode.querySelectorAll('li[style][class]').length === 0) {
      // single img or video
      res = await getUrlFromInfoApi(articleNode);
      url = res?.url;
      if (!url) {
         const videoElem = articleNode.querySelector<HTMLVideoElement>('article  div > video');
         const imgElem = articleNode.querySelector<HTMLImageElement>('article  div[role] div > img');
         if (videoElem) {
            // media type is video
            if (videoElem) {
               url = await getVideoSrc(articleNode, videoElem);
            }
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         } else {
            console.log('Err: not find media at handle post single');
         }
      }
   } else {
      // multiple img or videos
      const isPostView = window.location.pathname.startsWith('/p/');
      let dotsList: any;
      if (isPostView) {
         dotsList = articleNode.querySelectorAll(`:scope > div > div > div > div:nth-child(2)>div`);
      } else {
         if (checkType() === 'pc') {
            dotsList =
               articleNode.querySelector('ul')?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement
                  ?.nextElementSibling?.childNodes || [];
         } else {
            dotsList = articleNode.querySelectorAll(`:scope > div > div:nth-child(2) > div>div>div>div>div>div:nth-child(2)>div`);
         }
      }

      // if get dots list fail, try get img url from img element attribute
      if (dotsList.length === 0) {
         const imgList = articleNode.querySelectorAll(`${isPostView ? ':scope>div>div:nth-child(1)' : ''} li img`);
         const { x, right } = articleNode.getBoundingClientRect();
         for (const item of [...imgList]) {
            const rect = item.getBoundingClientRect();
            if (rect.x > x && rect.right < right) {
               url = item.getAttribute('src');
               return { url };
            }
         }
         return null;
      }

      mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
      if (mediaIndex === -1) {
         const idx = new URLSearchParams(window.location.search).get('img_index');
         if (idx) {
            mediaIndex = +idx - 1;
         } else {
            mediaIndex = 0;
         }
      }
      res = await getUrlFromInfoApi(articleNode, mediaIndex);
      url = res?.url;
      if (!url) {
         const listElements = [
            ...articleNode.querySelectorAll(
               `:scope > div > div:nth-child(${isPostView ? 1 : 2}) > div > div:nth-child(1) ul li[style*="translateX"]`
            ),
         ] as HTMLLIElement[];
         const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
         const positionsMap = listElements.reduce<Record<string, HTMLLIElement>>((result, element) => {
            const position = Math.round(Number(element.style.transform.match(/-?(\d+)/)?.[1]) / listElementWidth);
            return { ...result, [position]: element };
         }, {});

         const node = positionsMap[mediaIndex];
         const videoElem = node.querySelector('video');
         const imgElem = node.querySelector('img');
         if (videoElem) {
            // media type is video
            url = await getVideoSrc(articleNode, videoElem);
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         }
      }
   }
   return { url, res, mediaIndex };
}

export async function postOnClicked(target: HTMLAnchorElement) {
   const { setting_format_use_indexing } = await chrome.storage.sync.get(['setting_format_use_indexing']);
   try {
      const articleNode = getParentArticleNode(target);
      if (!articleNode) throw new Error('Cannot find article node');

      if (target.className.includes('zip-btn')) {
         return typeof browser !== 'undefined' ? handleZipFirefox(articleNode) : handleZipChrome(articleNode);
      }

      const data = await postGetUrl(articleNode);
      if (!data?.url) throw new Error('Cannot get url');
      const { url, res, mediaIndex } = data;
      console.log('post url=', url);
      if (target.className.includes('download-btn')) {
         let postTime, posterName, fileId;
         if (res) {
            posterName = res.owner;
            postTime = dayjs.unix(res.taken_at);
            fileId = res.origin_data?.id || getMediaName(url);
         } else {
            postTime = articleNode.querySelector('time')?.getAttribute('datetime');
            posterName = articleNode.querySelector('a')?.getAttribute('href')?.replace(/\//g, '');
            const tagNode = document.querySelector(
               'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
            );
            if (tagNode) {
               const name = document.querySelector<HTMLSpanElement>('article header>div:nth-child(2) span');
               if (name) {
                  posterName = name.innerText || posterName;
               }
            }
         }
         if (mediaIndex !== undefined && mediaIndex >= 0) {
            fileId = `${fileId}_${mediaIndex + 1}`;
         }
         // if setting_format_use_indexing is disabled (by setting it to false), then we need to overwrite the fileId to getMediaName(url).
         // Otherwise, the fileId could be the res.origin_data?.id without indexing, and multiple media from the same post could yield
         // to same filename when indexing is disabled.
         if (!setting_format_use_indexing) {
            fileId = getMediaName(url);
         }
         downloadResource({
            url: url,
            username: posterName,
            datetime: dayjs(postTime),
            fileId: fileId || getMediaName(url),
         });
      } else {
         openInNewTab(url);
      }
   } catch (e: any) {
      alert('post get media failed!');
      console.log(`Uncaught in postOnClicked(): ${e}\n${e.stack}`);
   }
}
