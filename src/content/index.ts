import { addCustomBtn } from './button';

setInterval(() => {
	if (window.location.origin !== 'https://www.instagram.com') return;

	const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';

	// home
	if (window.location.pathname === '/') {
		const articleList = document.querySelectorAll('article');
		for (let i = 0; i < articleList.length; i++) {
			articleList[i].querySelectorAll(':scope img').forEach((img) => {
				if (img instanceof HTMLImageElement) {
					img.style.zIndex = '999';
				}
			});
			const shareButton = articleList[i].querySelector(
				'button svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]'
			);
			if (shareButton && articleList[i].getElementsByClassName('custom-btn').length === 0) {
				addCustomBtn(shareButton.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
			}
		}
	}

	// post
	if (window.location.pathname.startsWith('/p/')) {
		const dialogNode = document.querySelector('div[role="dialog"]');
		if (dialogNode) {
			dialogNode.querySelectorAll('img').forEach((img) => {
				if (img instanceof HTMLImageElement) {
					img.style.zIndex = '999';
				}
			});
		} else {
			document
				.querySelector('main > div > div')
				?.querySelectorAll('img')
				.forEach((img) => {
					if (img instanceof HTMLImageElement) {
						img.style.zIndex = '999';
					}
				});
		}

		const btns =
			document.querySelector('div[role="presentation"] section') ||
			(document.querySelector('button svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]')?.parentNode
				?.parentNode?.parentNode?.parentNode as HTMLDivElement);
		if (btns && btns.getElementsByClassName('custom-btn').length === 0) {
			addCustomBtn(btns, iconColor);
		}
	}

	// stories
	if (window.location.pathname.startsWith('/stories/')) {
		const node = document.querySelector('section section')?.querySelector('img[decoding="sync"]')?.nextSibling;
		if (node instanceof HTMLDivElement) {
			node.style.zIndex = '-1';
		}
		const storyBtn = document.querySelector('section section svg circle');
		if (storyBtn && document.getElementsByClassName('custom-btn').length === 0) {
			addCustomBtn(storyBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
		}
	}

	// reels
	if (window.location.pathname.startsWith('/reels/')) {
		const reelsList = document.querySelectorAll('section>main>div>div');
		for (const item of reelsList) {
			const btn = item.querySelector(':scope polygon');
			if (btn && item.getElementsByClassName('custom-btn').length === 0) {
				addCustomBtn(btn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor, 'before');
			}
		}
	}

	// reel
	if (window.location.pathname.startsWith('/reel/')) {
		const shareBtn = document.querySelector('section svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]');
		if (shareBtn) {
			const dialogNode = document.querySelector('div[role="dialog"]');
			const node = dialogNode || document;
			if (node.getElementsByClassName('custom-btn').length === 0) {
				if (dialogNode) {
					addCustomBtn(shareBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor, 'before');
				} else {
					addCustomBtn(shareBtn.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
				}
			}
		}
	}

	if (document.getElementsByClassName('custom-btn').length === 0) {
		// user profile
		const profileBtn = document.querySelector('section main header section svg circle');
		if (profileBtn) {
			addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
		}
	}
}, 1000);
