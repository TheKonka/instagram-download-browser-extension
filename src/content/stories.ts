import { downloadResource, getUrlFromInfoApi, handleUrlDownload, openInNewTab } from './utils';

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
	// extract url from target story and download or open it
	const sectionNode = storyGetSectionNode(target);
	const url = await storyGetUrl(target, sectionNode);
	if (url && url.length > 0) {
		if (target.className.includes('download-btn')) {
			downloadResource(url);
		} else {
			// open url in new tab
			openInNewTab(url);
		}
	}
}
