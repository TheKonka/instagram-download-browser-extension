import { ReelsMedia } from './types';

browser.runtime.onInstalled.addListener(async () => {
   const { setting_include_username, setting_include_post_time } = await browser.storage.local.get([
      'setting_include_username',
      'setting_include_post_time',
   ]);
   if (setting_include_username === undefined) {
      browser.storage.local.set({
         setting_include_username: true,
      });
   }
   if (setting_include_post_time === undefined) {
      browser.storage.local.set({
         setting_include_post_time: true,
      });
   }
});

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

      const jsonData = JSON.parse(str);

      if (details.url.startsWith('https://www.instagram.com/api/v1/feed/user/')) {
         const user = jsonData.items[0].user;
         const url = user.hd_profile_pic_url_info.url;
         const username = user.username;
         const { user_profile_pic_url } = await browser.storage.local.get(['user_profile_pic_url']);
         const newMap = new Map(user_profile_pic_url);
         newMap.set(username, url);
         browser.storage.local.set({ user_profile_pic_url: Array.from(newMap) });
      } else if (details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
         const { reels, reels_media } = await browser.storage.local.get(['reels', 'reels_media']);
         const newArr = (reels_media || []).filter(
            (i: ReelsMedia.ReelsMedum) => !(jsonData as ReelsMedia.Root).reels_media.find((j) => j.id === i.id)
         );
         browser.storage.local.set({ reels: Object.assign({}, reels, jsonData.reels), reels_media: [...newArr, ...jsonData.reels_media] });
      } else if (details.url === 'https://www.instagram.com/api/graphql') {
         if (Array.isArray(jsonData.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
            const sqlData = jsonData.data.xdt_api__v1__clips__home__connection_v2.edges.map((i: any) => i.node.media);
            const { reels_edges } = await browser.storage.local.get(['reels_edges']);
            const newArr = (reels_edges || []).filter((i: any) => !sqlData.find((j: any) => j.code === i.code));
            browser.storage.local.set({ reels_edges: [...newArr, ...sqlData] });
         }
         if (Array.isArray(jsonData.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
            const sqlData = jsonData.data.xdt_api__v1__feed__reels_media.reels_media;
            const { v1_feed_reels_media } = await browser.storage.local.get(['v1_feed_reels_media']);
            const newArr = (v1_feed_reels_media || []).filter((i: any) => !sqlData.find((j: any) => j.id === i.id));
            browser.storage.local.set({ v1_feed_reels_media: [...newArr, ...sqlData] });
         }
         if (jsonData.data?.fetch__XDTUserDict?.id) {
            browser.storage.local.set({ stories_user_id: jsonData.data.fetch__XDTUserDict.id });
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
   },
   { urls: ['https://www.instagram.com/*'] },
   ['blocking']
);

browser.runtime.onInstalled.addListener(async () => {
   if (
      !(await browser.permissions.contains({
         origins: ['https://www.instagram.com/*'],
      }))
   ) {
      browser.runtime.openOptionsPage();
   }
});
