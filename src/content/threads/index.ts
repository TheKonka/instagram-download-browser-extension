import { addCustomBtn } from '../button';

function handleList(list: Element[]) {
   const iconColor = window.getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
   list.forEach((node) => {
      // text post doesn't need to add button
      if (node.querySelector('picture') || node.querySelector('video')) {
         node
            .querySelectorAll(
               'path[d="M1 7.66c0 4.575 3.899 9.086 9.987 12.934.338.203.74.406 1.013.406.283 0 .686-.203 1.013-.406C19.1 16.746 23 12.234 23 7.66 23 3.736 20.245 1 16.672 1 14.603 1 12.98 1.94 12 3.352 11.042 1.952 9.408 1 7.328 1 3.766 1 1 3.736 1 7.66Z"]'
            )
            .forEach((likeBtn) => {
               const btnContainer = likeBtn.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
               if (btnContainer && btnContainer.getElementsByClassName('custom-btn').length === 0) {
                  addCustomBtn(btnContainer, iconColor);
               }
            });
      }
   });
}

export function handleThreads() {
   const pathname = window.location.pathname;
   const pathnameList = pathname.split('/').filter((e) => e);

   const isPostDetailPage = pathnameList.length === 3 && pathnameList[1] === 'post';

   if (pathname === '/search/') {
      const list = document
         .querySelector('header')
         ?.nextElementSibling?.querySelector(':scope>div>div>div>div:not([hidden])>div:nth-child(1)>div>div:nth-child(2)>div')?.children;
      list && handleList(Array.from(list));
   } else if (isPostDetailPage || pathname.startsWith('/@')) {
      const list = document
         .querySelector('header')
         ?.nextElementSibling?.querySelector(':scope>div>div>div>div:not([hidden])>div:nth-child(1)')?.children;
      list && handleList(Array.from(list));
   } else {
      const progressbar = document.querySelector('div[role=progressbar]');
      const list = progressbar?.parentElement?.parentElement?.parentElement?.querySelectorAll<HTMLDivElement>(
         ':scope>div>div>div>div>div:nth-child(2)'
      );
      list && handleList(Array.from(list));
   }
}
