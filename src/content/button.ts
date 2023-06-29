import type { IconClassName, IconColor } from '../types';
import { postOnClicked } from './post';
import { postDetailOnClicked } from './postDetail';
import { profileOnClicked } from './profile';
import { storyOnClicked } from './stories';

var svgDownloadBtn = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" height="24" width="24"
viewBox="0 0 477.867 477.867" style="fill:%color;" xml:space="preserve">
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

var svgNewtabBtn = `<svg id="Capa_1" style="fill:%color;" viewBox="0 0 482.239 482.239" xmlns="http://www.w3.org/2000/svg" height="24" width="24">
<path d="m465.016 0h-344.456c-9.52 0-17.223 7.703-17.223 17.223v86.114h-86.114c-9.52 0-17.223 7.703-17.223 17.223v344.456c0 9.52 7.703 17.223 17.223 17.223h344.456c9.52 0 17.223-7.703 17.223-17.223v-86.114h86.114c9.52 0 17.223-7.703 17.223-17.223v-344.456c0-9.52-7.703-17.223-17.223-17.223zm-120.56 447.793h-310.01v-310.01h310.011v310.01zm103.337-103.337h-68.891v-223.896c0-9.52-7.703-17.223-17.223-17.223h-223.896v-68.891h310.011v310.01z"/>
</svg>`;

function onClickHandler(e: MouseEvent) {
	// handle button click
	e.stopPropagation();
	e.preventDefault();
	const { currentTarget } = e;
	if (currentTarget instanceof HTMLAnchorElement) {
		const pathPrefix = window.location.pathname;
		if (pathPrefix.startsWith('/stories/')) {
			storyOnClicked(currentTarget);
		} else if (pathPrefix.startsWith('/reel/')) {
			postDetailOnClicked(currentTarget);
		} else if (document.querySelector('header')?.contains(currentTarget)) {
			profileOnClicked(currentTarget);
		} else if (pathPrefix.startsWith('/p/')) {
			if (document.querySelector('article')) {
				postOnClicked(currentTarget);
			} else {
				postDetailOnClicked(currentTarget);
			}
		} else {
			postOnClicked(currentTarget);
		}
	}
}

function createCustomBtn(svg: string, iconColor: IconColor, className: IconClassName, marginLeft: number) {
	const newBtn = document.createElement('a');
	newBtn.innerHTML = svg.replace('%color', iconColor);
	newBtn.className = 'custom-btn ' + className;
	newBtn.setAttribute('target', '_blank');
	newBtn.setAttribute('style', 'cursor: pointer;margin-left:' + marginLeft + 'px;margin-top: 8px;z-index: 999;');
	if (className === 'newtab-btn') {
		newBtn.setAttribute('title', 'Open in new tab');
	} else {
		newBtn.setAttribute('title', 'Download');
	}
	newBtn.addEventListener('click', onClickHandler);
	return newBtn;
}

export function addCustomBtn(node: any, iconColor: IconColor) {
	const newtabBtn = createCustomBtn(svgNewtabBtn, iconColor, 'newtab-btn', 16);

	node.appendChild(newtabBtn);

	const downloadBtn = createCustomBtn(svgDownloadBtn, iconColor, 'download-btn', 14);
	node.appendChild(downloadBtn);
}
