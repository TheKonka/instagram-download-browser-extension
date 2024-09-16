import { EXTENSION_ID } from './constants';

const oldXHROpen = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function (method, url) {
   if (method === 'GET' && typeof url === 'string') {
      if (url.includes('/api/v1/feed/reels_media/?reel_ids=')) {
         this.addEventListener('load', function () {
            chrome.runtime.sendMessage(EXTENSION_ID, { data: this.responseText, api: '/api/v1/feed/reels_media/?reel_ids=' });
         });
      }
   }

   if (method === 'POST') {
      switch (url) {
         case '/ajax/bulk-route-definitions/':
         case 'https://www.instagram.com/ajax/bulk-route-definitions/':
            this.addEventListener('load', async function () {
               try {
                  const {
                     payload: { payloads },
                  } = JSON.parse(this.responseText.split(/\s*for\s+\(;;\);\s*/)[1]);
                  for (const [key, value] of Object.entries(payloads)) {
                     if (key.startsWith('/stories/')) {
                        await chrome.runtime.sendMessage(EXTENSION_ID, {
                           type: 'stories',
                           data: {
                              username: key.split('/')[2],
                              // @ts-expect-error value is unknown
                              user_id: value.result.exports.rootView.props.user_id,
                           },
                        });
                     }
                  }
               } catch {}
            });
            break;
         case '/ajax/route-definition/':
         case 'https://www.threads.net/ajax/route-definition/':
            this.addEventListener('load', function () {
               chrome.runtime.sendMessage(EXTENSION_ID, {
                  type: 'threads_searchResults',
                  data: this.responseText,
               });
            });
            break;
         case '/graphql/query':
         case 'https://www.instagram.com/graphql/query':
            this.addEventListener('load', function () {
               chrome.runtime.sendMessage(EXTENSION_ID, { api: 'https://www.instagram.com/graphql/query', data: this.responseText });
            });
            break;
         case 'https://www.instagram.com/api/graphql':
         case 'https://www.threads.net/api/graphql':
         case '/api/graphql':
            this.addEventListener('load', function () {
               chrome.runtime.sendMessage(EXTENSION_ID, { api: 'https://www.instagram.com/api/graphql', data: this.responseText });
               try {
                  const data = JSON.parse(this.responseText);

                  // Threads
                  if (Array.isArray(data.data?.feedData?.edges)) {
                     chrome.runtime.sendMessage(EXTENSION_ID, {
                        type: 'threads',
                        data: data.data.feedData.edges
                           .map(
                              (i: any) =>
                                 i.node?.text_post_app_thread?.thread_items || i.node?.thread_items || i.text_post_app_thread?.thread_items
                           )
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
