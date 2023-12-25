import { ReelsMedia } from './types';

chrome.runtime.onInstalled.addListener(async () => {
   const { setting_include_username, setting_include_post_time } = await chrome.storage.local.get([
      'setting_include_username',
      'setting_include_post_time',
   ]);
   if (setting_include_username === undefined) {
      chrome.storage.local.set({
         setting_include_username: true,
      });
   }
   if (setting_include_post_time === undefined) {
      chrome.storage.local.set({
         setting_include_post_time: true,
      });
   }
});

chrome.runtime.onMessage.addListener((message) => {
   console.log(message);
   const { type, data } = message;
   if (type === 'open_url') {
      chrome.tabs.create({ url: data });
   }
   return undefined;
});

// @ts-ignore
chrome.runtime.onMessageExternal.addListener(async (message) => {
   console.log(message);
   const { type, data } = message;
   let newArr;
   switch (type) {
      case 'highlights':
         const { highlights } = await chrome.storage.local.get(['highlights']);
         newArr = (highlights || []).filter((i: any) => !data.find((j: any) => j.id === i.id));
         chrome.storage.local.set({ highlights: [...newArr, ...data] });
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
      case 'user_profile_pic_url':
         const { user_profile_pic_url } = await chrome.storage.local.get(['user_profile_pic_url']);
         const newMap = new Map(user_profile_pic_url);
         newMap.set(data.username, data.url);
         chrome.storage.local.set({ user_profile_pic_url: Array.from(newMap) });
         break;
   }
});
