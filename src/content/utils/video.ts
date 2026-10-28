import { storageCache } from "./storage";
import { checkType } from "./fn";
import { audioIsMutedSVGPath, audioIsPlayingSVGPath, tagIconSelector, unmutedSVGPath } from "../../constants";

const volumeChangeGuard = new WeakMap<HTMLVideoElement, boolean>();

// Height (px) from the bottom of the video covered by the native browser control bar.
const CONTROL_ZONE_HEIGHT = 72;

// Height of the strip clipped out of Instagram's overlay to free the control bar.
const CONTROL_STRIP_REM = 4;

// Instagram's own controls (sound, like, links, ...) that a tap has to keep reaching.
const INTERACTIVE_SELECTOR = 'button, a, [role="button"], [role="slider"], [role="menuitem"], [role="checkbox"]';

// Icons of the buttons floating in the player's bottom corners: sound, in each of
// its states, and the people tagged in the video.
const FLOATING_ICON_SELECTOR = [audioIsMutedSVGPath, audioIsPlayingSVGPath, unmutedSVGPath, tagIconSelector].join(', ');

// Widest a floating button gets; anything wider is a layer it sits in.
const FLOATING_CONTROL_MAX_WIDTH = 160;

// Overlay elements made click-through per video, in stacking order (topmost first).
// Used to re-dispatch clicks so Instagram's own handlers keep working as before.
const disabledOverlaysMap = new WeakMap<HTMLVideoElement, Element[]>();

// How far a bar pinned to the bottom of the viewport covers each video.
const bottomInsetMap = new WeakMap<HTMLVideoElement, number>();

// The sound state the viewer chose, per video, so Instagram's tap cannot change it.
const mutedIntentMap = new WeakMap<HTMLVideoElement, boolean>();
let bodyTapWatcherInstalled = false;
let muteLockInstalled = false;
let tapToggleBlockerInstalled = false;
let lastPlayerTapTime = 0;
let hideStripTimer = 0;

// Nodes clipped or faded for the controls, so the look can be undone again.
const stripStyled = new WeakMap<HTMLVideoElement, HTMLElement[]>();

// Where each player's overlay is, so a tap can free the strip immediately.
const playerContext = new WeakMap<HTMLVideoElement, { mask: HTMLDivElement; bottomDiv?: Node | null }>();

// How long the strip stays free after a tap.
const CONTROLS_VISIBLE_WINDOW = 3000;

let lastControlTapTime = 0;

// How long a sound change still counts as coming from the control bar that was tapped.
const CONTROL_TAP_WINDOW = 1500;

// How far the finger may travel, and how long it may stay down, for the gesture to
// still be a tap. A swipe through the reels must not be mistaken for one.
const TAP_SLOP = 10;
const TAP_MAX_DURATION = 500;
let clickGuardInstalled = false;

/**
 * Instagram paints invisible full-size layers over videos to capture clicks.
 * They also swallow hover, so the native browser controls only appear in the
 * strip where the player mask is clipped away. Make those layers click-through
 * so hovering anywhere over the video shows the controls, while re-enabling the
 * small interactive controls (mute button, ...) that live inside them.
 */
function makeVideoHoverable(videoTarget: HTMLVideoElement) {
    // Touch layouts are left to Instagram: its cover layers carry the tap and the
    // swipe that moves to the next reel. The control bar stays reachable by tapping
    // the strip the mask clip cuts away at the bottom of the player.
    if (checkType() !== 'pc') return;

    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    const overlays: Element[] = [];
    let guard = 0;
    while (guard < 12) {
        const top = document.elementFromPoint(cx, cy);
        if (!top || top === videoTarget || top.contains(videoTarget)) break;
        const topRect = top.getBoundingClientRect();
        // Only make full-video cover layers click-through, never stray UI pieces.
        if (!(topRect.width >= videoTarget.clientWidth * 0.8 && topRect.height >= videoTarget.clientHeight * 0.8)) break;
        (top as HTMLElement).style.pointerEvents = 'none';
        overlays.push(top);
        guard++;
    }

    // Keep previously recorded overlays if nothing new was found (e.g. video out of view).
    if (overlays.length > 0) {
        disabledOverlaysMap.set(videoTarget, overlays);
    }

    // Re-enable Instagram's own small controls that live inside the disabled layers.
    for (const overlay of overlays) {
        for (const el of overlay.querySelectorAll<HTMLElement>('button, a, [role="slider"], [role="button"], [role="menuitem"], [role="checkbox"]')) {
            const elRect = el.getBoundingClientRect();
            if (elRect.width > 0 && elRect.height > 0 && elRect.width <= 120 && elRect.height <= 120) {
                el.style.pointerEvents = 'auto';
            }
        }
    }

    installClickGuard();
}

