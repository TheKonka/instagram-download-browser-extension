// Keyboard shortcut: press "d" to download the media in focus.
//
// Instagram's own key command registries (PolarisKeyCommands and
// CometDefaultKeyCommands) do not bind a plain "d". Like Instagram's commands,
// this one does not fire from text inputs, so typing a comment or DM is safe.

const DOWNLOAD_KEY = 'd';

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]') !== null;
}

function isVisible(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

// The download button for the media nearest to the viewport center.
// A post dialog is on top of the page, so its button wins.
function findFocusedDownloadButton() {
    const dialog = document.querySelector<HTMLElement>('div[role="dialog"]');
    const scope = dialog?.querySelector('.download-btn') ? dialog : document;
    const buttons = [...scope.querySelectorAll<HTMLAnchorElement>('a.download-btn')].filter(isVisible);

    const centerY = window.innerHeight / 2;
    let best: HTMLAnchorElement | null = null;
    let bestDistance = Infinity;
    for (const btn of buttons) {
        const container = btn.closest<HTMLElement>('article') ?? btn;
        const rect = container.getBoundingClientRect();
        const distance = rect.top <= centerY && rect.bottom >= centerY ? 0 : Math.min(Math.abs(rect.top - centerY), Math.abs(rect.bottom - centerY));
        if (distance < bestDistance) {
            best = btn;
            bestDistance = distance;
        }
    }
    return best;
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key !== DOWNLOAD_KEY || e.repeat || e.isComposing) return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
    if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;

    const btn = findFocusedDownloadButton();
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    // The click goes through the same global handler as a mouse click.
    btn.click();
}

export function initShortcuts() {
    if (window.location.host !== 'www.instagram.com') return;
    window.addEventListener('keydown', handleKeydown, true);
}
