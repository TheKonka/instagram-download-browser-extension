import { CLASS_CUSTOM_BUTTON } from '../constants';
import type { IconClassName, IconColor } from '../types/global';
import { highlightsOnClicked } from './highlights';
import { postOnClicked } from './post';
import { postDetailOnClicked } from './post-detail';
import { profileOnClicked } from './profile';
import { handleProfileReel } from './profile-reel';
import { reelsOnClicked } from './reels';
import { storyOnClicked } from './stories';
import { handleThreadsButton } from './threads/button';
import { checkType, downloadResource } from './utils';

const svgDownloadBtn = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" height="24" width="24"
viewBox="0 0 477.867 477.867" fill="currentColor" xml:space="preserve">
<g>
	 <path d="M443.733,307.2c-9.426,0-17.067,7.641-17.067,17.067v102.4c0,9.426-7.641,17.067-17.067,17.067H68.267
			 c-9.426,0-17.067-7.641-17.067-17.067v-102.4c0-9.426-7.641-17.067-17.067-17.067s-17.067,7.641-17.067,17.067v102.4
			 c0,28.277,22.923,51.2,51.2,51.2H409.6c28.277,0,51.2-22.923,51.2-51.2v-102.4C460.8,314.841,453.159,307.2,443.733,307.2z"/>
</g>
<g>
	 <path d="M335.947,295.134c-6.614-6.387-17.099-6.387-23.712,0L256,351.334V17.067C256,7.641,248.359,0,238.933,0
			 s-17.067,7.641-17.067,17.067v334.268l-56.201-56.201c-6.78-6.548-17.584-6.36-24.132,0.419c-6.388,6.614-6.388,17.099,0,23.713
			 l85.333,85.333c6.657,6.673,17.463,6.687,24.136,0.031c0.01-0.01,0.02-0.02,0.031-0.031l85.333-85.333
			 C342.915,312.486,342.727,301.682,335.947,295.134z"/>
</g>
</svg>`;

const svgNewtabBtn = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="140 -820 680 680" width="24" height="24" fill="currentColor">
	<path d="M212.31-140Q182-140 161-161q-21-21-21-51.31v-535.38Q140-778 161-799q21-21 51.31-21h222.3q12.77 0 21.39 8.62 8.61 8.61 8.61 21.38T456-768.62q-8.62 8.62-21.39 8.62h-222.3q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v535.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h535.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-222.3q0-12.77 8.62-21.39 8.61-8.61 21.38-8.61t21.38 8.61q8.62 8.62 8.62 21.39v222.3Q820-182 799-161q-21 21-51.31 21H212.31ZM760-717.85 409.85-367.69q-8.31 8.3-20.89 8.5-12.57.19-21.27-8.5-8.69-8.7-8.69-21.08 0-12.38 8.69-21.08L717.85-760H590q-12.77 0-21.38-8.62Q560-777.23 560-790t8.62-21.38Q577.23-820 590-820h193.84q15.47 0 25.81 10.35Q820-799.31 820-783.84V-590q0 12.77-8.62 21.38Q802.77-560 790-560t-21.38-8.62Q760-577.23 760-590v-127.85Z" />
</svg>`;

