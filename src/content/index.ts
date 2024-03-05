import { addCustomBtn } from './button';
import { handleThreads } from './threads';
import { checkType, handleVideo } from './utils';

setInterval(() => {
   if (window.location.origin === 'https://www.threads.net') {
      handleThreads();
      return;
   }
   if (window.location.origin !== 'https://www.instagram.com') return;

   const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
   const pathname = window.location.pathname;
   const pathnameList = pathname.split('/').filter((e) => e);

   const isFeedPage = pathnameList.length === 2 && pathnameList[1] === 'feed';
   const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p'; // https://www.instagram.com/frankinjection/p/CwAb4TEoRE_/?img_index=1
   const isReelDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'reel'; // https://www.instagram.com/philsnelgrove/reel/B5GeRJoBAc1/

   // home page and feed page
   if (pathname === '/' || isFeedPage) {
      handleVideo();

      const articleList = document.querySelectorAll('article');
      for (let i = 0; i < articleList.length; i++) {
         articleList[i].querySelectorAll<HTMLImageElement>(':scope img').forEach((img) => {
            img.style.zIndex = '999';
         });
         articleList[i].querySelectorAll<HTMLDivElement>(':scope ul>li>div>div>div>div').forEach((i) => (i.style.zIndex = '999'));

         // use like btn to position, because like btn is always exist
         const likeBtn = articleList[i].querySelector(
            'path[d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"]'
         );
         if (likeBtn && articleList[i].getElementsByClassName('custom-btn').length === 0) {
            addCustomBtn(likeBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
         }
      }
   }

   // post
   if (pathname.startsWith('/p/') || isPostDetailWithNameInUrl || isReelDetailWithNameInUrl) {
      handleVideo();
      const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
      const tagNode = document.querySelector(
         'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
      );
      if (tagNode) {
         const emptyNode =
            tagNode.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.querySelector<HTMLDivElement>(
               ':scope>div>div:nth-child(2)'
            );
         if (emptyNode) {
            emptyNode.style.zIndex = '-1';
         }
      } else if (dialogNode) {
         dialogNode.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
            img.style.zIndex = '999';
         });
      } else {
         document
            .querySelector('main > div > div')
            ?.querySelectorAll<HTMLImageElement>('img')
            .forEach((img) => (img.style.zIndex = '999'));
      }
      const replyBtn = document.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
      const btnsContainer =
         document.querySelector('div[role="presentation"] section') || replyBtn?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;

      if (btnsContainer instanceof HTMLElement && btnsContainer.getElementsByClassName('custom-btn').length === 0) {
         addCustomBtn(btnsContainer, iconColor);
      }
   }

   // stories
   if (pathname.startsWith('/stories/')) {
      handleVideo();
      const node = document.querySelector('section')?.querySelector('img[decoding="sync"]')?.nextSibling;
      if (node instanceof HTMLDivElement) {
         node.style.zIndex = '-1';
      }
      const blockDiv = [...document.querySelectorAll('body>div:not(#splash-screen)>div>div>div')].filter(
         (i) => window.getComputedStyle(i).display === 'block'
      )[0];
      const storyMenuBtn = blockDiv?.querySelector('section svg circle');
      if (storyMenuBtn && blockDiv.getElementsByClassName('custom-btn').length === 0) {
         addCustomBtn(storyMenuBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
      }
   }

   // reels
   if (pathname.startsWith('/reels/')) {
      // handle video
      const videos = document.querySelectorAll('video');
      for (let i = 0; i < videos.length; i++) {
         videos[i].style.zIndex = '1';
         videos[i].style.position = 'relative';
         videos[i].controls = true;
         const btnEl = videos[i].nextElementSibling?.querySelector<HTMLDivElement>('div[role=button]');
         if (btnEl) {
            btnEl.style.paddingBottom = '3rem';
            btnEl.childNodes.forEach((i) => i instanceof HTMLDivElement && (i.style.zIndex = '999'));
         }
      }
      const reelsList =
         checkType() === 'pc' ? document.querySelectorAll('section>main>div>div') : document.querySelectorAll('section>main>div>div>div');
      for (const item of reelsList) {
         const btn = item.querySelector(':scope polygon');
         if (btn && item.getElementsByClassName('custom-btn').length === 0) {
            addCustomBtn(
               btn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode,
               checkType() === 'pc' ? iconColor : 'white',
               'before'
            );
         }
      }
   }

   // reel
   if (pathname.startsWith('/reel/')) {
      handleVideo();
      const shareBtn = document.querySelector('section svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]');
      if (shareBtn) {
         const dialogNode = document.querySelector<HTMLDivElement>('div[role="dialog"]');
         const node = dialogNode || document;
         if (node.getElementsByClassName('custom-btn').length === 0) {
            if (dialogNode) {
               addCustomBtn(shareBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor, 'before');
            } else {
               addCustomBtn(shareBtn.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
            }
         }
      }
   }

   // user Avatar
   if (document.getElementsByClassName('custom-btn').length === 0) {
      const profileBtn = document.querySelector('section>main header section svg circle');
      if (profileBtn) {
         addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
      }
   }
}, 1000);
