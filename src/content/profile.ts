import { downloadResource, openInNewTab } from './utils';

function profileGetUrl(target: any) {
	const img = document.querySelector('header img');
	const url = img!.getAttribute('src');
	return url;
}

export function profileOnClicked(target: any) {
	// extract profile picture url and download or open it
	const url = profileGetUrl(target);

	if (url && url.length > 0) {
		// check url
		if (target.getAttribute('class').includes('download-btn')) {
			// generate filename
			const filename = document.querySelector('header h2')!.textContent;
			downloadResource(url, filename);
		} else {
			// open url in new tab
			openInNewTab(url!);
		}
	}
}
