import { addCustomBtn } from './button';

setInterval(() => {
	const iconColor = getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)' ? 'white' : 'black';

	// post
	const articleList = document.querySelectorAll('article');
	for (let i = 0; i < articleList.length; i++) {
		const likeButton = articleList[i].querySelector('article section span button');
		if (likeButton && articleList[i].getElementsByClassName('custom-btn').length === 0) {
			addCustomBtn(likeButton, iconColor);
		}
	}

	if (document.getElementsByClassName('custom-btn').length === 0) {
		// profile
		const profileBtn = document.querySelector('section main header section button svg circle');
		if (profileBtn) {
			addCustomBtn(profileBtn, iconColor);
		}

		// story
		const storyBtn = document.querySelector('section > div > header button > div');
		if (storyBtn && window.location.pathname.startsWith('/stories/')) {
			addCustomBtn(storyBtn, 'white');
		}
	}
}, 1000);