function installClickGuard() {
    if (clickGuardInstalled) return;
    clickGuardInstalled = true;
    document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        const videoTarget = event.target.closest('video');
        if (!(videoTarget instanceof HTMLVideoElement)) return;
        // The explore clickthrough handler manages its own clicks.
        if (videoTarget.dataset.enableExploreNav === 'true') return;
        const overlays = disabledOverlaysMap.get(videoTarget);
        if (!overlays?.length) return;

        const rect = videoTarget.getBoundingClientRect();
        const controlBarBottom = rect.bottom - (bottomInsetMap.get(videoTarget) ?? 0);
        if (event.clientY <= controlBarBottom && controlBarBottom - event.clientY <= CONTROL_ZONE_HEIGHT) {
            // Interaction with the native control bar: keep Instagram's handlers out.
            event.stopPropagation();
            return;
        }

        // Suppress the native play/pause toggle and keep behaving exactly like
        // clicking Instagram's overlay did, by forwarding the click to the overlay
        // Instagram's own handler lives on.
        event.preventDefault();
        event.stopPropagation();
        const overlay = overlays.find((item) => item.isConnected);
        if (!overlay) return;
        overlay.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: event.clientX,
            clientY: event.clientY,
            button: event.button,
        }));
    }, true);
}

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

/**
 * Measure how much of the bottom of a video the viewer cannot reach.
 *
 * The browser draws its control bar along the bottom of the video, and on the
 * mobile layout that band is regularly unusable: Instagram's navigation bar is
 * fixed over it, a scrolling ancestor cuts the player off short, or it simply
 * falls past the bottom of the window. Report how much is lost so the controls
 * can be lifted clear of it.
 */
function measureBottomInset(videoTarget: HTMLVideoElement): number {
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0) return 0;

    // A player as tall as the window will sit under the bar once it is scrolled to,
    // so give it the inset straight away. Waiting until it arrives would resize it
    // in front of the viewer, which reads as the video jumping.
    if (rect.height >= window.innerHeight - 8) {
        return Math.min(measurePinnedBottomBar(videoTarget), Math.round(rect.height / 3));
    }

    // Otherwise only the player on screen can tell us what covers it.
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return 0;
    if (rect.bottom > window.innerHeight + 200) return 0;

    // The window itself is the first thing that can cut the control bar off.
    let usableBottom = Math.min(rect.bottom, window.innerHeight);

    // A scrolling or clipping ancestor ends the player earlier than its own box does.
    let ancestor = videoTarget.parentElement;
    for (let depth = 0; ancestor && depth < 16; depth++) {
        const style = getComputedStyle(ancestor);
        if (style.overflowY !== 'visible' || style.clipPath !== 'none') {
            usableBottom = Math.min(usableBottom, ancestor.getBoundingClientRect().bottom);
        }
        ancestor = ancestor.parentElement;
    }

    // And a bar pinned over the bottom of the window covers whatever is left.
    // The bar's own element sits well above the tapped icon, so walk a good way up.
    let node: HTMLElement | null = document.elementFromPoint(rect.x + rect.width / 2, window.innerHeight - 2) as HTMLElement | null;
    for (let depth = 0; node instanceof HTMLElement && depth < 16; depth++) {
        const style = getComputedStyle(node);
        const bar = node.getBoundingClientRect();
        const isOpaque = style.backgroundColor !== 'transparent' && !style.backgroundColor.endsWith(', 0)');
        const isPinned = (style.position === 'fixed' || style.position === 'sticky') && bar.bottom >= window.innerHeight - 4;
        const spansWidth = bar.width >= window.innerWidth * 0.7;
        const isBarSized = bar.height >= 8 && bar.height <= 200 && !node.contains(videoTarget);
        if (isPinned && isOpaque && spansWidth && isBarSized && bar.top < rect.bottom) {
            usableBottom = Math.min(usableBottom, bar.top);
            break;
        }
        node = node.parentElement;
    }

    // Never give up more than a third of the player.
    return Math.max(0, Math.min(Math.round(rect.bottom - usableBottom), Math.round(rect.height / 3)));
}

