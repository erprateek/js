// utils.js
export function computeDepth(node) {
    if (!node.children && !node._children) return 0;

    let maxChildDepth = 0;
    const children = node.children || node._children;
    children.forEach(child => {
        maxChildDepth = Math.max(maxChildDepth, computeDepth(child));
    });

    return 1 + maxChildDepth;
}
