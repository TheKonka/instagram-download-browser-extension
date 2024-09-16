import { CONFIG_LIST } from '../constants';
import type { ReelsMedia } from '../types/global';

import { saveHighlights, saveReels, saveStories } from './fn';

browser.runtime.onInstalled.addListener(async () => {
   const result = await chrome.storage.sync.get(CONFIG_LIST);
   CONFIG_LIST.forEach((i) => {
      if (result[i] === undefined) {
         browser.storage.sync.set({
            [i]: true,
         });
      }
   });
});

browser.runtime.onStartup.addListener(() => {
   browser.storage.local.set({ stories_user_ids: [] });
});

async function listenInstagram(details: browser.webRequest._OnBeforeRequestDetails, jsonData: Record<string, any>) {
   switch (details.url) {
      case 'https://www.instagram.com/api/graphql':
         saveStories(jsonData);
         break;
      case 'https://www.instagram.com/graphql/query':
         saveHighlights(jsonData);
         saveReels(jsonData);
         saveStories(jsonData);
         break;
      default:
         if (details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
            const { reels, reels_media } = await browser.storage.local.get(['reels', 'reels_media']);
            const newArr = (reels_media || []).filter(
               (i: ReelsMedia.ReelsMedum) => !(jsonData as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
            );
            await browser.storage.local.set({
               reels: Object.assign({}, reels, jsonData.reels),
               reels_media: [...newArr, ...jsonData.reels_media],
            });
         }
         break;
   }
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

async function listenThreads(details: browser.webRequest._OnBeforeRequestDetails, jsonData: Record<string, any>) {
   async function addThreads(data: any[]) {
      const { threads } = await browser.storage.local.get(['threads']);
      const newMap = new Map(threads);
      for (const item of data) {
         const code = item?.post?.code;
         if (code) {
            newMap.set(code, item);
         }
      }
      await browser.storage.local.set({ threads: Array.from(newMap) });
   }
   if (details.url === 'https://www.threads.net/api/graphql') {
      if (Array.isArray(jsonData.data?.feedData?.edges)) {
         const data = jsonData.data.feedData.edges
            .map((i: any) => i.node?.text_post_app_thread?.thread_items || i.node?.thread_items || i.text_post_app_thread?.thread_items)
            .flat();
         await addThreads(data);
      }
      if (Array.isArray(jsonData.data?.mediaData?.edges)) {
         const data = jsonData.data.mediaData.edges.map((i: any) => i.node.thread_items).flat();
         await addThreads(data);
      }
      if (Array.isArray(jsonData.data?.data?.edges)) {
         const data = jsonData.data.data.edges.map((i: any) => i.node.thread_items).flat();
         await addThreads(data);
      }
      if (typeof jsonData.data?.replyPost === 'object') {
         await addThreads([jsonData.data.replyPost]);
      }
      if (Array.isArray(jsonData.data?.searchResults?.edges)) {
         const data = jsonData.data.searchResults.edges.map((i: any) => i.node.thread.thread_items).flat();
         await addThreads(data);
      }
   }

   if (details.url === 'https://www.threads.net/ajax/route-definition/') {
      const result = findValueByKey(jsonData, 'searchResults');
      if (result && Array.isArray(result.edges)) {
         await addThreads(result.edges.map((i: any) => i.node.thread.thread_items).flat());
      }
   }
}

function listener(details: browser.webRequest._OnBeforeRequestDetails) {
   const filter = browser.webRequest.filterResponseData(details.requestId);
   const decoder = new TextDecoder('utf-8');
   const encoder = new TextEncoder();

   const data: any[] = [];
   filter.ondata = (event: { data: ArrayBuffer }) => {
      data.push(event.data);
   };

   filter.onstop = async () => {
      let str = '';
      if (data.length === 1) {
         str = decoder.decode(data[0]);
      } else {
         for (let i = 0; i < data.length; i++) {
            const stream = i !== data.length - 1;
            str += decoder.decode(data[i], { stream });
         }
      }

      // !use try catch to avoid error that may cause page not working
      try {
         const jsonData = JSON.parse(str);
         listenInstagram(details, jsonData);
         listenThreads(details, jsonData);
      } catch {
         try {
            // record opened stories by user_id and username
            // routePath	"/stories/{username}/{?initial_media_id}/"
            if (details.url === 'https://www.instagram.com/ajax/bulk-route-definitions/') {
               const {
                  payload: { payloads },
               } = JSON.parse(str.split(/\s*for\s+\(;;\);\s*/)[1]);
               const { stories_user_ids } = await browser.storage.local.get(['stories_user_ids']);
               const newMap = new Map(stories_user_ids);
               for (const [key, value] of Object.entries(payloads)) {
                  if (key.startsWith('/stories/')) {
                     // @ts-ignore
                     const { rootView } = value.result.exports;
                     newMap.set(key.split('/')[2], rootView.props.user_id);
                  }
               }
               browser.storage.local.set({ stories_user_ids: Array.from(newMap) });
            }
            if (details.url === 'https://www.threads.net/ajax/route-definition/' && str.includes('searchResults')) {
               str.split(/\s*for\s+\(;;\);\s*/)
                  .filter((_) => _)
                  .map((i) => listenThreads(details, JSON.parse(i)));
            }
         } catch {}
      }

      filter.write(encoder.encode(str));
      filter.close();
   };
}

browser.webRequest.onBeforeRequest.addListener(
   (details) => {
      try {
         const { method, url } = details;
         const { pathname } = new URL(url);

         if (method === 'GET' && pathname.startsWith('/api/v1/feed/user/') && pathname.endsWith('/username/')) {
            listener(details); // get user hd_profile_pic_url_info
         }
         if (method === 'GET' && url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
            listener(details); // presentation stories in home page top
         }
         if (method === 'POST' && url === 'https://www.instagram.com/api/graphql') {
            listener(details);
         }
         if (method === 'POST' && url === 'https://www.instagram.com/graphql/query') {
            listener(details); // save highlights data and reels data
         }
         if (method === 'POST' && url === 'https://www.instagram.com/ajax/bulk-route-definitions/') {
            listener(details);
         }

         // threads
         if (method === 'POST' && url === 'https://www.threads.net/api/graphql') {
            listener(details);
         }
         if (method === 'POST' && url === 'https://www.threads.net/ajax/route-definition/') {
            listener(details);
         }
      } catch {}
   },
   { urls: ['https://www.instagram.com/*', 'https://www.threads.net/*'] },
   ['blocking']
);

browser.runtime.onInstalled.addListener(async () => {
   if (
      !(await browser.permissions.contains({
         origins: ['https://www.instagram.com/*', 'https://www.threads.net/*'],
      }))
   ) {
      await browser.runtime.openOptionsPage();
   }
});

browser.runtime.onMessage.addListener((message) => {
   console.log(message);
   const { type, data } = message;
   if (type === 'open_url') {
      browser.tabs.create({ url: data });
   }
});
