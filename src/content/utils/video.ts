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

// Largest one of Instagram's own small controls gets; anything bigger is a sticker or
// a layer spread over the player.
const SMALL_CONTROL_MAX_SIZE = 120;

// How a story's reply bar and the floating buttons slide above the control strip and
// back down.
const LIFT_TRANSITION = 'translate 250ms ease';

// Room left between a lifted reply bar and the control strip.
const REPLY_BAR_CLEARANCE = 10;

// How long a story's reply bar stays up after the viewer last pointed at the player.
const REPLY_BAR_IDLE_DELAY = 5000;

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

// When the viewer last pointed at a story's player, where the pointer is, and the reply
// bar lifted last with its player and the height of its control strip, so the bar can
// step down again while they leave it be.
type CurrentReplyBar = { bar: HTMLElement; video: HTMLVideoElement; strip: number };
let lastActivityTime = 0;
let lastPointerX = -1;
let lastPointerY = -1;
let activityWatcherInstalled = false;
let replyBarRestTimer = 0;
let currentReplyBar: CurrentReplyBar | null = null;

// Nodes clipped or faded for the controls, so the look can be undone again.
const stripStyled = new WeakMap<HTMLVideoElement, HTMLElement[]>();

// Where each player's overlay is, so a tap can free the strip immediately.
const playerContext = new WeakMap<HTMLVideoElement, { mask: HTMLDivElement; bottomDiv?: Node | null; replyBar?: HTMLElement | null }>();

// How long the strip stays free after a tap: Firefox hides its control bar 2 s after
// the sound change that brought it up, whatever is touched in between.
const CONTROLS_VISIBLE_WINDOW = 2000;

// How Instagram's overlay fades out of the strip and back in with the browser's control
// bar, on touch layouts, where the strip is only freed for a while after a tap.
const STRIP_FADE_MS = 300;
const STRIP_FADE_EASING = 'ease-in-out';

// Pieces of the overlay starting this little above the strip fade out whole, rather
// than being cut through where the strip begins.
const STRIP_FADE_SLACK = 24;

// Animated inside the mask that tapers Instagram's shadow, so the shadow fades along:
// 1 with the taper in full, 0 without it. Registered as a number so it can be animated.
const STRIP_TAPER_PROPERTY = '--igdl-strip-taper';
let stripTaperAnimatable: boolean | null = null;

// A player's freed strip on a touch layout: the overlay pieces faded out of it and the
// shadow's taper fading in, and from when the strip may be cut away, once all are done.
type StripFade = { open: boolean; cutFrom: number; cutTimer: number; pieces: Map<HTMLElement, Animation>; tapers: Set<Animation> };
const stripFades = new WeakMap<HTMLVideoElement, StripFade>();

// Longest the browser's control bar is kept away for a press on Instagram's sound or
// tag button. Only a sound change is waited for, and the tag button makes none.
const CONTROLS_HELD_MAX = 1000;

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
            if (elRect.width > 0 && elRect.height > 0 && elRect.width <= SMALL_CONTROL_MAX_SIZE && elRect.height <= SMALL_CONTROL_MAX_SIZE) {
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
    // Uncut, the strip still shows nothing of the pieces faded out of it, until they
    // have faded back in.
    closeStripFade(videoTarget);
    for (const node of stripStyled.get(videoTarget) ?? []) {
        if (node.dataset.customReplyStrip) {
            lowerReplyBar(node);
            continue;
        }
        node.style.clipPath = '';
        if (node.dataset.customStripTaper) {
            untaperShadow(node);
        } else {
            node.style.maskImage = '';
            node.style.webkitMaskImage = '';
        }
        node.style.translate = '';
        delete node.dataset.customGradientFaded;
        delete node.dataset.customLift;
    }
    stripStyled.delete(videoTarget);
    videoPlayerMaskDiv.style.clipPath = '';
    delete videoPlayerMaskDiv.dataset.customGradientFaded;
}

/**
 * Start freeing a player's strip on a touch layout, or carry on with it: Instagram's
 * overlay fades out of the strip first, and the strip is only cut away once it has,
 * so the cut is never seen.
 */
