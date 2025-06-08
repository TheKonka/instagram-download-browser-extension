import { CLASS_CUSTOM_BUTTON } from '../../constants';
import { addCustomBtn } from '../button';

function handleList(list: Element[]) {
   const iconColor = window.getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';
   list.forEach((n) => {
      const node = n.firstElementChild?.firstElementChild;
      if (!node) return;
      // text post doesn't need to add button
      if (node.querySelector('picture') || node.querySelector('video')) {
         node
            .querySelectorAll(
               'path[d="M1.34375 7.53125L1.34375 7.54043C1.34374 8.04211 1.34372 8.76295 1.6611 9.65585C1.9795 10.5516 2.60026 11.5779 3.77681 12.7544C5.59273 14.5704 7.58105 16.0215 8.33387 16.5497C8.73525 16.8313 9.26573 16.8313 9.66705 16.5496C10.4197 16.0213 12.4074 14.5703 14.2232 12.7544C15.3997 11.5779 16.0205 10.5516 16.3389 9.65585C16.6563 8.76296 16.6563 8.04211 16.6562 7.54043V7.53125C16.6562 5.23466 15.0849 3.25 12.6562 3.25C11.5214 3.25 10.6433 3.78244 9.99228 4.45476C9.59009 4.87012 9.26356 5.3491 9 5.81533C8.73645 5.3491 8.40991 4.87012 8.00772 4.45476C7.35672 3.78244 6.47861 3.25 5.34375 3.25C2.9151 3.25 1.34375 5.23466 1.34375 7.53125Z"]'
            )
            .forEach((likeBtn) => {
               const btnContainer = likeBtn.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
               if (btnContainer && btnContainer.getElementsByClassName(CLASS_CUSTOM_BUTTON).length === 0) {
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

   if (pathname === '/') {
      const notLoginNode = document.querySelector('div[data-nosnippet="true"]>div>div>div');
      if (notLoginNode) {
         handleList(Array.from(notLoginNode.children));
      } else {
         const columnHeaders = document.querySelectorAll('div[id="barcelona-header"]');
         for (const header of columnHeaders) {
            const wrapper = header.parentElement?.parentElement?.parentElement?.querySelector(
               'div[data-visualcompletion="ignore"][data-thumb="1"]'
            )?.parentElement?.firstElementChild;
            if (wrapper) {
               handleList(Array.from(wrapper.children));
            }
         }
      }
   } else if (pathname === '/search') {
      const wrapperNode = document.querySelector('div[data-thumb="1"][data-visualcompletion="ignore"]')?.parentElement?.firstElementChild;
      if (wrapperNode) {
         handleList(Array.from(wrapperNode.children));
      }
   } else if (isPostDetailPage) {
      const layout = document.querySelectorAll('#barcelona-page-layout');
      let wrapper;
      for (const item of layout) {
         if (item.parentElement?.hidden) {
            continue;
         } else {
            wrapper = item;
            break;
         }
      }
      const list = wrapper?.querySelector('div[role=region]>div:nth-child(1)>div:nth-child(1)>div:nth-child(1)>div:nth-child(1)')?.children;
      if (list) {
         handleList(Array.from(list));
      }
   } else if (pathname.startsWith('/@')) {
      const layout = document.querySelectorAll('#barcelona-page-layout');
      let wrapper;
      for (const item of layout) {
         if (item.parentElement?.hidden) {
            continue;
         } else {
            wrapper = item;
            break;
         }
      }
      let list;
      if (wrapper) {
         list = wrapper.querySelector('div[role=region]>div>div:nth-child(4)>div:nth-child(1)>div:nth-child(1)')?.children;
      } else {
         list = document.querySelector('header')?.nextElementSibling?.querySelector('#barcelona-page-layout>div:nth-child(3)')?.children;
      }
      if (list) {
         handleList(Array.from(list));
      }
   } else {
      const progressbar = document.querySelector('div[role=progressbar]');
      const list = progressbar?.parentElement?.parentElement?.parentElement?.querySelectorAll<HTMLDivElement>(
         ':scope>div>div>div>div>div:nth-child(2)'
      );
      if (list) {
         handleList(Array.from(list));
      }
   }
}
