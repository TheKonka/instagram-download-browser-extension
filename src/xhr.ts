const oldXHROpen = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function (method, url) {
   if (method === 'GET' && typeof url === 'string' && url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
      this.addEventListener('load', function () {
         try {
            const data = JSON.parse(this.responseText);
            chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', { type: 'reels_media', data });
         } catch (error) {
            console.log(error);
         }
      });
   }

   if (method === 'POST') {
      switch (url) {
         case 'https://www.instagram.com/api/graphql':
         case '/api/graphql':
            this.addEventListener('load', function () {
               try {
                  const data = JSON.parse(this.responseText);
                  if (Array.isArray(data.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
                     const sqlData = data.data.xdt_api__v1__clips__home__connection_v2.edges.map((i: any) => i.node.media);
                     chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', { type: 'reels_edges', data: sqlData });
                  }
                  if (Array.isArray(data.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
                     const sqlData = data.data.xdt_api__v1__feed__reels_media.reels_media;
                     chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', { type: 'v1_feed_reels_media', data: sqlData });
                  }
                  if (data.data?.fetch__XDTUserDict?.id) {
                     chrome.runtime.sendMessage('oejjpeobjicdpgaijialfpfcbdnanajk', {
                        type: 'stories_user_id',
                        data: data.data.fetch__XDTUserDict.id,
                     });
                  }
               } catch (error) {
                  console.log(error);
               }
            });
            break;
         default:
            break;
      }
   }

   return oldXHROpen.apply(this, [].slice.call(arguments) as any);
};