function openStripFade(videoTarget: HTMLVideoElement): StripFade {
    let fade = stripFades.get(videoTarget);
    if (!fade) {
        fade = { open: false, cutFrom: 0, cutTimer: 0, pieces: new Map(), tapers: new Set() };
        stripFades.set(videoTarget, fade);
    }
    if (!fade.open) {
        fade.open = true;
        fade.cutFrom = performance.now() + STRIP_FADE_MS;
        const current = fade;
        window.clearTimeout(current.cutTimer);
        // Cut it as soon as the fades are done, rather than waiting for the next pass.
        const cutWhenFaded = () => {
            const context = playerContext.get(videoTarget);
            if (!context || !current.open || !controlsWanted()) return;
            if (stripFaded(current)) {
                handleVideoMaskClip(context.mask, videoTarget, { bottomDiv: context.bottomDiv, replyBar: context.replyBar });
                // Anything found on the way starts a fade of its own, which is waited for too.
                if (stripFaded(current)) return;
            }
            current.cutTimer = window.setTimeout(cutWhenFaded, 40);
        };
        current.cutTimer = window.setTimeout(cutWhenFaded, STRIP_FADE_MS);
    }
    return fade;
}

/**
 * Whether a freeing strip may be cut away: the overlay has faded out of it, and the
 * shadow into its taper. The fades only start with the next frame, which can come a
 * while after the tap, so they are asked rather than timed.
 */
function stripFaded(fade: StripFade): boolean {
    if (performance.now() < fade.cutFrom) return false;
    const running = (animation: Animation) => animation.playState === 'running' || animation.playState === 'paused';
    for (const animation of fade.pieces.values()) if (running(animation)) return false;
    for (const animation of fade.tapers) if (running(animation)) return false;
    return true;
}

/** Fade what was faded out of a player's strip back in. */
function closeStripFade(videoTarget: HTMLVideoElement) {
    const fade = stripFades.get(videoTarget);
    if (!fade?.open) return;
    fade.open = false;
    window.clearTimeout(fade.cutTimer);
    for (const [piece, animation] of fade.pieces) {
        if (animation.playbackRate > 0) animation.reverse();
        animation.finished.then(() => {
            // Unless the strip was freed again on the way.
            if (fade.open) return;
            animation.cancel();
            fade.pieces.delete(piece);
        }, () => {});
    }
}

/**
 * Fade out what Instagram's `layer` shows in the strip of a player: each piece that
 * reaches into the strip, whole, from its caption to its buttons. A piece rising well
 * above the strip is looked into instead, and only what of it lies in the strip fades.
 * The sound and tag buttons are left alone, as they move up out of the strip instead.
 */
function fadeStripPieces(videoTarget: HTMLVideoElement, layer: HTMLElement, clipHeight: number, fade: StripFade, replyBar?: HTMLElement | null) {
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const stripTop = rect.bottom - clipHeight;
    const visit = (parent: Element) => {
        for (const child of parent.children) {
            if (!(child instanceof HTMLElement) || replyBar?.contains(child)) continue;
            const box = child.getBoundingClientRect();
            const sized = box.width > 0 && box.height > 0;
            const reaches = sized && box.bottom > stripTop && box.top < rect.bottom && box.right > rect.left && box.left < rect.right;
            // Wrappers without a box of their own can still hold something that does.
            if (sized && !reaches) continue;
            const holdsMover = (replyBar && child.contains(replyBar)) || child.querySelector(FLOATING_ICON_SELECTOR);
            if (!reaches || holdsMover || box.top < stripTop - STRIP_FADE_SLACK) {
                visit(child);
                continue;
            }
            fadeStripPiece(child, fade);
        }
    };
    visit(layer);
}

/** Fade one piece of the overlay out, once, however many layers it is found through. */
function fadeStripPiece(piece: HTMLElement, fade: StripFade) {
    const running = fade.pieces.get(piece);
    if (running) {
        // It was on its way back in.
        if (running.playbackRate < 0) running.reverse();
        return;
    }
    for (const [other, animation] of fade.pieces) {
        if (other.contains(piece)) return;
        // Fading both would fade the inner one twice as fast.
        if (piece.contains(other)) {
            animation.cancel();
            fade.pieces.delete(other);
        }
    }
    fade.pieces.set(piece, piece.animate({ opacity: '0' }, { duration: STRIP_FADE_MS, easing: STRIP_FADE_EASING, fill: 'forwards' }));
}

