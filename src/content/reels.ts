import { downloadResource, getUrlFromInfoApi, handleUrlDownload, openInNewTab } from './utils';

function postGetArticleNode(target: HTMLAnchorElement) {
	let articleNode: HTMLElement = target;
	while (articleNode.tagName !== 'ARTICLE') {
		articleNode = articleNode.parentNode as HTMLElement;
	}
	return articleNode;
}

async function fetchVideoURL(videoElem: HTMLVideoElement) {
	const resp = await fetch('/reels' + window.location.pathname.slice(7).slice(0, -1));
	const content = await resp.text();
	const videoUrl = content.match(/video_versions.*?url":"([^"].*?)".*?]/)?.[1];
	if (!videoUrl) return null;
	videoElem.setAttribute('videoURL', videoUrl);
	return videoUrl;
}

const getVideoSrc = async (videoElem: HTMLVideoElement) => {
	if (videoElem.hasAttribute('videoURL')) {
		return videoElem.getAttribute('videoURL');
	}
	let url = videoElem.getAttribute('src');
	if (url === null || url.includes('blob')) {
		url = await fetchVideoURL(videoElem);
	}
	return url;
};

async function postGetUrl(target: any) {
	const wrapperNode = target.parentNode.parentNode;
	if (!wrapperNode) return;
	let url: string | null = null;

	url = await getUrlFromInfoApi(wrapperNode);

	if (url === null) {
		const videoElem: HTMLVideoElement | null = wrapperNode.querySelector('video');
		if (videoElem) {
			url = await getVideoSrc(videoElem);
		}
	}
	return url;
}

export async function reelsOnClicked(target: HTMLAnchorElement) {
	try {
		const url = await postGetUrl(target);
		console.log('url', url);
		// download or open media url
		if (url && url.length > 0) {
			if (target.className.includes('download-btn')) {
				downloadResource(url);
			} else {
				// open url in new tab
				openInNewTab(url);
			}
		}
	} catch (e: any) {
		alert('Download Failed!');
		console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
		return null;
	}
}
