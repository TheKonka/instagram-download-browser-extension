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

export function getCurrentStepFromDotsList(dotslists: NodeListOf<Element>) {
    for (let i = 0; i < dotslists.length; i++) {
        if (dotslists[i]["ariaCurrent"]) {
            return i
        }
    }
    return -1;
}