/**
 * Shrink the video's content box so the browser's control bar clears the inset.
 * The element keeps its outer size, so Instagram's own layout is untouched.
 */
function applyBottomInset(videoTarget: HTMLVideoElement, inset: number) {
    if (inset > 0) {
        if (videoTarget.dataset.customBottomInset === String(inset)) return;
        videoTarget.style.boxSizing = 'border-box';
        videoTarget.style.paddingBottom = `${inset}px`;
        videoTarget.dataset.customBottomInset = String(inset);
    } else if (videoTarget.dataset.customBottomInset) {
        videoTarget.style.paddingBottom = '';
        videoTarget.style.boxSizing = '';
        delete videoTarget.dataset.customBottomInset;
    }
}

/**
 * Keep the sound as the viewer set it, whatever Instagram does to it.
 *
 * Tapping a reel raises the browser controls, counts towards a double tap to like
 * and also flips the sound. Nothing is blocked here — the tap keeps working — the
 * sound is simply put back. Only the control bar is allowed to change it, so a
 * later re-mute by Instagram is undone as well.
 */
function keepSoundThroughTaps(videoTarget: HTMLVideoElement) {
    watchBodyTaps();
    installMuteLock();
    // The lock in the page ignores Instagram's writes to this player's sound.
    videoTarget.dataset.customMuteLock = 'on';
    if (videoTarget.dataset.customMuteKeeper === 'true') return;
    videoTarget.dataset.customMuteKeeper = 'true';
    mutedIntentMap.set(videoTarget, videoTarget.muted);

    videoTarget.addEventListener('volumechange', () => {
        // The viewer just used the control bar: that is the new intent.
        if (performance.now() - lastControlTapTime < CONTROL_TAP_WINDOW) {
            mutedIntentMap.set(videoTarget, videoTarget.muted);
            return;
        }
        const intent = mutedIntentMap.get(videoTarget);
        if (intent !== undefined && videoTarget.muted !== intent) {
            videoTarget.muted = intent;
        }
    });
}

/**
 * Note when the control bar was tapped, so a sound change from it is honoured.
 * Purely an observer: it must never interfere with Instagram's tap or swipe.
 */
/**
 * Height of the bar Instagram pins across the bottom of the window, if there is one.
 * Measured from the page rather than from a single player, so every reel can be
 * given the same inset before it is scrolled into view.
 */
function measurePinnedBottomBar(videoTarget: HTMLVideoElement): number {
    let node = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 2);
    for (let depth = 0; node instanceof HTMLElement && depth < 16; depth++) {
        const style = getComputedStyle(node);
        const bar = node.getBoundingClientRect();
        const isOpaque = style.backgroundColor !== 'transparent' && !style.backgroundColor.endsWith(', 0)');
        const isPinned = (style.position === 'fixed' || style.position === 'sticky') && bar.bottom >= window.innerHeight - 4;
        const spansWidth = bar.width >= window.innerWidth * 0.7;
        const isBarSized = bar.height >= 8 && bar.height <= 200 && !node.contains(videoTarget);
        if (isPinned && isOpaque && spansWidth && isBarSized) return Math.round(bar.height);
        node = node.parentElement;
    }
    return 0;
}

