import dayjs from 'dayjs';
import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';
import type { Reels } from '../types/reels';

async function fetchVideoURL(videoElem: HTMLVideoElement) {
   const resp = await fetch(window.location.href);
   const content = await resp.text();
   const videoUrl = content.match(/video_versions.*?url":"([^"].*?)".*?]/)?.[1];
   if (!videoUrl) return null;
   const url = JSON.parse('{"href": "' + videoUrl.replace(/\\\//g, '/') + '"}');
   videoElem.setAttribute('videoURL', url.href);
   return url.href;
}

const getVideoSrc = async (videoElem: HTMLVideoElement) => {
   if (videoElem.hasAttribute('videoURL')) {
      return videoElem.getAttribute('videoURL');
   }
   let url = videoElem.getAttribute('src');
   if (url === null || url.includes('blob')) {
      url = await fetchVideoURL(videoElem);
   }
   return url;
};

async function getUrl(wrapperNode: HTMLDivElement) {
   const res = await getUrlFromInfoApi(wrapperNode);
   let url = res?.url;
   if (!url) {
      const videoElem = wrapperNode.querySelector('video');
      if (videoElem) {
         url = await getVideoSrc(videoElem);
      }
   }
   return url;
}

function findReels(obj: Record<string, any>): Reels.XdtApiV1ClipsHomeConnectionV2 | undefined {
   for (const key in obj) {
      if (key === 'xdt_api__v1__clips__home__connection_v2') {
         return obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
         const result = findReels(obj[key]);
         if (result) {
            return result;
         }
      }
   }
}

export async function reelsOnClicked(target: HTMLAnchorElement) {
   const final = (url: string, filename: string) => {
      if (target.className.includes('download-btn')) {
         downloadResource(url, filename);
      } else {
         openInNewTab(url);
      }
   };

   const handleMedia = (media: Reels.Media) => {
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      const filename = media.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
      final(url, filename);
   };

   const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
   const code = window.location.pathname.split('/').at(-2);
   const media = new Map(reels_edges_data).get(code) as Reels.Media | undefined;
   if (media) {
      handleMedia(media);
      return;
   }

   for (const script of window.document.scripts) {
      try {
         const innerHTML = script.innerHTML;
         const data = JSON.parse(innerHTML);
         if (innerHTML.includes('xdt_api__v1__clips__home__connection_v2')) {
            const res = findReels(data);
            if (res) {
               for (const item of res.edges) {
                  if (item.node.media.code === code) {
                     handleMedia(item.node.media);
                     return;
                  }
               }
            }
         }
      } catch (e) {}
   }

   const wrapperNode = target.parentNode!.parentNode as HTMLDivElement;
   try {
      const url = await getUrl(wrapperNode);
      console.log('url', url);
      if (url) {
         const posterName = [...wrapperNode.querySelectorAll('a')].find((i) => i.href.includes('reels'))?.innerText;
         final(url, posterName + '-' + getMediaName(url));
      }
   } catch (e: any) {
      alert('Reels Download Failed!');
      console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
      return;
   }
}
