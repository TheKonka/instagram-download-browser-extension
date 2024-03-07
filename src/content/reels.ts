import dayjs from 'dayjs';
import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';

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

export async function reelsOnClicked(target: HTMLAnchorElement) {
   const action = target.className.includes('download-btn') ? 'download' : 'open';

   const { reels_edges } = await chrome.storage.local.get(['reels_edges']);
   const code = window.location.pathname.split('/').at(-2);
   if (Array.isArray(reels_edges) && code) {
      const media = reels_edges.find((i: Record<string, any>) => i.code === code);
      if (media) {
         let url;
         if (media['video_versions']) {
            url = media['video_versions'][0].url;
         } else if (media['image_versions2']) {
            url = media['image_versions2'].candidates[0].url;
         }
         if (url) {
            const fileName = media.user.username + '-' + dayjs(media.taken_at * 1000).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url);
            if (action === 'download') {
               downloadResource(url, fileName);
            } else {
               openInNewTab(url);
            }
            return;
         }
      }
   }

   const wrapperNode = target.parentNode!.parentNode as HTMLDivElement;
   try {
      const url = await getUrl(wrapperNode);
      console.log('url', url);
      if (url && url.length > 0) {
         if (action === 'download') {
            try {
               const posterName = [...wrapperNode.querySelectorAll('a')].find((i) => i.href.includes('reels'))?.innerText;
               downloadResource(url, posterName + '-' + getMediaName(url));
            } catch (e) {
               downloadResource(url);
            }
         } else {
            openInNewTab(url);
         }
      }
   } catch (e: any) {
      alert('Reels Download Failed!');
      console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
      return;
   }
}
