import dayjs from 'dayjs';
import { checkType, DownloadParams, downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';
import { ProfileReel } from '../types/profileReel';

async function fetchVideoURL(containerNode: HTMLElement, videoElem: HTMLVideoElement) {
   const poster = videoElem.getAttribute('poster');
   const timeNodes = containerNode.querySelectorAll('time');
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

const getVideoSrc = async (containerNode: HTMLElement, videoElem: HTMLVideoElement) => {
   let url = videoElem.getAttribute('src');
   if (videoElem.hasAttribute('videoURL')) {
      url = videoElem.getAttribute('videoURL');
   } else if (url === null || url.includes('blob')) {
      url = await fetchVideoURL(containerNode, videoElem);
   }
   return url;
};

async function getUrl() {
   const containerNode = document.querySelector<HTMLElement>('section main');
   if (!containerNode) return;

   const pathnameList = window.location.pathname.split('/').filter((e) => e);
   const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p';

   const mediaList = containerNode.querySelectorAll('li[style][class]');

   let url, res;
   if (mediaList.length === 0) {
      // single img or video
      res = await getUrlFromInfoApi(containerNode);
      url = res?.url;
      if (!url) {
         const videoElem: HTMLVideoElement | null = containerNode.querySelector('article  div > video');
         const imgElem = containerNode.querySelector('article  div[role] div > img');
         if (videoElem) {
            // media type is video
            if (videoElem) {
               url = await getVideoSrc(containerNode, videoElem);
            }
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         } else {
            console.log('Err: not find media at handle post single');
         }
      }
   } else {
      // multiple media
      let dotsList;
      if (checkType() === 'pc') {
         dotsList = isPostDetailWithNameInUrl
            ? containerNode.querySelectorAll('article>div>div:nth-child(1)>div>div:nth-child(2)>div')
            : containerNode.querySelectorAll('div[role=button]>div>div>div>div:nth-child(2)>div');
      } else {
         dotsList = containerNode.querySelectorAll(`div[role=button][aria-hidden="true"][tabindex="0"]>div>div>div>div:nth-child(2)>div`);
      }
      const mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
      res = await getUrlFromInfoApi(containerNode, mediaIndex);
      url = res?.url;
      if (!url) {
         const listElements = [
            ...containerNode.querySelectorAll<HTMLLIElement>(
               `:scope > div > div:nth-child(1) > div > div:nth-child(1) ul li[style*="translateX"]`
            ),
         ];
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
            url = await getVideoSrc(containerNode, videoElem);
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         }
      }
   }
   return { url, res };
}

export async function handleProfileReel(target: HTMLAnchorElement) {
   const code = window.location.pathname.split('/').at(-2);

   const final = (obj: DownloadParams) => {
      if (target.className.includes('download-btn')) {
         downloadResource(obj);
      } else {
         openInNewTab(obj.url);
      }
   };

   async function getDataFromLocal() {
      const { profile_reels_edges_data, id_to_username_map } = await chrome.storage.local.get([
         'profile_reels_edges_data',
         'id_to_username_map',
      ]);

      const media = new Map(profile_reels_edges_data).get(code) as ProfileReel.Media | undefined;
      if (media) {
         const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
         const times = target.parentElement?.parentElement?.parentElement?.querySelectorAll('time');
         const time = times ? times[times.length - 1]?.getAttribute('datetime') : undefined;
         final({
            url: url,
            username:
               (new Map(id_to_username_map).get(media.user.id) as string) ||
               document.querySelector('a')?.getAttribute('href')?.replace(/\//g, ''),
            datetime: time ? dayjs(time) : undefined,
            fileId: getMediaName(url),
         });
         return true;
      }
   }

   async function getDataFromScripts() {
      function findReel(obj: Record<string, any>): any {
         for (const key in obj) {
            if (key === 'xdt_api__v1__media__shortcode__web_info') {
               return obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
               const result = findReel(obj[key]);
               if (result) {
                  return result;
               }
            }
         }
      }
      for (const script of [...window.document.scripts]) {
         try {
            const innerHTML = script.innerHTML;
            const data = JSON.parse(innerHTML);
            if (innerHTML.includes('xdt_api__v1__media__shortcode__web_info')) {
               const res = findReel(data);
               if (res) {
                  for (const media of res.items) {
                     if (media.code === code) {
                        const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
                        final({
                           url: url,
                           username: media.user.username,
                           datetime: dayjs.unix(media.taken_at),
                           fileId: getMediaName(url),
                        });
                        return;
                     }
                  }
               }
            }
         } catch {}
      }
   }

   try {
      const data = await getUrl();
      if (!data?.url) throw new Error('Cannot get url');

      const { url, res } = data;
      console.log('url', url);
      if (target.className.includes('download-btn')) {
         let postTime, posterName;
         if (res) {
            posterName = res.owner;
            postTime = res.taken_at * 1000;
         } else {
            postTime = document.querySelector('time')?.getAttribute('datetime');
            const name = document.querySelector<HTMLDivElement>(
               'section main>div>div>div>div:nth-child(2)>div>div>div>div:nth-child(2)>div>div>div'
            );
            if (name) {
               posterName = name.innerText || posterName;
            }
         }
         downloadResource({
            url: url,
            username: posterName,
            datetime: dayjs(postTime),
            fileId: getMediaName(url),
         });
      } else {
         openInNewTab(url);
      }
   } catch {
      const res = await getDataFromLocal();
      if (res !== true) {
         if (!document.querySelector('div[role=dialog]')) {
            getDataFromScripts();
         } else {
            alert('profile reel get media failed!');
         }
      }
   }
}
