export function getParentArticleNode(node: HTMLElement | null) {
    if (node === null) return null;
    if (node.tagName === 'ARTICLE') {
        return node;
    }
    return getParentArticleNode(node.parentElement);
}

export function getParentSectionNode(node: HTMLElement | null) {
    if (node === null) return null;
    if (node.tagName === 'SECTION') {
        return node;
    }
    return getParentSectionNode(node.parentElement);
}

export function getCurrentStepFromDotsList(dotslists: ArrayLike<Element>) {
    const nodes = Array.from(dotslists);
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i]["ariaCurrent"] === 'step') {
            return i
        }
    }
    const counts = nodes.map(node => node.classList.length);
    const baseCount = Math.min(...counts);
    return nodes.findIndex(node => node.classList.length === baseCount + 1);
}