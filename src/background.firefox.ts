import { ReelsMedia } from './types';

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

      if (details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
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
      }

      filter.write(encoder.encode(str));
      filter.close();
   };
}

browser.webRequest.onBeforeRequest.addListener(
   (details) => {
      if (details.method === 'GET' && details.url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
         listener(details);
      }
      if (details.method === 'POST' && details.url === 'https://www.instagram.com/api/graphql') {
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
      browser.tabs.create({
         url: 'options.html',
      });
   }
});
