// Runs in the page, alongside Instagram's own scripts.
//
// Tapping a reel flips the sound, and that happens deep inside Instagram's gesture
// handling. Rather than fight it afterwards, ignore the write itself: a locked
// player keeps whatever sound the viewer chose. The browser's own control bar sets
// the property from privileged code, so it is unaffected, and the content script
// briefly lifts the lock when a real control is used.

const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted');

if (descriptor?.get && descriptor.set) {
    const read = descriptor.get;
    const write = descriptor.set;

    Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get(this: HTMLMediaElement) {
            return read.call(this);
        },
        set(this: HTMLMediaElement, value: boolean) {
            const locked = this.dataset?.customMuteLock === 'on' && this.dataset?.customMuteAllow !== 'on';
            if (locked) return;
            write.call(this, value);
        },
    });
}
