import { storageCache } from "./storage";
import { mutedSVGPath, unmutedSVGPath } from "../../constants";

const volumeChangeGuard = new WeakMap<HTMLVideoElement, boolean>();

export async function handleVideo() {
    const { setting_enable_video_controls, setting_enable_explore_video_clickthrough } = storageCache.settings;
    if (!setting_enable_video_controls) return;

    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
        const videoPlayerMaskDiv = videos[i].closest('[data-visualcompletion="ignore-late-mutation"]')?.querySelector('div[role="group"]');
        if (videoPlayerMaskDiv instanceof HTMLDivElement) {
            handleVideoMaskClip(videoPlayerMaskDiv, videos[i])
        }

        const allowExploreClickthrough = setting_enable_explore_video_clickthrough ?? true;
        if (allowExploreClickthrough) attachExploreNavigation(videos[i]);
    }
}

function attachExploreNavigation(video: HTMLVideoElement) {
    if (!window.location.pathname.startsWith('/explore')) return;

    const link = video.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    if (video.dataset.enableExploreNav === 'true') return;

    video.dataset.enableExploreNav = 'true';
    video.addEventListener(
        'click',
        (event) => {
            if (!(event instanceof MouseEvent)) return;
            const controlZoneHeight = 72; // approximate height covered by native controls
            const offsetFromBottom = video.clientHeight - event.offsetY;

            // Keep control interactions working by skipping clicks near the control bar
            if (Number.isFinite(offsetFromBottom) && offsetFromBottom <= controlZoneHeight) return;

            event.preventDefault();
            event.stopPropagation();
            const href = link.href || new URL(link.getAttribute('href') || '', window.location.origin).href;
            window.open(href, link.target || '_self');
        },
        true
    );
}

export function handleStoriesVideoVolumeChange(e: Event) {
    if (!(e.target instanceof HTMLVideoElement)) return
    if (volumeChangeGuard.get(e.target)) return;
    volumeChangeGuard.set(e.target, true);
    try {
        const isMutingBtn = document.querySelector(`section ${mutedSVGPath}`);
        const isUnmutingBtn = document.querySelector(`section ${unmutedSVGPath}`);
        const newEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        if (!e.target.muted && isMutingBtn) {
            isMutingBtn.dispatchEvent(newEvent)
        }
        if (e.target.muted && isUnmutingBtn) {
            isUnmutingBtn.dispatchEvent(newEvent)
        }
    } finally {
        const target = e.target;
        setTimeout(() => {
            volumeChangeGuard.set(target, false);
        }, 100);
    }
}

export function handleVideVolumeChange(e: Event, groupDiv: HTMLDivElement) {
    const videoTarget = e.target;
    if (!(videoTarget instanceof HTMLVideoElement)) return
    if (volumeChangeGuard.get(videoTarget)) return;
    volumeChangeGuard.set(videoTarget, true);
    try {
        const isMutingBtn = groupDiv.querySelector(mutedSVGPath);
        const isUnmutingBtn = groupDiv.querySelector(unmutedSVGPath);
        const newEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        if (!videoTarget.muted && isMutingBtn) {
            isMutingBtn.dispatchEvent(newEvent)
        }
        if (videoTarget.muted && isUnmutingBtn) {
            isUnmutingBtn.dispatchEvent(newEvent)
        }
    } finally {
        setTimeout(() => {
            volumeChangeGuard.set(videoTarget, false);
        }, 100);
    }
}

export function handleVideoMaskClip(videoPlayerMaskDiv: HTMLDivElement, videoTarget: HTMLVideoElement) {
    videoTarget.controls = true
    videoTarget.onvolumechange = event => {
        handleVideVolumeChange(event, videoPlayerMaskDiv)
    };
    videoPlayerMaskDiv.style.clipPath = `inset(0 0 4rem 0)`;
    if (window.location.pathname.startsWith("/reels/")) {
        const ele = videoPlayerMaskDiv.firstElementChild?.firstElementChild
        if (ele instanceof HTMLDivElement) {
            ele.style.bottom = "4rem"
        }
    } else {
        for (const child of videoPlayerMaskDiv.children) {
            if (child instanceof HTMLDivElement) {
                child.style.marginBottom = "4rem"
            }
        }
    }
}