const svgZipBtn = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000" id="File-Zip-Light--Streamline-Phosphor" height="24" width="24">
  <desc>
    File Zip Light Streamline Icon: https://streamlinehq.com
  </desc>
  <path d="M19.00595625 15.252768750000001h-2.001703125c-0.41456249999999994 0 -0.7506375000000001 0.33606562500000003 -0.7506375000000001 0.7506375000000001v7.00595625c0 0.5778375 0.6255375 0.938990625 1.12595625 0.650071875 0.23224687500000002 -0.134090625 0.37531875000000003 -0.3819 0.37531875000000003 -0.650071875v-1.2510656249999998h1.2510656249999998c2.5039781249999997 -0.00135 4.0675125 -2.712834375 2.81435625 -4.8806625 -0.58096875 -1.00501875 -1.65350625 -1.6242468749999999 -2.81435625 -1.624865625Zm0 5.004253125h-1.2510656249999998v-3.502978125h1.2510656249999998c1.34829375 0.00005625 2.19099375 1.45966875 1.5168000000000001 2.627296875 -0.312871875 0.5418562499999999 -0.8911125 0.8756531249999999 -1.5168000000000001 0.87568125Zm-6.25531875 -4.253615625v7.00595625c0 0.5778375 -0.625528125 0.938990625 -1.12595625 0.650071875 -0.23224687500000002 -0.134090625 -0.37531875000000003 -0.3819 -0.37531875000000003 -0.650071875V16.00340625c0 -0.5778468750000001 0.625528125 -0.9390000000000001 1.12595625 -0.650071875 0.23224687500000002 0.13408124999999999 0.37531875000000003 0.38189062500000004 0.37531875000000003 0.650071875Zm-5.004253125 7.00595625c0 0.41455312499999997 -0.336084375 0.7506187500000001 -0.7506375000000001 0.7506375000000001h-4.00340625c-0.5778375 0.00133125 -0.9404343749999999 -0.6233625 -0.65266875 -1.12445625 0.000290625 -0.000496875 0.000571875 -0.001003125 0.0008625 -0.0015l3.3616124999999997 -5.88H2.9923406249999998c-0.5778375 0 -0.938990625 -0.6255375 -0.650071875 -1.12595625 0.134090625 -0.23224687500000002 0.3819 -0.37531875000000003 0.650071875 -0.37531875000000003h4.00340625c0.5778375 -0.001340625 0.9404343749999999 0.6233625 0.65266875 1.1244468749999998 -0.000290625 0.00050625 -0.000571875 0.001003125 -0.0008625 0.0015093749999999999l-3.3616124999999997 5.88h2.7098062499999997c0.41455312499999997 0.00001875 0.7506375000000001 0.336084375 0.7506375000000001 0.7506375000000001ZM22.5389625 7.466146875000001 15.53300625 0.46019062499999996c-0.14064375 -0.1408125 -0.33144375000000004 -0.2200125 -0.53045625 -0.220190625H2.9923406249999998c-0.9673218749999999 0 -1.751484375 0.784171875 -1.751484375 1.75149375v9.00765c0 0.5778468750000001 0.625528125 0.9390000000000001 1.12595625 0.650071875 0.23224687500000002 -0.13408124999999999 0.37531875000000003 -0.38189062500000004 0.37531875000000003 -0.650071875V1.99149375c0 -0.138196875 0.112021875 -0.25021875 0.25020937499999996 -0.25021875h11.259571874999999V7.99659375c0 0.41457187500000003 0.336075 0.7506375000000001 0.7506375000000001 0.7506375000000001h6.25531875v2.2519125c0 0.5778468750000001 0.6255375 0.9390000000000001 1.125965625 0.650071875 0.23224687500000002 -0.13408124999999999 0.37531875000000003 -0.38189062500000004 0.37531875000000003 -0.650071875V7.99659375c-0.000178125 -0.19901249999999998 -0.079378125 -0.3898125 -0.220190625 -0.530446875Zm-6.785775000000001 -0.220190625V2.802178125l4.443778125 4.443778125Z" stroke-width="0.0938"></path>
