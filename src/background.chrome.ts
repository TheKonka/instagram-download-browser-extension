import { ReelsMedia } from './types';

// @ts-ignore
chrome.runtime.onMessageExternal.addListener(async (message) => {
   const { type, data } = message;
   let newArr;
   switch (type) {
      case 'reels_media':
         const { reels, reels_media } = await chrome.storage.local.get(['reels', 'reels_media']);
         newArr = (reels_media || []).filter(
            (i: ReelsMedia.ReelsMedum) => !(data as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
         );
         chrome.storage.local.set({ reels: Object.assign({}, reels, data.reels), reels_media: [...newArr, ...data.reels_media] });
         break;
      case 'reels_edges':
         const { reels_edges } = await chrome.storage.local.get(['reels_edges']);
         newArr = (reels_edges || []).filter((i: any) => !data.find((j: any) => j.code === i.code));
         chrome.storage.local.set({ reels_edges: [...newArr, ...data] });
         break;
      case 'v1_feed_reels_media':
         const { v1_feed_reels_media } = await chrome.storage.local.get(['v1_feed_reels_media']);
         newArr = (v1_feed_reels_media || []).filter((i: any) => !data.find((j: any) => j.id === i.id));
         chrome.storage.local.set({ v1_feed_reels_media: [...newArr, ...data] });
         break;
      case 'stories_user_id':
         chrome.storage.local.set({ stories_user_id: data });
         break;
   }
});