/** Whether the shadow's taper can be animated, which needs its property registered. */
function canAnimateTaper(): boolean {
    if (stripTaperAnimatable === null) {
        try {
            CSS.registerProperty({ name: STRIP_TAPER_PROPERTY, syntax: '<number>', inherits: false, initialValue: '1' });
            stripTaperAnimatable = true;
        } catch (error) {
            // An extension reloaded into the same page finds it registered already.
            stripTaperAnimatable = (error as { name?: string } | null)?.name === 'InvalidModificationError';
        }
    }
    return stripTaperAnimatable;
}

/**
 * Taper Instagram's shadow off before the strip, `offset` px above the bottom of the
 * shadow, over `clipHeight` px. With a fading strip it fades from the full shadow into
 * the taper, and the strip is not cut before it is done.
 */
function taperShadow(node: HTMLElement, offset: number, clipHeight: number, fade: StripFade | null) {
    const animate = fade !== null && canAnimateTaper();
    const clear = animate ? `rgb(0 0 0 / calc(1 - var(${STRIP_TAPER_PROPERTY}, 1)))` : 'transparent';
    const mask = `linear-gradient(to top, ${clear} ${offset}px, black ${offset + clipHeight}px)`;
    node.style.maskImage = mask;
    node.style.webkitMaskImage = mask;
    if (!animate || !fade) return;
    node.dataset.customStripTaper = 'open';
    if (!node.style.getPropertyValue(STRIP_TAPER_PROPERTY)) node.style.setProperty(STRIP_TAPER_PROPERTY, '0');
    const animation = animateTaper(node, 1);
    if (!animation) return;
    fade.tapers.add(animation);
    const forget = () => fade.tapers.delete(animation);
    animation.finished.then(forget, forget);
}

/** Fade Instagram's shadow back from its taper to the full shadow. */
function untaperShadow(node: HTMLElement) {
    node.dataset.customStripTaper = 'closing';
    const animation = animateTaper(node, 0);
    const done = animation ? animation.finished.then(() => true, () => false) : Promise.resolve(true);
    void done.then((arrived) => {
        if (!arrived || node.dataset.customStripTaper !== 'closing') return;
        delete node.dataset.customStripTaper;
        node.style.maskImage = '';
        node.style.webkitMaskImage = '';
        node.style.removeProperty(STRIP_TAPER_PROPERTY);
    });
}

const taperAnimations = new WeakMap<HTMLElement, Animation>();

/** Animate the shadow's taper from wherever it is now, unless it is there already. */
function animateTaper(node: HTMLElement, to: 0 | 1): Animation | null {
    const from = parseFloat(getComputedStyle(node).getPropertyValue(STRIP_TAPER_PROPERTY)) || 0;
    taperAnimations.get(node)?.cancel();
    node.style.setProperty(STRIP_TAPER_PROPERTY, String(to));
    const duration = STRIP_FADE_MS * Math.abs(to - from);
    if (duration < 1) return null;
    const animation = node.animate(
        [{ [STRIP_TAPER_PROPERTY]: String(from) }, { [STRIP_TAPER_PROPERTY]: String(to) }],
        { duration, easing: STRIP_FADE_EASING },
    );
    taperAnimations.set(node, animation);
    return animation;
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
 * Keep the browser's control bar down while Instagram's sound or tag button acts.
 *
 * Gecko shows its control bar whenever the sound changes, so Instagram's own sound
 * button brought it up for nothing. A video without the `controls` attribute has no
 * bar to show, and the one that comes back with the attribute starts out hidden, so
 * the attribute is left off until the change has been announced.
 */
function keepControlBarDown(videoTarget: HTMLVideoElement) {
    if (!videoTarget.controls || videoTarget.dataset.customControlsHeld) return;
    videoTarget.dataset.customControlsHeld = 'true';
    videoTarget.controls = false;

    let timer = 0;
    const restore = () => {
        window.clearTimeout(timer);
        videoTarget.removeEventListener('volumechange', restoreSoon);
        delete videoTarget.dataset.customControlsHeld;
        videoTarget.controls = true;
    };
    // The bar answers the change in a listener of its own, so let that run first.
    const restoreSoon = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(restore, 100);
    };
    videoTarget.addEventListener('volumechange', restoreSoon, { once: true });
    timer = window.setTimeout(restore, CONTROLS_HELD_MAX);
}