</svg>`;

export function onClickHandler(currentTarget: Element) {
   if (currentTarget instanceof HTMLAnchorElement) {
      if (window.location.origin === 'https://www.threads.com') {
         handleThreadsButton(currentTarget);
         return;
      }

      const pathPrefix = window.location.pathname;
      const pathnameList = pathPrefix.split('/').filter((e) => e);
      const isPostDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'p';
      const isReelDetailWithNameInUrl = pathnameList.length === 3 && pathnameList[1] === 'reel';

      let fn: (target: HTMLAnchorElement) => Promise<any> = postOnClicked;
      if (document.querySelector('section>main>div>header>section:nth-child(2)')?.contains(currentTarget)) {
         fn = profileOnClicked;
      } else if (pathPrefix.startsWith('/reels/')) {
         fn = reelsOnClicked;
      } else if (pathPrefix.startsWith('/stories/highlights/')) {
         fn = highlightsOnClicked;
      } else if (pathPrefix.startsWith('/stories/')) {
         fn = storyOnClicked;
      } else if (pathPrefix.startsWith('/reel/')) {
         fn = handleProfileReel;
      } else if (pathPrefix.startsWith('/p/')) {
         if (document.querySelector('div[role="dialog"]')) {
            fn = postOnClicked;
         } else {
            fn = postDetailOnClicked;
         }
      } else if (isPostDetailWithNameInUrl || isReelDetailWithNameInUrl) {
         fn = postDetailOnClicked;
      }

      fn(currentTarget);
   }
}

function createCustomBtn(svg: string, iconColor: IconColor, className: IconClassName) {
   const newBtn = document.createElement('a');
   newBtn.innerHTML = svg;
   newBtn.className = CLASS_CUSTOM_BUTTON + ' ' + className;
   newBtn.setAttribute('style', `cursor: pointer;padding:8px;z-index: 0;color:${iconColor}`);
   newBtn.onmouseenter = () => {
      newBtn.style.setProperty('filter', 'drop-shadow(0px 0px 10px deepskyblue)');
   };
   newBtn.onmouseleave = () => {
      newBtn.style.removeProperty('filter');
   };

   if (className === 'newtab-btn') {
      newBtn.setAttribute('title', 'Open In New Tab');
      newBtn.setAttribute('target', '_blank');
      newBtn.setAttribute('rel', 'noopener,noreferrer');
   } else if (className === 'download-btn') {
      newBtn.setAttribute('title', 'Download');
   } else if (className === 'zip-btn') {
      newBtn.setAttribute('title', 'Download ZIP');
   }
   return newBtn;
}

export async function addCustomBtn(node: any, iconColor: IconColor, position: 'before' | 'after' = 'after') {
   const { setting_show_open_in_new_tab_icon, setting_show_zip_download_icon } = await chrome.storage.sync.get([
      'setting_show_open_in_new_tab_icon',
      'setting_show_zip_download_icon',
   ]);
   const downloadBtn = createCustomBtn(svgDownloadBtn, iconColor, 'download-btn');
   let newtabBtn, zipBtn;
   if (!(checkType() !== 'pc' && window.location.pathname.startsWith('/stories/'))) {
      if (setting_show_open_in_new_tab_icon) {
         newtabBtn = createCustomBtn(svgNewtabBtn, iconColor, 'newtab-btn');
      }
   }
   if (
      setting_show_zip_download_icon &&
      window.location.host === 'www.instagram.com' &&
      !window.location.pathname.startsWith('/reel') &&
      !window.location.pathname.startsWith('/stories/')
   ) {
      zipBtn = createCustomBtn(svgZipBtn, iconColor, 'zip-btn');
   }
   if (position === 'before') {
      if (newtabBtn) {
         node.insertBefore(newtabBtn, node.firstChild);
      }
      node.insertBefore(downloadBtn, node.firstChild);
      if (zipBtn) {
         node.insertBefore(zipBtn, node.firstChild);
      }
   } else {
      if (newtabBtn) {
         node.appendChild(newtabBtn);
      }
      node.appendChild(downloadBtn);
      if (zipBtn) {
         node.appendChild(zipBtn);
      }
   }
}

export function addVideoDownloadCoverBtn(node: HTMLDivElement) {
   const newBtn = document.createElement('a');
   newBtn.innerHTML = svgDownloadBtn;
   newBtn.className = CLASS_CUSTOM_BUTTON;
   newBtn.setAttribute('style', 'cursor: pointer;position:absolute;left:4px;top:4px;color:white');
   newBtn.setAttribute('title', 'Download Video Cover');
   newBtn.onmouseenter = () => {
      newBtn.style.setProperty('scale', '1.1');
   };
   newBtn.onmouseleave = () => {
      newBtn.style.removeProperty('scale');
   };
   newBtn.onclick = (e) => {
      e.stopPropagation();
      if (window.location.pathname.split('/')[2] === 'reels') {
         const bgEl = node.querySelector('[style*="background-image"]');
         if (bgEl) {
            const url = window
               .getComputedStyle(bgEl)
               .getPropertyValue('background-image')
               .match(/url\((.*)\)/)?.[1];
            if (url) {
               downloadResource({
                  url: JSON.parse(url),
               });
            }
         }
      } else {
         const imgSrc = node.querySelector('img')?.getAttribute('src');
         if (imgSrc) {
            downloadResource({
               url: imgSrc,
            });
         }
      }
   };
   node.appendChild(newBtn);
}
