import type { Reels } from './types/reels';
import type { ReelsMedia } from './types/types';
import type { Highlight } from './types/highlights';
import type { Stories } from './types/stories';

chrome.runtime.onInstalled.addListener(async () => {
   const configList = ['setting_include_username', 'setting_include_post_time', 'setting_show_open_in_new_tab_icon'];
   const result = await chrome.storage.sync.get(configList);
   configList.forEach((i) => {
      if (result[i] === undefined) {
         chrome.storage.sync.set({
            [i]: true,
         });
      }
   });
});

chrome.runtime.onStartup.addListener(() => {
   chrome.storage.local.set({ stories_user_ids: [] });
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

   const { type, data, api } = message;

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

   try {
      const jsonData = JSON.parse(data);
      switch (api) {
         case 'https://www.instagram.com/graphql/query':
            // highlights data
            if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media__connection?.edges)) {
               const data = (jsonData as Highlight.Root).data.xdt_api__v1__feed__reels_media__connection.edges.map((i) => i.node);
               const { highlights_data } = await chrome.storage.local.get(['highlights_data']);
               const newMap = new Map(highlights_data);
               data.forEach((i) => newMap.set(i.id, i));
               await chrome.storage.local.set({ highlights_data: [...newMap] });
            }
            // reels data
            if (Array.isArray(jsonData.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
               const data = (jsonData as Reels.Root).data.xdt_api__v1__clips__home__connection_v2.edges.map((i) => i.node.media);
               const { reels_edges_data } = await chrome.storage.local.get(['reels_edges_data']);
               const newMap = new Map(reels_edges_data);
               data.forEach((i) => newMap.set(i.code, i));
               await chrome.storage.local.set({ reels_edges_data: [...newMap] });
            }
            // save stories data
            if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
               const data = (jsonData as Stories.Root).data.xdt_api__v1__feed__reels_media.reels_media;
               const { stories_reels_media } = await chrome.storage.local.get(['stories_reels_media']);
               const newMap = new Map(stories_reels_media);
               data.forEach((i) => newMap.set(i.id, i));
               await chrome.storage.local.set({ stories_reels_media: [...newMap] });
            }
            break;
         // presentation stories in home page top
         case '/api/v1/feed/reels_media/?reel_ids=':
            const { reels, reels_media } = await chrome.storage.local.get(['reels', 'reels_media']);
            const newArr = (reels_media || []).filter(
               (i: ReelsMedia.ReelsMedum) => !(jsonData as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
            );
            chrome.storage.local.set({
               reels: Object.assign({}, reels, data.reels),
               reels_media: [...newArr, ...jsonData.reels_media],
            });
            break;
      }
   } catch (e) {
      console.warn(e);
   }

   let newArr, newMap: any;
   switch (type) {
      case 'stories_user_id':
         chrome.storage.local.set({ stories_user_id: data });
         break;
      case 'user_profile_pic_url':
         const { user_profile_pic_url } = await chrome.storage.local.get(['user_profile_pic_url']);
         newMap = new Map(user_profile_pic_url);
         newMap.set(data.username, data.url);
         chrome.storage.local.set({ user_profile_pic_url: Array.from(newMap) });
         break;
      case 'stories':
         const { stories_user_ids } = await chrome.storage.local.get(['stories_user_ids']);
         newMap = new Map(stories_user_ids);
         newMap.set(data.username, data.user_id);
         chrome.storage.local.set({ stories_user_ids: Array.from(newMap) });
         break;
   }
});
