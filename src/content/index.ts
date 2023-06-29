import { addCustomBtn } from './button';

setInterval(() => {
	if (window.location.origin !== 'https://www.instagram.com') return;

	const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';

	// home
	if (window.location.pathname === '/') {
		const articleList = document.querySelectorAll('article');
		for (let i = 0; i < articleList.length; i++) {
			const shareButton = articleList[i].querySelector(
				'button svg polygon[points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"]'
			);
			if (shareButton && articleList[i].getElementsByClassName('custom-btn').length === 0) {
				addCustomBtn(shareButton.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, iconColor);
			}
		}
	}

	// post
	if (window.location.pathname.startsWith('/p/')) {
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
		const storyBtn = document.querySelector('section section svg circle');
		if (storyBtn && document.getElementsByClassName('custom-btn').length === 0) {
			addCustomBtn(storyBtn.parentNode?.parentNode?.parentNode?.parentNode?.parentNode, 'white');
		}
	}
	if (document.getElementsByClassName('custom-btn').length === 0) {
		// user profile
		const profileBtn = document.querySelector('section main header section button svg circle');
		if (profileBtn) {
			addCustomBtn(profileBtn.parentNode?.parentNode?.parentNode, iconColor);
		}

		// reel
		if (window.location.pathname.startsWith('/reel/')) {
			const saveBtn = document.querySelector(
				'section>main>div>div>div>div:nth-child(2)>div>div:nth-of-type(3)>div>div:nth-of-type(3)>div>div[role="button"]>button>div:nth-of-type(2)>svg'
			);
			if (saveBtn) {
				addCustomBtn(saveBtn.parentNode?.parentNode, iconColor);
			}
		}
	}
}, 1000);
