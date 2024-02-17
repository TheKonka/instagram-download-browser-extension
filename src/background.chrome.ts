import { ReelsMedia } from './types';

chrome.runtime.onInstalled.addListener(async () => {
   const { setting_include_username, setting_include_post_time, setting_show_open_in_new_tab_icon } = await chrome.storage.local.get([
      'setting_include_username',
      'setting_include_post_time',
      'setting_show_open_in_new_tab_icon',
   ]);
   if (setting_include_username === undefined) {
      await chrome.storage.local.set({
         setting_include_username: true,
      });
   }
   if (setting_include_post_time === undefined) {
      await chrome.storage.local.set({
         setting_include_post_time: true,
      });
   }
   if (setting_show_open_in_new_tab_icon === undefined) {
      await chrome.storage.local.set({
         setting_show_open_in_new_tab_icon: true,
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

async function addThreads(data: any[]) {
   const { threads } = await chrome.storage.local.get(['threads']);
   const newMap = new Map(threads);
   for (const item of data) {
      const code = item?.post?.code;
      if (code) {
         newMap.set(code, item);
      }
   }
   await chrome.storage.local.set({ threads: Array.from(newMap) });
}

function findValueByKey(obj: Record<string, any>, key: string): any {
   for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
         if (property === key) {
            return obj[property];
         } else if (typeof obj[property] === 'object') {
            const result = findValueByKey(obj[property], key);
            if (result !== undefined) {
               return result;
            }
         }
      }
   }
}

// @ts-ignore
chrome.runtime.onMessageExternal.addListener(async (message, sender) => {
   console.log(message, sender);
   const { type, data } = message;

   if (sender.origin === 'https://www.threads.net') {
      if (type === 'threads_searchResults') {
         const result = findValueByKey(data, 'searchResults');
         if (result && Array.isArray(result.edges)) {
            await addThreads(result.edges.map((i: any) => i.node.thread.thread_items).flat());
         }
      } else {
         await addThreads(data);
      }

      return;
   }

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