/** The player with its sound kept through taps under a point, if any. */
function playerAt(clientX: number, clientY: number): HTMLVideoElement | null {
    for (const video of document.querySelectorAll('video')) {
        if (video.dataset.customMuteKeeper !== 'true') continue;
        const rect = video.getBoundingClientRect();
        if (rect.width === 0 || clientX < rect.left || clientX > rect.right) continue;
        if (clientY < rect.top || clientY > rect.bottom) continue;
        return video;
    }
    return null;
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

    const noteStart = (clientX: number, clientY: number, target: EventTarget | null) => {
        startX = clientX;
        startY = clientY;
        startTime = performance.now();
        gestureNoted = false;

        // Instagram's sound and tag buttons do their own thing, which needs no control
        // bar. Unless it is already up, keep it away while they act, from the moment
        // they are pressed, as Instagram may answer before the tap has ended.
        if (controlsWanted() || !(target instanceof Element)) return;
        const control = target.closest(INTERACTIVE_SELECTOR);
        if (!control?.querySelector(FLOATING_ICON_SELECTOR)) return;
        const video = playerAt(clientX, clientY);
        if (video) keepControlBarDown(video);
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
            const context = playerContext.get(video);
            // A story's reply bar is for answering it, not for calling up the controls.
            if (hit && context?.replyBar?.contains(hit)) return;
            const controlBarBottom = rect.bottom - (bottomInsetMap.get(video) ?? 0);
            if (clientY <= controlBarBottom && controlBarBottom - clientY <= CONTROL_ZONE_HEIGHT) {
                allowSoundChange();
            } else {
                // A tap on the player itself: show the strip, bring the controls up.
                lastPlayerTapTime = performance.now();
                if (context) {
                    handleVideoMaskClip(context.mask, video, { bottomDiv: context.bottomDiv, replyBar: context.replyBar });
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

    document.addEventListener('pointerdown', (event) => noteStart(event.clientX, event.clientY, event.target), true);
    document.addEventListener('touchstart', (event) => {
        const touch = event.changedTouches[0];
        if (touch) noteStart(touch.clientX, touch.clientY, event.target);
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
function clipCoverLayers(videoTarget: HTMLVideoElement, clipHeight: number, replyBar?: HTMLElement | null, stripFade?: StripFade | null) {
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
                // A story's reply bar is never cut: it slides through the strip, and
                // rests in it while the viewer leaves it be.
                if (replyBar?.contains(node)) continue;
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
                    if (stripFade) fadeStripPieces(videoTarget, node, clipHeight, stripFade, replyBar);
                    if (!stripFade || stripFaded(stripFade)) node.style.clipPath = `inset(0 0 ${clipHeight}px 0)`;
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
 * button rail stay where they are. They slide there, as the reply bar does.
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
        // Measure where the button sits without a lift, so a changed strip is followed,
        // even while it is still sliding up or down.
        const shift = translatedY(control);
        const box = control.getBoundingClientRect();
        if (box.left < rect.left || box.right > rect.right) continue;
        if (box.bottom - shift <= stripTop || box.top - shift >= rect.bottom) continue;
        if (control.dataset.customLift !== String(clipHeight)) {
            control.style.transition = LIFT_TRANSITION;
            control.style.translate = `0 -${clipHeight}px`;
            control.dataset.customLift = String(clipHeight);
        }
        rememberStripStyled(videoTarget, control);
    }
}

/** How far an element is moved down by its `translate` right now, mid-transition too. */
function translatedY(node: HTMLElement): number {
    const [, y = '0'] = getComputedStyle(node).translate.split(' ');
    return parseFloat(y) || 0;
}

/**
 * Lift a story's reply bar above the control strip.
 *
 * Stories pin the reply field, the like and the share button along the bottom of
 * the player, inside the strip that is cut away for the browser's control bar, so
 * the clip took the only way to answer a story with it. The bar's content slides up
 * to just above the strip instead while the viewer points at or taps the player,
 * which is what brings the browser's control bar up, and on the desktop it steps back
 * down once they have left the player be for a while.
 */
function liftReplyBar(videoTarget: HTMLVideoElement, replyBar: HTMLElement, clipHeight: number) {
    const rect = videoTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    // The bar itself never moves, so its box tells whether it reaches into the strip.
    // Anything taller is a layer over the player rather than the bar.
    const bar = replyBar.getBoundingClientRect();
    if (bar.height > rect.height / 2) return;
    if (bar.bottom <= rect.bottom - clipHeight || bar.top >= rect.bottom) return;

    // A pass that ran before the bar was found may have clipped it with the strip.
    for (const node of replyBar.querySelectorAll<HTMLElement>('[style*="clip-path"]')) {
        node.style.clipPath = '';
    }

    currentReplyBar = { bar: replyBar, video: videoTarget, strip: clipHeight };
    const stripTop = clipHeight - Math.max(0, Math.round(rect.bottom - bar.bottom));
    moveReplyBar(replyBar, stripTop, replyBarWanted(currentReplyBar), true);
    rememberStripStyled(videoTarget, replyBar);

    if (checkType() === 'pc') {
        watchActivity();
        scheduleReplyBarRest();
    }
}

/**
 * Lift a reply bar's content to just above the strip `stripTop` px above the bar's
 * bottom, or put it back where Instagram had it. Only the content moves: the bar's
 * shadow stays behind the control bar, and the quick reactions Instagram opens above
 * the field, out of the bar's own box, are left whole.
 */
function moveReplyBar(replyBar: HTMLElement, stripTop: number, lifted: boolean, animate: boolean) {
    const rows = [...replyBar.children].filter((row): row is HTMLElement => row instanceof HTMLElement);
    // Offsets leave the lift out, so this is where Instagram has the rows, and it holds
    // while the player is still scaling in as well.
    const rowsBottom = Math.max(0, ...rows.map((row) => row.offsetTop + row.offsetHeight));
    const lift = lifted ? Math.max(0, stripTop + REPLY_BAR_CLEARANCE - (replyBar.clientHeight - rowsBottom)) : 0;
    replyBar.dataset.customReplyStrip = String(stripTop);
    replyBar.dataset.customReplyLift = String(lift);

    const moved = rows.filter((row) => row.dataset.customLift !== String(lift));
    for (const row of moved) {
        row.style.transition = animate ? LIFT_TRANSITION : 'none';
        row.style.translate = lift > 0 ? `0 -${lift}px` : '';
        row.dataset.customLift = String(lift);
    }

    if (!animate && moved.length) {
        // Settle the move before the transition comes back, so it does not slide.
        void replyBar.offsetHeight;
        for (const row of moved) row.style.transition = LIFT_TRANSITION;
    }
}

/** How long since the viewer last pointed at a story's player. */
function replyBarIdleTime(): number {
    return performance.now() - lastActivityTime;
}

/**
 * Whether a story's reply bar should be up. On the desktop the browser shows its
 * control bar while the pointer moves over the player, so the bar goes up with it and
 * stays up a while after. Then it is held there for as long as the browser keeps its
 * control bar out, while the video is paused or the pointer rests on that bar, and
 * while a reply is being written or the pointer rests on the reply bar. Touch layouts
 * only lift it while the controls are wanted after a tap on the player.
 */
function replyBarWanted(current: CurrentReplyBar): boolean {
    if (checkType() !== 'pc') return true;
    if (replyBarIdleTime() < REPLY_BAR_IDLE_DELAY) return true;
    if (!(Number(current.bar.dataset.customReplyLift) > 0)) return false;
    if (current.video.paused || current.bar.contains(document.activeElement) || current.bar.matches(':hover')) return true;
    const rect = current.video.getBoundingClientRect();
    return lastPointerX >= rect.left && lastPointerX <= rect.right
        && lastPointerY >= rect.bottom - current.strip && lastPointerY <= rect.bottom;
}

/** Look again when the reply bar might have to step down. */
function scheduleReplyBarRest() {
    if (replyBarRestTimer) return;
    const wait = REPLY_BAR_IDLE_DELAY - replyBarIdleTime();
    replyBarRestTimer = window.setTimeout(restReplyBar, wait > 0 ? wait : 1000);
}

/** Let the reply bar step down once the viewer has left the player be. */
function restReplyBar() {
    replyBarRestTimer = 0;
    const current = currentReplyBar;
    if (!current?.bar.isConnected || !(Number(current.bar.dataset.customReplyLift) > 0)) return;
    if (replyBarWanted(current)) {
        scheduleReplyBarRest();
        return;
    }
    lowerReplyBar(current.bar);
}

/**
 * Bring the reply bar up whenever the viewer points at or clicks the player.
 *
 * Only the player itself calls up the browser's control bar. Pointing at the reply
 * bar, or at one of the buttons over the story, is the viewer doing something else,
 * and moving the bar out from under the pointer would only get in their way.
 */
function watchActivity() {
    if (activityWatcherInstalled) return;
    activityWatcherInstalled = true;
    let lastPressTime = 0;

    const notePointer = (event: PointerEvent) => {
        // A browser can repeat a move for a pointer that stays put while the page
        // changes under it, such as the bar sliding down beneath it.
        if (event.type === 'pointermove' && event.clientX === lastPointerX && event.clientY === lastPointerY) return;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        if (event.type === 'pointerdown') lastPressTime = performance.now();

        const current = currentReplyBar;
        if (!current?.bar.isConnected) return;
        const target = event.target;
        if (target instanceof Element && (current.bar.contains(target) || isSmallControl(target))) return;
        const rect = current.video.getBoundingClientRect();
        if (rect.width === 0 || event.clientX < rect.left || event.clientX > rect.right) return;
        if (event.clientY < rect.top || event.clientY > rect.bottom) return;
        raiseReplyBar(current);
    };

    // Firefox keeps a click on the player to its own controls, so the page only learns
    // of it from the video stopping or starting under the pointer. Instagram's own
    // buttons and keys are seen pressed first, and a story ending or starting is not
    // the viewer's doing.
    const noteToggle = (event: Event) => {
        const current = currentReplyBar;
        if (!current?.bar.isConnected || event.target !== current.video) return;
        if (!current.video.matches(':hover') || current.video.ended || current.video.currentTime < 0.5) return;
        if (performance.now() - lastPressTime < 500) return;
        raiseReplyBar(current);
    };

    document.addEventListener('pointermove', notePointer, { capture: true, passive: true });
    document.addEventListener('pointerdown', notePointer, { capture: true, passive: true });
    document.addEventListener('pointerout', (event) => {
        // The pointer left the page, so it no longer rests anywhere on it.
        if (!event.relatedTarget) lastPointerX = lastPointerY = -1;
    }, { capture: true, passive: true });
    document.addEventListener('keydown', () => { lastPressTime = performance.now(); }, { capture: true, passive: true });
    document.addEventListener('play', noteToggle, true);
    document.addEventListener('pause', noteToggle, true);
}

/** Bring a story's reply bar up, and keep it there a while. */
function raiseReplyBar(current: CurrentReplyBar) {
    lastActivityTime = performance.now();
    const stripTop = Number(current.bar.dataset.customReplyStrip);
    if (current.bar.dataset.customReplyLift === '0' && stripTop) moveReplyBar(current.bar, stripTop, true, true);
    scheduleReplyBarRest();
}

/**
 * True for a button the viewer can press, such as pause or sound in a story's header.
 * Stickers a story is made of can be pressed as well, but they are spread over the
 * player, so they count as the player.
 */
function isSmallControl(target: Element): boolean {
    const control = target.closest(INTERACTIVE_SELECTOR);
    if (!control) return false;
    const box = control.getBoundingClientRect();
    return box.width <= SMALL_CONTROL_MAX_SIZE && box.height <= SMALL_CONTROL_MAX_SIZE;
}

/**
 * Start the reply bar Instagram renders for the next story where the last one was.
 *
 * Every story comes with a reply bar of its own, back at the bottom of the player,
 * so the field dropped into the control strip at each story change and jumped up
 * again once the new story was handled. Taking the lift over before the new bar is
 * painted keeps it in place; a story without a video then lets it slide down.
 */
export function carryReplyBarLift(previous: HTMLElement, replyBar: HTMLElement) {
    const stripTop = Number(previous.dataset.customReplyStrip);
    if (!stripTop || !(Number(previous.dataset.customReplyLift) > 0)) return;
    moveReplyBar(replyBar, stripTop, true, false);
}

/** Let a story's reply bar slide back down to where Instagram put it. */
export function lowerReplyBar(replyBar: HTMLElement) {
    const stripTop = Number(replyBar.dataset.customReplyStrip);
    if (!stripTop || !(Number(replyBar.dataset.customReplyLift) > 0)) return;
    moveReplyBar(replyBar, stripTop, false, true);
}

/**
 * Soften Instagram's bottom shadow where the control strip is clipped out.
 *
 * Instagram darkens the lower part of a player with a gradient overlay. Clipping
 * the strip that frees the control bar cuts that gradient at its darkest point,
 * which leaves a hard bright seam straight across the video. Fading each gradient
 * out before the cut makes the shadow taper off instead.
 */
function fadeClippedGradients(videoPlayerMaskDiv: HTMLDivElement, videoTarget: HTMLVideoElement, clipHeight: number, stripFade: StripFade | null) {
    if (videoPlayerMaskDiv.dataset.customGradientFaded === String(clipHeight)) return;

    const clipLine = videoPlayerMaskDiv.getBoundingClientRect().bottom - clipHeight;

    for (const node of videoPlayerMaskDiv.querySelectorAll<HTMLElement>('div, span')) {
        if (!getComputedStyle(node).backgroundImage.includes('gradient')) continue;
        const rect = node.getBoundingClientRect();
        // Only the wide overlays that darken the player, not small pills or chips.
        if (rect.width < videoTarget.clientWidth * 0.8) continue;

        // Where the element keeps its own bottom below the cut, start the fade at the cut.
        const offset = Math.max(0, Math.round(rect.bottom - clipLine));
        // Where the strip comes and goes, the shadow fades into its taper and back with it.
        taperShadow(node, offset, clipHeight, stripFade);
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
    // Kept away for a moment on purpose, see keepControlBarDown().
    if (videoTarget.dataset.customControlsHeld) return;
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
    // A story's reply bar, to be kept above the control strip.
    replyBar?: HTMLElement | null;
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

    playerContext.set(videoTarget, { mask: videoPlayerMaskDiv, bottomDiv: customOptions.bottomDiv, replyBar: customOptions.replyBar });

    // The strip is only freed while the controls are wanted. Clipping and fading do
    // not affect layout, so this comes and goes without moving the video.
    if (checkType() !== 'pc' && !controlsWanted()) {
        clearStripStyling(videoTarget, videoPlayerMaskDiv);
        return;
    }
    // On touch layouts the overlay fades out of the strip before the strip is cut away.
    const stripFade = checkType() === 'pc' ? null : openStripFade(videoTarget);
    if (!videoPlayerMaskDiv.contains(videoTarget)) {
        if (stripFade) fadeStripPieces(videoTarget, videoPlayerMaskDiv, clipHeight, stripFade, customOptions.replyBar);
        if (!stripFade || stripFaded(stripFade)) videoPlayerMaskDiv.style.clipPath = `inset(0 0 ${clipHeight}px 0)`;
        rememberStripStyled(videoTarget, videoPlayerMaskDiv);
    }

    // Instagram's own overlay is left where it is: lifting it above the strip moved
    // the whole caption and button rail up, which reads worse than letting the clip
    // take the sliver of it that overlaps the control bar. Only what would be cut
    // away whole is lifted on its own: a story's reply bar, and the sound and tag
    // buttons.

    if (customOptions.replyBar) liftReplyBar(videoTarget, customOptions.replyBar, clipHeight);
    clipCoverLayers(videoTarget, clipHeight, customOptions.replyBar, stripFade);
    liftFloatingControls(videoTarget, clipHeight);
    fadeClippedGradients(videoPlayerMaskDiv, videoTarget, clipHeight, stripFade);
    makeVideoHoverable(videoTarget);
}