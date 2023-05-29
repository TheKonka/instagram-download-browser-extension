import { addCustomBtn } from './button';

setInterval(() => {
	const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';

	// home
	const articleList = document.querySelectorAll('article');
	for (let i = 0; i < articleList.length; i++) {
		const likeButton = articleList[i].querySelector('article section span button');
		if (likeButton && articleList[i].getElementsByClassName('custom-btn').length === 0) {
			addCustomBtn(likeButton, iconColor);
		}
	}

	if (document.getElementsByClassName('custom-btn').length === 0) {
		// user profile
		const profileBtn = document.querySelector('section main header section button svg circle');
		if (profileBtn) {
			addCustomBtn(profileBtn, iconColor);
		}

		// story
		const storyBtn = document.querySelector('section > div > header button > div');
		if (storyBtn && window.location.pathname.startsWith('/stories/')) {
			addCustomBtn(storyBtn, 'white');
		}

		// post or reel
		const reelBtn = document.querySelector('section>main>div>div>div>div:nth-child(2)>div>div:nth-of-type(3)>div>div:nth-of-type(3)>div>div[role="button"]>button>div:nth-of-type(2)>svg');
		if (reelBtn) {
			const pathPrefix = window.location.pathname
			if (pathPrefix.startsWith('/p/') || pathPrefix.startsWith('/reel/')) {
				addCustomBtn(reelBtn, iconColor);
			}
		}
	}
}, 1000);