/** True while the controls are wanted, i.e. shortly after the player was tapped. */
function controlsWanted(): boolean {
    return performance.now() - lastPlayerTapTime < CONTROLS_VISIBLE_WINDOW;
}

function rememberStripStyled(videoTarget: HTMLVideoElement, node: HTMLElement) {
    const nodes = stripStyled.get(videoTarget) ?? [];
    if (!nodes.includes(node)) nodes.push(node);
    stripStyled.set(videoTarget, nodes);
}

/**
 * Give Instagram's overlay its look back. Only paint is undone here: the bottom
 * inset stays, because changing it would resize the video and make it jump.
 */
function clearStripStyling(videoTarget: HTMLVideoElement, videoPlayerMaskDiv: HTMLDivElement) {
    for (const node of stripStyled.get(videoTarget) ?? []) {
        node.style.clipPath = '';
        node.style.maskImage = '';
        node.style.webkitMaskImage = '';
        node.style.translate = '';
        delete node.dataset.customGradientFaded;
        delete node.dataset.customLift;
    }
    stripStyled.delete(videoTarget);
    videoPlayerMaskDiv.style.clipPath = '';
    delete videoPlayerMaskDiv.dataset.customGradientFaded;
}

/**
 * Hide the sound badge Instagram flashes in the middle of a tapped reel.
 *
 * With the sound locked the tap no longer changes anything, so the badge would
 * only claim something that did not happen. Instagram keeps one per reel, parked
 * at the centre of the player and normally invisible.
 */
function hideSoundTapBadge(videoTarget: HTMLVideoElement) {
    if (videoTarget.dataset.customSoundBadgeHidden === 'true') return;
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const centreX = rect.x + rect.width / 2;
    const centreY = rect.y + rect.height / 2;

    for (const icon of document.querySelectorAll('svg')) {
        const isAudioIcon = icon.querySelector(audioIsMutedSVGPath) || icon.querySelector(audioIsPlayingSVGPath) || icon.querySelector(unmutedSVGPath);
        if (!isAudioIcon) continue;
        const holder = icon.closest<HTMLElement>('div, span');
        if (!holder) continue;
        const box = holder.getBoundingClientRect();
        // The badge sits at the middle of the player; the sound button on the rail does not.
        if (box.width > 160 || box.height > 160) continue;
        if (Math.abs(box.x + box.width / 2 - centreX) > 80) continue;
        if (Math.abs(box.y + box.height / 2 - centreY) > 120) continue;
        holder.style.setProperty('display', 'none', 'important');
        videoTarget.dataset.customSoundBadgeHidden = 'true';
        return;
    }
}

/**
 * Raise the browser's controls after a tap on the player.
 *
 * Gecko shows them whenever the sound changes, so a change that lands back where
 * it started brings them up without altering anything the viewer can hear. This is
 * the same nudge that used to arrive by accident, when Instagram's own tap flipped
 * the sound and it was put back.
 */
function flashNativeControls(videoTarget: HTMLVideoElement) {
    const wasMuted = videoTarget.muted;
    volumeChangeGuard.set(videoTarget, true);
    videoTarget.dataset.customMuteAllow = 'on';
    videoTarget.muted = !wasMuted;
    videoTarget.muted = wasMuted;
    delete videoTarget.dataset.customMuteAllow;
    window.setTimeout(() => volumeChangeGuard.set(videoTarget, false), 150);
}

/**
 * Load the page-side lock. A content script cannot reach the properties Instagram's
 * own code sees, so this small script has to run in the page itself.
 */
