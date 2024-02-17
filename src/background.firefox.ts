import { ReelsMedia } from './types';

browser.runtime.onInstalled.addListener(async () => {
   const { setting_include_username, setting_include_post_time, setting_show_open_in_new_tab_icon } = await browser.storage.local.get([
      'setting_include_username',
      'setting_include_post_time',
   ]);
   if (setting_include_username === undefined) {
      await browser.storage.local.set({
         setting_include_username: true,
      });
   }
   if (setting_include_post_time === undefined) {
      await browser.storage.local.set({
         setting_include_post_time: true,
      });
   }
   if (setting_show_open_in_new_tab_icon === undefined) {
      await browser.storage.local.set({
         setting_show_open_in_new_tab_icon: true,
      });
   }
});

async function listenInstagram(details: browser.webRequest._OnBeforeRequestDetails, jsonData: Record<string, any>) {
   if (details.url.startsWith('https://www.instagram.com/api/v1/feed/user/')) {
      if (jsonData.items[0]) {
         const user = jsonData.items[0].user;
         const url = user.hd_profile_pic_url_info.url;
         const username = user.username;
         const { user_profile_pic_url } = await browser.storage.local.get(['user_profile_pic_url']);
         const newMap = new Map(user_profile_pic_url);
         newMap.set(username, url);
         await browser.storage.local.set({ user_profile_pic_url: Array.from(newMap) });
      }
   } else if (details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
      const { reels, reels_media } = await browser.storage.local.get(['reels', 'reels_media']);
      const newArr = (reels_media || []).filter(
         (i: ReelsMedia.ReelsMedum) => !(jsonData as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
      );
      await browser.storage.local.set({
         reels: Object.assign({}, reels, jsonData.reels),
         reels_media: [...newArr, ...jsonData.reels_media],
      });
   } else if (details.url === 'https://www.instagram.com/api/graphql') {
      if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media__connection?.edges)) {
         const sqlData = jsonData.data.xdt_api__v1__feed__reels_media__connection.edges.map((i: any) => i.node);
         const { highlights } = await browser.storage.local.get(['highlights']);
         const newArr = (highlights || []).filter((i: any) => !sqlData.find((j: any) => j.id === i.id));
         await browser.storage.local.set({ highlights: [...newArr, ...sqlData] });
      }
      if (Array.isArray(jsonData.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
         const sqlData = jsonData.data.xdt_api__v1__clips__home__connection_v2.edges.map((i: any) => i.node.media);
         const { reels_edges } = await browser.storage.local.get(['reels_edges']);
         const newArr = (reels_edges || []).filter((i: any) => !sqlData.find((j: any) => j.code === i.code));
         await browser.storage.local.set({ reels_edges: [...newArr, ...sqlData] });
      }
      if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
         const sqlData = jsonData.data.xdt_api__v1__feed__reels_media.reels_media;
         const { v1_feed_reels_media } = await browser.storage.local.get(['v1_feed_reels_media']);
         const newArr = (v1_feed_reels_media || []).filter((i: any) => !sqlData.find((j: any) => j.id === i.id));
         await browser.storage.local.set({ v1_feed_reels_media: [...newArr, ...sqlData] });
      }
      if (jsonData.data?.fetch__XDTUserDict?.id) {
         await browser.storage.local.set({ stories_user_id: jsonData.data.fetch__XDTUserDict.id });
      }
   }
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
         const data = jsonData.data.feedData.edges.map((i: any) => i.node.text_post_app_thread?.thread_items || i.node.thread_items).flat();
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
      } catch (e) {
         if (details.url === 'https://www.threads.net/ajax/route-definition/' && str.includes('searchResults')) {
            try {
               str.split(/\s*for\s+\(;;\);\s*/)
                  .filter((_) => _)
                  .map((i) => listenThreads(details, JSON.parse(i)));
            } catch (e) {}
         }
      }

      filter.write(encoder.encode(str));
      filter.close();
   };
}

browser.webRequest.onBeforeRequest.addListener(
   (details) => {
      const { method, url } = details;
      const { pathname } = new URL(url);

      // get user hd_profile_pic_url_info
      if (method === 'GET' && pathname.startsWith('/api/v1/feed/user/') && pathname.endsWith('/username/')) {
         listener(details);
      }
      if (method === 'GET' && url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
         listener(details);
      }
      if (method === 'POST' && url === 'https://www.instagram.com/api/graphql') {
         listener(details);
      }

      // threads
      if (method === 'POST' && url === 'https://www.threads.net/api/graphql') {
         listener(details);
      }
      if (method === 'POST' && url === 'https://www.threads.net/ajax/route-definition/') {
         listener(details);
      }
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
