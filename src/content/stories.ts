import dayjs from 'dayjs';
import { downloadResource, getUrlFromInfoApi, openInNewTab } from './utils';

function storyGetSectionNode(target: HTMLAnchorElement) {
	let sectionNode: HTMLElement = target;
	while (sectionNode && sectionNode.tagName !== 'SECTION') {
		sectionNode = sectionNode.parentNode as HTMLElement;
	}
	return sectionNode;
}

async function storyGetUrl(target: HTMLElement, sectionNode: any) {
	let url: string | null = null;

	url = await getUrlFromInfoApi(target);

	if (!url) {
		if (sectionNode.querySelector('video > source')) {
			url = sectionNode.querySelector('video > source').getAttribute('src');
		} else if (sectionNode.querySelector('img[decoding="sync"]')) {
			const img = sectionNode.querySelector('img[decoding="sync"]');
			url = img.srcset.split(/ \d+w/g)[0].trim(); // extract first src from srcset attr. of img
			if (url && url.length > 0) {
				return url;
			}
			url = sectionNode.querySelector('img[decoding="sync"]').getAttribute('src');
		} else if (sectionNode.querySelector('video')) {
			url = sectionNode.querySelector('video').getAttribute('src');
		}
	}
	return url;
}

export async function storyOnClicked(target: HTMLAnchorElement) {
	const sectionNode = storyGetSectionNode(target);
	const url = await storyGetUrl(target, sectionNode);
	if (url && url.length > 0) {
		if (target.className.includes('download-btn')) {
			try {
				let mediaName = url.split('?')[0].split('\\').pop()!.split('/').pop();
				mediaName = mediaName!.substring(0, mediaName!.lastIndexOf('.'));
				const postTime = sectionNode.querySelector('time')?.getAttribute('datetime');
				const posterName = window.location.pathname.split('/')[2];
				downloadResource(url, posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + mediaName);
			} catch (e) {
				downloadResource(url);
			}
		} else {
			openInNewTab(url);
		}
	}
}
