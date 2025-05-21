import decodeSpeak from './decodeSpeak';

/**
 * Recursively walks through DOM nodes and decodes leet-speak in text nodes.
 * Preserves original font styling by modifying textContent directly.
 *
 * @param {Node} node - The current DOM node being processed.
 */
const walkTextNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const decodedText = decodeSpeak(node.textContent);
        if (decodedText !== node.textContent) {
            node.textContent = decodedText;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(walkTextNode);
    }
};

export default walkTextNode;
