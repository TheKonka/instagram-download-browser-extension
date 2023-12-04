import { addCustomBtn } from './button';
import { checkType, handleVideo } from './utils';

setInterval(() => {
   if (window.location.origin !== 'https://www.instagram.com') return;

   const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';

   // home
   if (window.location.pathname === '/') {
      handleVideo();
      const articleList = document.querySelectorAll('article');
      for (let i = 0; i < articleList.length; i++) {
         articleList[i].querySelectorAll(':scope img').forEach((img) => {
            if (img instanceof HTMLImageElement) {
               img.style.zIndex = '999';
            }
         });
         articleList[i]
            .querySelectorAll(':scope ul>li>div>div>div>div')
            .forEach((i) => i instanceof HTMLDivElement && (i.style.zIndex = '999'));
         const replyBtn = articleList[i].querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
         if (replyBtn && articleList[i].getElementsByClassName('custom-btn').length === 0) {
            addCustomBtn(replyBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
         }
      }
   }

   // post
   if (window.location.pathname.startsWith('/p/')) {
      handleVideo();
      const dialogNode = document.querySelector('div[role="dialog"]');
      const tagNode = document.querySelector(
         'path[d="M21.334 23H2.666a1 1 0 0 1-1-1v-1.354a6.279 6.279 0 0 1 6.272-6.272h8.124a6.279 6.279 0 0 1 6.271 6.271V22a1 1 0 0 1-1 1ZM12 13.269a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z"]'
      );
      if (tagNode) {
         const emptyNode = tagNode.parentNode?.parentNode?.parentNode?.parentNode?.parentNode?.querySelector(':scope>div>div:nth-child(2)');
         if (emptyNode instanceof HTMLDivElement) {
            emptyNode.style.zIndex = '-1';
         }
      } else if (dialogNode) {
         dialogNode.querySelectorAll('img').forEach((img) => {
            if (img instanceof HTMLImageElement) {
               img.style.zIndex = '999';
            }
         });
      } else {
         document
            .querySelector('main > div > div')
            ?.querySelectorAll('img')
            .forEach((img) => {
               if (img instanceof HTMLImageElement) {
                  img.style.zIndex = '999';
               }
            });
      }
      const replyBtn = document.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
      const btnsContainer =
         document.querySelector('div[role="presentation"] section') || replyBtn?.parentNode?.parentNode?.parentNode?.parentNode?.parentNode;

      if (btnsContainer instanceof HTMLElement && btnsContainer.getElementsByClassName('custom-btn').length === 0) {
         addCustomBtn(btnsContainer, iconColor);
      }
   }

   // stories
   if (window.location.pathname.startsWith('/stories/')) {
      handleVideo();
      const node = document.querySelector('section')?.querySelector('img[decoding="sync"]')?.nextSibling;
      if (node instanceof HTMLDivElement) {
         node.style.zIndex = '-1';
      }
      const storyBtn = document.querySelector('section svg circle');
      if (storyBtn && document.getElementsByClassName('custom-btn').length === 0) {
         addCustomBtn(storyBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
      }
   }

   // reels
   if (window.location.pathname.startsWith('/reels/')) {
      // handle video
      const videos = document.querySelectorAll('video');
      for (let i = 0; i < videos.length; i++) {
         videos[i].style.zIndex = '1';
         videos[i].style.position = 'relative';
         videos[i].controls = true;
         const btnEl = videos[i].nextElementSibling?.querySelector('div[role=button]');
         if (btnEl instanceof HTMLDivElement) {
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
   if (window.location.pathname.startsWith('/reel/')) {
      handleVideo();
      const shareBtn = document.querySelector('section svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]');
      if (shareBtn) {
         const dialogNode = document.querySelector('div[role="dialog"]');
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

   if (document.getElementsByClassName('custom-btn').length === 0) {
      // user profile
      const profileBtn = document.querySelector('section main header section svg circle');
      if (profileBtn) {
         addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
      }
   }
}, 1000);
