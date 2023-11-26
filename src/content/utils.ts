export function openInNewTab(url: string) {
   window.open(url);
}

function forceDownload(blob: any, filename: any, extension: any) {
   // ref: https://stackoverflow.com/questions/49474775/chrome-65-blocks-cross-origin-a-download-client-side-workaround-to-force-down
   var a = document.createElement('a');
   a.download = filename + '.' + extension;
   a.href = blob;
   // For Firefox https://stackoverflow.com/a/32226068
   document.body.appendChild(a);
   a.click();
   a.remove();
}

// Current blob size limit is around 500MB for browsers
export function downloadResource(url: string, filename?: string) {
   if (url.startsWith('blob:')) {
      forceDownload(url, filename, 'mp4');
      return;
   }
   console.log(`Dowloading ${url}`);
   // ref: https://stackoverflow.com/questions/49474775/chrome-65-blocks-cross-origin-a-download-client-side-workaround-to-force-down
   if (!filename) {
      filename = url.split('\\').pop()!.split('/').pop()!;
   }
   fetch(url, {
      headers: new Headers({
         Origin: location.origin,
      }),
      mode: 'cors',
   })
      .then((response) => response.blob())
      .then((blob) => {
         const extension = blob.type.split('/').pop();
         const blobUrl = window.URL.createObjectURL(blob);
         forceDownload(blobUrl, filename, extension);
      })
      .catch((e) => console.error(e));
}

const mediaInfoCache: Map<string, any> = new Map(); // key: media id, value: info json
const mediaIdCache: Map<string, string> = new Map(); // key: post id, value: media id

const findAppId = () => {
   const appIdPattern = /"X-IG-App-ID":"([\d]+)"/;
   const bodyScripts: NodeListOf<HTMLScriptElement> = document.querySelectorAll('body > script');
   for (let i = 0; i < bodyScripts.length; ++i) {
      const match = bodyScripts[i].text.match(appIdPattern);
      if (match) return match[1];
   }
   console.log('Cannot find app id');
   return null;
};

function findPostId(articleNode: HTMLElement) {
   const pathname = window.location.pathname;
   if (pathname.startsWith('/reels/')) {
      return pathname.split('/')[2];
   } else if (pathname.startsWith('/stories/')) {
      return pathname.split('/')[3];
   } else if (pathname.startsWith('/reel/')) {
      return pathname.split('/')[2];
   }
   const postIdPattern = /^\/p\/([^/]+)\//;
   const aNodes = articleNode.querySelectorAll('a');
   for (let i = 0; i < aNodes.length; ++i) {
      const link = aNodes[i].getAttribute('href');
      if (link) {
         const match = link.match(postIdPattern);
         if (match) return match[1];
      }
   }
   return null;
}

const findMediaId = async (postId: string) => {
   const mediaIdPattern = /instagram:\/\/media\?id=(\d+)|["' ]media_id["' ]:["' ](\d+)["' ]/;
   const match = window.location.href.match(/www.instagram.com\/stories\/[^\/]+\/(\d+)/);
   if (match) return match[1];
   if (!mediaIdCache.has(postId)) {
      const postUrl = `https://www.instagram.com/p/${postId}/`;
      const resp = await fetch(postUrl);
      const text = await resp.text();
      const idMatch = text.match(mediaIdPattern);
      if (!idMatch) return null;
      let mediaId = null;
      for (let i = 0; i < idMatch.length; ++i) {
         if (idMatch[i]) mediaId = idMatch[i];
      }
      if (!mediaId) return null;
      mediaIdCache.set(postId, mediaId);
   }
   return mediaIdCache.get(postId);
};

const getImgOrVedioUrl = (item: Record<string, any>) => {
   if ('video_versions' in item) {
      return item.video_versions[0].url;
   } else {
      return item.image_versions2.candidates[0].url;
   }
};

export const getUrlFromInfoApi = async (articleNode: HTMLElement, mediaIdx = 0): Promise<string | null> => {
   try {
      const appId = findAppId();
      if (!appId) {
         console.log('Cannot find appid');
         return null;
      }
      const postId = findPostId(articleNode);
      if (!postId) {
         console.log('Cannot find post id');
         return null;
      }
      const mediaId = await findMediaId(postId);
      if (!mediaId) {
         console.log('Cannot find media id');
         return null;
      }
      if (!mediaInfoCache.has(mediaId)) {
         const url = 'https://i.instagram.com/api/v1/media/' + mediaId + '/info/';
         const resp = await fetch(url, {
            method: 'GET',
            headers: {
               Accept: '*/*',
               'X-IG-App-ID': appId,
            },
            credentials: 'include',
            mode: 'cors',
         });

         if (resp.status !== 200) {
            console.log(`Fetch info API failed with status code: ${resp.status}`);
            return null;
         }
         const respJson = await resp.json();
         mediaInfoCache.set(mediaId, respJson);
      }
      const infoJson = mediaInfoCache.get(mediaId);
      if ('carousel_media' in infoJson.items[0]) {
         // multi-media post
         return getImgOrVedioUrl(infoJson.items[0].carousel_media[mediaIdx]);
      } else {
         // single media post
         return getImgOrVedioUrl(infoJson.items[0]);
      }
   } catch (e: any) {
      console.log(`Uncatched in getUrlFromInfoApi(): ${e}\n${e.stack}`);
      return null;
   }
};

export function getMediaName(url: string) {
   let mediaName = url.split('?')[0].split('\\').pop()!.split('/').pop();
   mediaName = mediaName!.substring(0, mediaName!.lastIndexOf('.'));
   return mediaName;
}

function adjustVideoButton(btns: NodeListOf<Element>) {
   btns.forEach((i) => {
      const btn = i.parentNode?.parentNode?.parentNode?.parentNode;
      if (btn instanceof HTMLElement) {
         btn.style.zIndex = '999';
         btn.style.bottom = '3rem';
      }
   });
}

export function handleVideo() {
   const videos = document.querySelectorAll('video');
   for (let i = 0; i < videos.length; i++) {
      videos[i].style.zIndex = '1';
      videos[i].style.position = 'relative';
      videos[i].controls = true;
      const btns = videos[i].parentNode?.querySelectorAll('button svg path');
      btns && adjustVideoButton(btns);
   }
}