function installMuteLock() {
    if (muteLockInstalled) return;
    muteLockInstalled = true;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('mute-lock.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
}

/** Briefly let the sound follow a control the viewer actually pressed. */
function allowSoundChange() {
    lastControlTapTime = performance.now();
    for (const video of document.querySelectorAll('video')) {
        if (video.dataset.customMuteLock !== 'on') continue;
        video.dataset.customMuteAllow = 'on';
        window.setTimeout(() => delete video.dataset.customMuteAllow, CONTROL_TAP_WINDOW);
    }
}

/**
 * On the home feed a tap anywhere on the video makes Instagram play or pause it.
 * The viewer wants that from the browser's own controls instead, so the tap is
 * cancelled before Instagram sees it. Only the click is cancelled: a scroll never
 * produces one, so the feed still moves under the finger exactly as before, and the
 * tap is still noticed elsewhere, which is what brings the control bar up.
 */
function keepPlaybackThroughTaps(videoTarget: HTMLVideoElement) {
    videoTarget.dataset.customTapKeepsPlaying = 'true';
    if (tapToggleBlockerInstalled) return;
    tapToggleBlockerInstalled = true;

    document.addEventListener('click', (event) => {
        // Anything the viewer actually pressed keeps working: Instagram's sound
        // button, a link, the profile above the video.
        const target = event.target;
        if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return;

        for (const video of document.querySelectorAll('video')) {
            if (video.dataset.customTapKeepsPlaying !== 'true') continue;
            const rect = video.getBoundingClientRect();
            if (rect.width === 0 || event.clientX < rect.left || event.clientX > rect.right) continue;
            if (event.clientY < rect.top || event.clientY > rect.bottom) continue;
            // The strip the control bar sits in belongs to the controls.
            const controlBarBottom = rect.bottom - (bottomInsetMap.get(video) ?? 0);
            if (event.clientY <= controlBarBottom && controlBarBottom - event.clientY <= CONTROL_ZONE_HEIGHT) return;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }, true);
}

function watchBodyTaps() {
    if (bodyTapWatcherInstalled) return;
    bodyTapWatcherInstalled = true;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let gestureNoted = false;

    const noteStart = (clientX: number, clientY: number) => {
        startX = clientX;
        startY = clientY;
        startTime = performance.now();
        gestureNoted = false;
    };

    // Touch sends both a pointer and a touch pair, so a gesture is only read once.
    const isTap = (clientX: number, clientY: number) => !gestureNoted
        && performance.now() - startTime <= TAP_MAX_DURATION
        && Math.abs(clientX - startX) <= TAP_SLOP
        && Math.abs(clientY - startY) <= TAP_SLOP;

    const noteTap = (clientX: number, clientY: number) => {
        gestureNoted = true;
        // A tap on a real control — Instagram's sound button as much as the browser's
        // own bar — is the viewer choosing, so let whatever it does to the sound stand.
        const hit = document.elementFromPoint(clientX, clientY);
        if (hit?.closest(INTERACTIVE_SELECTOR)) {
            allowSoundChange();
            return;
        }
        for (const video of document.querySelectorAll('video')) {
            if (video.dataset.customMuteKeeper !== 'true') continue;
            const rect = video.getBoundingClientRect();
            if (rect.width === 0 || clientX < rect.left || clientX > rect.right) continue;
            if (clientY < rect.top || clientY > rect.bottom) continue;
            const controlBarBottom = rect.bottom - (bottomInsetMap.get(video) ?? 0);
            if (clientY <= controlBarBottom && controlBarBottom - clientY <= CONTROL_ZONE_HEIGHT) {
                allowSoundChange();
            } else {
                // A tap on the player itself: show the strip, bring the controls up.
                lastPlayerTapTime = performance.now();
                const context = playerContext.get(video);
                if (context) {
                    handleVideoMaskClip(context.mask, video, { bottomDiv: context.bottomDiv });
                    window.clearTimeout(hideStripTimer);
                    hideStripTimer = window.setTimeout(() => {
                        if (!controlsWanted()) clearStripStyling(video, context.mask);
                    }, CONTROLS_VISIBLE_WINDOW + 50);
                }
                flashNativeControls(video);
            }
            return;
        }
    };

    document.addEventListener('pointerdown', (event) => noteStart(event.clientX, event.clientY), true);
    document.addEventListener('touchstart', (event) => {
        const touch = event.changedTouches[0];
        if (touch) noteStart(touch.clientX, touch.clientY);
    }, true);
    document.addEventListener('pointerup', (event) => {
        if (isTap(event.clientX, event.clientY)) noteTap(event.clientX, event.clientY);
    }, true);
    document.addEventListener('touchend', (event) => {
        const touch = event.changedTouches[0];
        if (touch && isTap(touch.clientX, touch.clientY)) noteTap(touch.clientX, touch.clientY);
    }, true);
}

/**
 * Cut the control strip out of every layer Instagram stacks over the player.
 *
 * Clipping the player mask alone is not enough: other full-size layers still cover
 * the bottom of the video, and on touch they swallow the tap that should reach the
 * control bar. Clipping them leaves the rest of each layer intact, so Instagram
 * keeps its tap and swipe everywhere above the strip.
 */
function clipCoverLayers(videoTarget: HTMLVideoElement, clipHeight: number) {
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // The caption sits on the left and the action rail on the right, so probe across
    // the strip rather than only at its middle.
    const inset = bottomInsetMap.get(videoTarget) ?? 0;
    const probeYs = [rect.bottom - inset - CONTROL_ZONE_HEIGHT / 2, rect.bottom - clipHeight / 2];
    const probeXs = [0.15, 0.5, 0.85].map((share) => rect.x + rect.width * share);

    for (const probeY of probeYs) {
        for (const probeX of probeXs) {
            for (const node of document.elementsFromPoint(probeX, probeY)) {
                if (node === videoTarget) break;
                if (!(node instanceof HTMLElement)) continue;
                // Never clip a player or anything holding one — not even a neighbouring
                // reel, whose controls would then be cut away when it scrolls into view.
                // Instagram recycles these nodes, so release any clip left on them.
                if (node instanceof HTMLVideoElement || node.querySelector('video')) {
                    if (node.style.clipPath) node.style.clipPath = '';
                    continue;
                }
                const nodeRect = node.getBoundingClientRect();
                // Wide layers stacked over the player, not the small chips inside them.
                if (nodeRect.width >= videoTarget.clientWidth * 0.6 && nodeRect.bottom >= rect.bottom - clipHeight) {
                    node.style.clipPath = `inset(0 0 ${clipHeight}px 0)`;
                    rememberStripStyled(videoTarget, node);
                }
            }
        }
    }
}

/**
 * The floating button an icon belongs to: its outermost ancestor that is still a
 * narrow control rather than one of the layers spread over the player. Measured by
 * width, as the volume slider grows upwards out of the button on hover.
 */
function floatingControlOf(icon: Element, videoTarget: HTMLVideoElement): HTMLElement | null {
    let control: HTMLElement | null = null;
    for (let node = icon.closest('svg')?.parentElement; node instanceof HTMLElement; node = node.parentElement) {
        if (node.contains(videoTarget)) break;
        const box = node.getBoundingClientRect();
        if (box.width > FLOATING_CONTROL_MAX_WIDTH || box.height > videoTarget.clientHeight / 2) break;
        control = node;
    }
    return control;
}

/**
 * Lift Instagram's floating buttons above the control strip.
 *
 * The sound and tagged-people buttons float in the bottom corners of the player,
 * inside the layers clipped to free the browser's control bar, so the clip took
 * them away with the strip. Both are still needed: the sound button's volume slider
 * sets the volume a video resumes at after a pause, and the tag button is the only
 * way to see who is tagged. Only the buttons move, by the height of the strip, so
 * they keep their spacing — now above the control bar — while the caption and the
 * button rail stay where they are.
 */
function liftFloatingControls(videoTarget: HTMLVideoElement, clipHeight: number) {
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const stripTop = rect.bottom - clipHeight;

    const controls = new Set<HTMLElement>();
    for (const layer of stripStyled.get(videoTarget) ?? []) {
        for (const icon of layer.querySelectorAll(FLOATING_ICON_SELECTOR)) {
            const control = floatingControlOf(icon, videoTarget);
            if (control) controls.add(control);
        }
    }

    for (const control of controls) {
        // Measure where the button sits without a lift, so a changed strip is followed.
        const lift = Number(control.dataset.customLift ?? 0);
        const box = control.getBoundingClientRect();
        if (box.left < rect.left || box.right > rect.right) continue;
        if (box.bottom + lift <= stripTop || box.top + lift >= rect.bottom) continue;
        if (lift !== clipHeight) {
            control.style.translate = `0 -${clipHeight}px`;
            control.dataset.customLift = String(clipHeight);
        }
        rememberStripStyled(videoTarget, control);
    }
}

/**
 * Soften Instagram's bottom shadow where the control strip is clipped out.
 *
 * Instagram darkens the lower part of a player with a gradient overlay. Clipping
 * the strip that frees the control bar cuts that gradient at its darkest point,
 * which leaves a hard bright seam straight across the video. Fading each gradient
 * out before the cut makes the shadow taper off instead.
 */
function fadeClippedGradients(videoPlayerMaskDiv: HTMLDivElement, videoTarget: HTMLVideoElement, clipHeight: number) {
    if (videoPlayerMaskDiv.dataset.customGradientFaded === String(clipHeight)) return;

    const clipLine = videoPlayerMaskDiv.getBoundingClientRect().bottom - clipHeight;

    for (const node of videoPlayerMaskDiv.querySelectorAll<HTMLElement>('div, span')) {
        if (!getComputedStyle(node).backgroundImage.includes('gradient')) continue;
        const rect = node.getBoundingClientRect();
        // Only the wide overlays that darken the player, not small pills or chips.
        if (rect.width < videoTarget.clientWidth * 0.8) continue;

        // Where the element keeps its own bottom below the cut, start the fade at the cut.
        const offset = Math.max(0, Math.round(rect.bottom - clipLine));
        const fade = `linear-gradient(to top, transparent ${offset}px, black ${offset + clipHeight}px)`;
        node.style.maskImage = fade;
        node.style.webkitMaskImage = fade;
        rememberStripStyled(videoTarget, node);
    }

    videoPlayerMaskDiv.dataset.customGradientFaded = String(clipHeight);
}

/**
 * Turn on the browser's own video controls.
 *
 * Gecko only builds its controls widget when the `controls` attribute changes on
 * an element it has already laid out, so on players Instagram re-renders a plain
 * `controls = true` leaves the video without a control bar. Toggling the
 * attribute once per element (with a forced reflow in between) makes Gecko
 * attach the widget; Blink is unaffected either way.
 */
function enableNativeControls(videoTarget: HTMLVideoElement) {
    if (videoTarget.dataset.customControlsAttached === 'true') {
        if (!videoTarget.controls) videoTarget.controls = true;
        return;
    }
    videoTarget.removeAttribute('controls');
    void videoTarget.offsetHeight;
    videoTarget.setAttribute('controls', '');
    videoTarget.dataset.customControlsAttached = 'true';
}

/**
 * Locate the `div[role="group"]` player mask belonging to a video.
 *
 * Instagram keeps the mask in a sibling subtree rather than an ancestor of the
 * video, and the wrapper it hangs off changes between layouts, so walk up until
 * an ancestor contains a group whose box matches this video's box. When several
 * players share a scroller, the closest aligned group wins.
 */
export function findVideoPlayerMask(videoTarget: HTMLVideoElement): HTMLDivElement | null {
    const videoRect = videoTarget.getBoundingClientRect();
    if (videoRect.width === 0 || videoRect.height === 0) return null;

    let node: HTMLElement | null = videoTarget.parentElement;
    for (let depth = 0; depth < 12 && node; depth++) {
        const candidates = [...node.querySelectorAll<HTMLDivElement>('div[role="group"]')]
            .map((group) => ({ group, rect: group.getBoundingClientRect() }))
            .filter(({ rect }) =>
                Math.abs(rect.width - videoRect.width) < 40 && Math.abs(rect.height - videoRect.height) < 40
            )
            .sort(
                (a, b) =>
                    Math.abs(a.rect.top - videoRect.top) + Math.abs(a.rect.left - videoRect.left) -
                    (Math.abs(b.rect.top - videoRect.top) + Math.abs(b.rect.left - videoRect.left))
            );
        if (candidates.length) return candidates[0].group;
        node = node.parentElement;
    }
    return null;
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
    const target = e.target;
    if (!(target instanceof HTMLVideoElement)) return
    if (volumeChangeGuard.get(target)) return;
    volumeChangeGuard.set(target, true);
    try {
        const sectionNode = target.closest("section")
        if (!sectionNode) return;
        const isMutingBtn = sectionNode.querySelector(audioIsMutedSVGPath);
        const isUnmutingBtn = sectionNode.querySelector(audioIsPlayingSVGPath)
        const newEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        if (!target.muted && isMutingBtn) {
            isMutingBtn.dispatchEvent(newEvent)
        }
        if (target.muted && isUnmutingBtn) {
            isUnmutingBtn.dispatchEvent(newEvent)
        }
    } finally {
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
        const isMutingBtn = groupDiv.querySelector(audioIsMutedSVGPath);
        const isUnmutingBtn = groupDiv.querySelector(audioIsPlayingSVGPath) || groupDiv.querySelector(unmutedSVGPath);
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

export function handleVideoMaskClip(videoPlayerMaskDiv: HTMLDivElement, videoTarget: HTMLVideoElement, customOptions: {
    bottomDiv?: Node | null;
    onVolumeChange?: (e: Event) => void,
    keepPlayingOnTap?: boolean;
} = {}) {
    enableNativeControls(videoTarget);
    // A previous pass may have clipped this player while it sat under another reel.
    if (videoTarget.style.clipPath) videoTarget.style.clipPath = '';
    if (videoTarget.dataset.customVolumeAttached !== 'true') {
        const handler = customOptions.onVolumeChange
            ? customOptions.onVolumeChange
            : (event: Event) => {
                handleVideVolumeChange(event, videoPlayerMaskDiv);
            };
        videoTarget.addEventListener('volumechange', handler);
        videoTarget.dataset.customVolumeAttached = 'true';
    }
    // Watching for taps and locking the sound has to happen even while the player is
    // left alone, otherwise the tap that asks for the controls is never noticed.
    if (checkType() !== 'pc') {
        keepSoundThroughTaps(videoTarget);
        hideSoundTapBadge(videoTarget);
        if (customOptions.keepPlayingOnTap) keepPlaybackThroughTaps(videoTarget);
    }

    // A bar fixed over the bottom of the player (the mobile nav bar) would hide the
    // control bar, so give the video that much bottom inset and free the same strip
    // from Instagram's overlay on top of the usual control-bar gap.
    const bottomInset = checkType() === 'pc' ? 0 : measureBottomInset(videoTarget);
    bottomInsetMap.set(videoTarget, bottomInset);
    applyBottomInset(videoTarget, bottomInset);

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const clipHeight = CONTROL_STRIP_REM * rootFontSize + bottomInset;

    playerContext.set(videoTarget, { mask: videoPlayerMaskDiv, bottomDiv: customOptions.bottomDiv });

    // The strip is only freed while the controls are wanted. Clipping and fading do
    // not affect layout, so this comes and goes without moving the video.
    if (checkType() !== 'pc' && !controlsWanted()) {
        clearStripStyling(videoTarget, videoPlayerMaskDiv);
        return;
    }
    if (!videoPlayerMaskDiv.contains(videoTarget)) {
        videoPlayerMaskDiv.style.clipPath = `inset(0 0 ${clipHeight}px 0)`;
        rememberStripStyled(videoTarget, videoPlayerMaskDiv);
    }

    // Instagram's own overlay is left where it is: lifting it above the strip moved
    // the whole caption and button rail up, which reads worse than letting the clip
    // take the sliver of it that overlaps the control bar. Only the sound and tag
    // buttons, which would be cut away whole, are lifted on their own.

    clipCoverLayers(videoTarget, clipHeight);
    liftFloatingControls(videoTarget, clipHeight);
    fadeClippedGradients(videoPlayerMaskDiv, videoTarget, clipHeight);
    makeVideoHoverable(videoTarget);
}