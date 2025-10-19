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