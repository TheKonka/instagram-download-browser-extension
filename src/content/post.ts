import dayjs from 'dayjs';
import { downloadResource, getMediaName, getUrlFromInfoApi, openInNewTab } from './utils';

function postGetArticleNode(target: HTMLAnchorElement) {
	let articleNode: HTMLElement = target;
	while (articleNode.tagName !== 'ARTICLE') {
		articleNode = articleNode.parentNode as HTMLElement;
	}
	return articleNode;
}

async function fetchVideoURL(articleNode: HTMLElement, videoElem: HTMLVideoElement) {
	const poster = videoElem.getAttribute('poster');
	const timeNodes = articleNode.querySelectorAll('time');
	const posterUrl = (timeNodes[timeNodes.length - 1].parentNode!.parentNode as any).href;
	const posterPattern = /\/([^\/?]*)\?/;
	const posterMatch = poster?.match(posterPattern);
	const postFileName = posterMatch?.[1];
	const resp = await fetch(posterUrl);
	const content = await resp.text();
	const pattern = new RegExp(`${postFileName}.*?video_versions.*?url":("[^"]*")`, 's');
	const match = content.match(pattern);
	let videoUrl = JSON.parse(match?.[1] ?? '');
	videoUrl = videoUrl.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g, 'https://scontent.cdninstagram.com');
	videoElem.setAttribute('videoURL', videoUrl);
	return videoUrl;
}

const getVideoSrc = async (articleNode: HTMLElement, videoElem: HTMLVideoElement) => {
	let url = videoElem.getAttribute('src');
	if (videoElem.hasAttribute('videoURL')) {
		url = videoElem.getAttribute('videoURL');
	} else if (url === null || url.includes('blob')) {
		url = await fetchVideoURL(articleNode, videoElem);
	}
	return url;
};

async function postGetUrl(articleNode: HTMLElement) {
	// meta[property="og:video"]

	let url: string | null = null;
	let mediaIndex = 0;
	if (articleNode.querySelectorAll('li[style][class]').length === 0) {
		// single img or video

		url = await getUrlFromInfoApi(articleNode);

		if (url === null) {
			const videoElem: HTMLVideoElement | null = articleNode.querySelector('article  div > video');
			const imgElem = articleNode.querySelector('article  div[role] div > img');
			if (videoElem) {
				// media type is video
				if (videoElem) {
					url = await getVideoSrc(articleNode, videoElem);
				}
			} else if (imgElem) {
				// media type is image
				url = imgElem.getAttribute('src');
			} else {
				console.log('Err: not find media at handle post single');
			}
		}
	} else {
		// multiple imgs or videos
		const isPostView = window.location.pathname.startsWith('/p/');
		let dotsList;
		if (isPostView) {
			dotsList = articleNode.querySelectorAll(`:scope > div > div > div > div:nth-child(2)>div`);
		} else {
			dotsList = articleNode.querySelectorAll(`:scope > div > div:nth-child(2) > div >div>div> div>div:nth-child(2)>div`);
		}

		// if get dots list fail, try get img url from img element attribute
		if (dotsList.length === 0) {
			const imgList = articleNode.querySelectorAll(':scope li img');
			if (imgList.length === 2) {
				return imgList[0].getAttribute('src');
			} else if (imgList.length === 3) {
				return imgList[1].getAttribute('src');
			} else if (imgList.length > 3) {
				return imgList[imgList.length - 3].getAttribute('src');
			} else {
				return null;
			}
		}

		mediaIndex = [...dotsList].findIndex((i) => i.classList.length === 2);
		url = await getUrlFromInfoApi(articleNode, mediaIndex);
		if (url === null) {
			const listElements = [
				...articleNode.querySelectorAll(
					`:scope > div > div:nth-child(${isPostView ? 1 : 2}) > div > div:nth-child(1) ul li[style*="translateX"]`
				),
			] as HTMLLIElement[];
			const listElementWidth = Math.max(...listElements.map((element) => element.clientWidth));
			const positionsMap: Record<string, HTMLLIElement> = listElements.reduce((result, element) => {
				const position = Math.round(Number(element.style.transform.match(/-?(\d+)/)?.[1]) / listElementWidth);
				return { ...result, [position]: element };
			}, {});

			const node = positionsMap[mediaIndex];
			const videoElem = node.querySelector('video');
			const imgElem = node.querySelector('img');
			if (videoElem) {
				// media type is video
				url = await getVideoSrc(articleNode, videoElem);
			} else if (imgElem) {
				// media type is image
				url = imgElem.getAttribute('src');
			}
		}
	}
	return url;
}

export async function postOnClicked(target: HTMLAnchorElement) {
	try {
		const articleNode = postGetArticleNode(target);
		const url = await postGetUrl(articleNode);
		console.log('post url=', url);
		if (url && url.length > 0) {
			if (target.className.includes('download-btn')) {
				try {
					const postTime = articleNode.querySelector('time')?.getAttribute('datetime');
					const posterName = articleNode.querySelector('a')!.getAttribute('href')!.replace(/\//g, '');
					downloadResource(url, posterName + '-' + dayjs(postTime).format('YYYYMMDD_HHmmss') + '-' + getMediaName(url));
				} catch (e) {
					downloadResource(url);
				}
			} else {
				openInNewTab(url);
			}
		}
	} catch (e: any) {
		alert('get media failed!');
		console.log(`Uncatched in postOnClicked(): ${e}\n${e.stack}`);
		return null;
	}
}
