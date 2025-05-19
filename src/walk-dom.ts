import { decodeLeet } from './decode-leet';

export const walkDom = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const decodedText = decodeLeet(node.textContent);
        if (decodedText !== node.textContent) {
            const span = document.createElement('span');
            span.textContent = decodedText;
            node.parentNode?.replaceChild(span, node);
        }
    } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !['SCRIPT', 'STYLE', 'TEXTAREA'].includes((node as HTMLElement).tagName)
    ) {
        for (const child of Array.from(node.childNodes)) {
            walkDom(child);
        }
    }
};
