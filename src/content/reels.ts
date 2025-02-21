import dayjs from 'dayjs';
import { DownloadParams, downloadResource, fetchHtml, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';
import type { Reels } from '../types/reels';

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
   const final = (obj: DownloadParams) => {
      if (target.className.includes('download-btn')) {
         downloadResource(obj);
      } else {
         openInNewTab(obj.url);
      }
   };

   const handleMedia = (media: Reels.Media) => {
      const url = media.video_versions?.[0].url || media.image_versions2.candidates[0].url;
      final({
         url: url,
         username: media.user.username,
         datetime: dayjs.unix(media.taken_at),
         fileId: getMediaName(url),
      });
   };

   const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
   const code = window.location.pathname.split('/').at(-2);
   const media = new Map(reels_edges_data).get(code) as Reels.Media | undefined;
   if (media) {
      handleMedia(media);
      return;
   }

   const scripts = await fetchHtml();
   for (const script of [...window.document.scripts, ...scripts]) {
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
      } catch {}
   }

   const wrapperNode = target.parentNode!.parentNode as HTMLDivElement;
   try {
      const res = await getUrlFromInfoApi(wrapperNode);
      if (!res) return;
      console.log('url', res.url);
      final({
         url: res.url,
         username: res.owner,
         datetime: dayjs.unix(res.taken_at),
         fileId: getMediaName(res.url),
      });
   } catch (e: any) {
      alert('Reels Download Failed!');
      console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
      return;
   }
}
