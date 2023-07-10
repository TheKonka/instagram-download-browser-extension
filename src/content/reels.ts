import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';

async function fetchVideoURL(videoElem: HTMLVideoElement) {
	const resp = await fetch(window.location.href);
	const content = await resp.text();
	const videoUrl = content.match(/video_versions.*?url":"([^"].*?)".*?]/)?.[1];
	if (!videoUrl) return null;
	const url = JSON.parse('{"href": "' + videoUrl.replace(/\\\//g, '/') + '"}');
	videoElem.setAttribute('videoURL', url.href);
	return url.href;
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

async function getUrl(wrapperNode: HTMLDivElement) {
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
	const wrapperNode = target.parentNode!.parentNode as HTMLDivElement;
	try {
		const url = await getUrl(wrapperNode);
		console.log('url', url);
		if (url && url.length > 0) {
			if (target.className.includes('download-btn')) {
				try {
					const posterName = [...wrapperNode.querySelectorAll('a')].find((i) => i.href.includes('reels'))?.innerText;
					downloadResource(url, posterName + '-' + getMediaName(url));
				} catch (e) {
					downloadResource(url);
				}
			} else {
				openInNewTab(url);
			}
		}
	} catch (e: any) {
		alert('Download Failed!');
		console.log(`Uncatched in postDetailOnClicked(): ${e}\n${e.stack}`);
		return null;
	}
}
