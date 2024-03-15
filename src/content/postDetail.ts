import dayjs from 'dayjs';
import { checkType, downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';

async function fetchVideoURL(containerNode: HTMLElement, videoElem: HTMLVideoElement) {
   const poster = videoElem.getAttribute('poster');
   const timeNodes = containerNode.querySelectorAll('time');
   const posterUrl = (timeNodes[timeNodes.length - 1].parentNode!.parentNode as any).href;
   const posterPattern = /\/([^\/?]*)\?/;
   const posterMatch = poster?.match(posterPattern);
   const postFileName = posterMatch?.[1];
   const resp = await fetch(posterUrl);
   const content = await resp.text();
   const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
   const match = content.match(pattern);
   let videoUrl = JSON.parse(match?.[1] ?? '');
   videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g, 'https://scontent.cdninstagram.com');
   videoElem.setAttribute('videoURL', videoUrl);
   return videoUrl;
}

const getVideoSrc = async (containerNode: HTMLElement, videoElem: HTMLVideoElement) => {
   let url = videoElem.getAttribute('src');
   if (videoElem.hasAttribute('videoURL')) {
      url = videoElem.getAttribute('videoURL');
   } else if (url === null || url.includes('blob')) {
      url = await fetchVideoURL(containerNode, videoElem);
   }
   return url;
};

async function getUrl() {
   const containerNode = document.querySelector<HTMLElement>('section main');
   if (!containerNode) return;

   const pathnameList = window.location.pathname.split('/').filter((e) => e);
   const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p';

   const mediaList = containerNode.querySelectorAll('li[style][class]');

   let url, res;
   if (mediaList.length === 0) {
      // single img or video
      res = await getUrlFromInfoApi(containerNode);
      url = res?.url;
      if (!url) {
         const videoElem: HTMLVideoElement | null = containerNode.querySelector('article  div > video');
         const imgElem = containerNode.querySelector('article  div[role] div > img');
         if (videoElem) {
            // media type is video
            if (videoElem) {
               url = await getVideoSrc(containerNode, videoElem);
            }
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         } else {
            console.log('Err: not find media at handle post single');
         }
      }
   } else {
      // multiple media
      let dotsList;
      if (checkType() === 'pc') {
         dotsList = isPostDetailWithNameInUrl
            ? containerNode.querySelectorAll('article>div>div:nth-child(1)>div>div:nth-child(2)>div')
            : containerNode.querySelectorAll('div[role=button]>div>div>div>div:nth-child(2)>div');
      } else {
         dotsList = containerNode.querySelectorAll(`:scope > div > div > div:nth-child(2) > div>div>div>div>div:nth-of-type(2)>div`);
      }
      const mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
      res = await getUrlFromInfoApi(containerNode, mediaIndex);
      url = res?.url;
      if (!url) {
         const listElements = [
            ...containerNode.querySelectorAll(`:scope > div > div:nth-child(1) > div > div:nth-child(1) ul li[style*="translateX"]`),
         ] as HTMLLIElement[];
         const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
         const positionsMap = listElements.reduce<Record<string, HTMLLIElement>>((result, element) => {
            const position = Math.round(Number(element.style.transform.match(/-?(\d+)/)?.[1]) / listElementWidth);
            return { ...result, [position]: element };
         }, {});

         const node = positionsMap[mediaIndex];
         const videoElem = node.querySelector('video');
         const imgElem = node.querySelector('img');
         if (videoElem) {
            // media type is video
            url = await getVideoSrc(containerNode, videoElem);
         } else if (imgElem) {
            // media type is image
            url = imgElem.getAttribute('src');
         }
      }
   }
   return { url, res };
}

export async function postDetailOnClicked(target: HTMLAnchorElement) {
   try {
      const data = await getUrl();
      if (!data?.url) throw new Error('Cannot get url');

      const { url, res } = data;
      console.log('url', url);
      if (target.className.includes('download-btn')) {
         let postTime, posterName;
         if (res) {
            posterName = res.owner;
            postTime = res.taken_at * 1000;
         } else {
            postTime = document.querySelector('time')?.getAttribute('datetime');
            const name = document.querySelector<HTMLDivElement>(
               'section main>div>div>div>div:nth-child(2)>div>div>div>div:nth-child(2)>div>div>div'
            );
            if (name) {
               posterName = name.innerText || posterName;
            }
         }
         downloadResource(url, posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url));
      } else {
         openInNewTab(url);
      }
   } catch (e: any) {
      alert('Posts Download Failed!');
      console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
   }
}
