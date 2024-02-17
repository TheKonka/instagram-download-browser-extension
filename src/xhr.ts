const oldXHROpen = window.XMLHttpRequest.prototype.open;

const EXTENSION_ID = 'oejjpeobjicdpgaijialfpfcbdnanajk';

window.XMLHttpRequest.prototype.open = function (method, url) {
   if (method === 'GET' && typeof url === 'string') {
      if (url.startsWith('https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=')) {
         this.addEventListener('load', function () {
            try {
               const data = JSON.parse(this.responseText);
               chrome.runtime.sendMessage(EXTENSION_ID, { type: 'reels_media', data });
            } catch (error) {
               console.log(error);
            }
         });
      }

      const { pathname } = new URL(url);
      if (pathname.startsWith('/api/v1/feed/user/') && pathname.endsWith('/username/')) {
         this.addEventListener('load', function () {
            try {
               const data = JSON.parse(this.responseText);
               if (data.items[0]) {
                  const user = data.items[0].user;
                  const url = user.hd_profile_pic_url_info.url;
                  const username = user.username;
                  chrome.runtime.sendMessage(EXTENSION_ID, { type: 'user_profile_pic_url', data: { username, url } });
               }
            } catch (error) {
               console.log(error);
            }
         });
      }
   }

   if (method === 'POST') {
      switch (url) {
         case 'https://www.threads.net/ajax/route-definition/':
            this.addEventListener('load', function () {
               try {
                  this.responseText
                     .split(/\s*for\s+\(;;\);\s*/)
                     .filter((_) => _)
                     .map((i) =>
                        chrome.runtime.sendMessage(EXTENSION_ID, {
                           type: 'threads_searchResults',
                           data: JSON.parse(i),
                        })
                     );
               } catch (e) {}
            });
            break;
         case 'https://www.instagram.com/api/graphql':
         case 'https://www.threads.net/api/graphql':
         case '/api/graphql':
            this.addEventListener('load', function () {
               try {
                  const data = JSON.parse(this.responseText);
                  if (Array.isArray(data.data?.xdt_api__v1__feed__reels_media__connection?.edges)) {
                     const sqlData = data.data.xdt_api__v1__feed__reels_media__connection.edges.map((i: any) => i.node);
                     chrome.runtime.sendMessage(EXTENSION_ID, { type: 'highlights', data: sqlData });
                  }
                  if (Array.isArray(data.data?.xdt_api__v1__clips__home__connection_v2?.edges)) {
                     const sqlData = data.data.xdt_api__v1__clips__home__connection_v2.edges.map((i: any) => i.node.media);
                     chrome.runtime.sendMessage(EXTENSION_ID, { type: 'reels_edges', data: sqlData });
                  }
                  if (Array.isArray(data.data?.xdt_api__v1__feed__reels_media?.reels_media)) {
                     const sqlData = data.data.xdt_api__v1__feed__reels_media.reels_media;
                     chrome.runtime.sendMessage(EXTENSION_ID, { type: 'v1_feed_reels_media', data: sqlData });
                  }
                  if (data.data?.fetch__XDTUserDict?.id) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'stories_user_id',
                        data: data.data.fetch__XDTUserDict.id,
                     });
                  }

                  // Threads
                  if (Array.isArray(data.data?.feedData?.edges)) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: data.data.feedData.edges
                           .map((i: any) => i.node.text_post_app_thread?.thread_items || i.node.thread_items)
                           .flat(),
                     });
                  }
                  if (Array.isArray(data.data?.mediaData?.edges)) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: data.data.mediaData.edges.map((i: any) => i.node.thread_items).flat(),
                     });
                  }
                  if (Array.isArray(data.data?.data?.edges)) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: data.data.data.edges.map((i: any) => i.node.thread_items).flat(),
                     });
                  }
                  if (typeof data.data?.replyPost === 'object') {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: [data.data.replyPost],
                     });
                  }
                  if (Array.isArray(data.data?.searchResults?.edges)) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: data.data.searchResults.edges.map((i: any) => i.node.thread.thread_items).flat(),
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
