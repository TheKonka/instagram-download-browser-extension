import { ReelsMedia } from './types';

// @ts-ignore
chrome.runtime.onMessageExternal.addListener(async (message) => {
   const { type, data } = message;
   if (type === 'reels_media') {
      const { reels, reels_media } = await chrome.storage.local.get(['reels', 'reels_media']);
      const newArr = (reels_media || []).filter(
         (i: ReelsMedia.ReelsMedum) => !(data as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
      );
      chrome.storage.local.set({ reels: Object.assign({}, reels, data.reels), reels_media: [...newArr, ...data.reels_media] });
   } else if (type === 'reels') {
      const { reels_edges } = await chrome.storage.local.get(['reels_edges']);
      const newArr = (reels_edges || []).filter((i: any) => !data.find((j: any) => j.code === i.code));
      chrome.storage.local.set({ reels_edges: [...newArr, ...data] });
   }
});
