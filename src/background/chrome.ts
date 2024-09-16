import type { ReelsMedia } from '../types/global';

import { saveHighlights, saveReels, saveStories } from './fn';
import { CONFIG_LIST } from '../constants';

chrome.runtime.onInstalled.addListener(async () => {
   const result = await chrome.storage.sync.get(CONFIG_LIST);
   CONFIG_LIST.forEach((i) => {
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
   //  console.log(message);
   const { type, data } = message;
   if (type === 'open_url') {
      chrome.tabs.create({ url: data });
   }
   return false;
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
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
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

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
   // console.log(message, sender);

   const { type, data, api } = message;

   if (sender.origin === 'https://www.threads.net') {
      if (type === 'threads_searchResults') {
         data
            .split(/\s*for\s+\(;;\);\s*/)
            .filter((_: any) => _)
            .map(async (i: any) => {
               try {
                  const result = findValueByKey(JSON.parse(i), 'searchResults');
                  if (result && Array.isArray(result.edges)) {
                     await addThreads(result.edges.map((i: any) => i.node.thread.thread_items).flat());
                  }
               } catch {}
            });
      } else {
         addThreads(data);
      }
      return false;
   }

   (async () => {
      if (type === 'stories') {
         const { stories_user_ids } = await chrome.storage.local.get(['stories_user_ids']);
         const newMap = new Map(stories_user_ids);
         newMap.set(data.username, data.user_id);
         await chrome.storage.local.set({ stories_user_ids: Array.from(newMap) });
      } else {
         try {
            const jsonData = JSON.parse(data);

            switch (api) {
               case 'https://www.instagram.com/api/graphql':
                  saveStories(jsonData);
                  break;
               case 'https://www.instagram.com/graphql/query':
                  saveHighlights(jsonData);
                  saveReels(jsonData);
                  saveStories(jsonData);
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
         } catch {}
      }
      sendResponse();
   })();

   return true;
});
