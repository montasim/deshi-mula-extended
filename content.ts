// Leet character map
const leetMap = new Map<string | RegExp, string>([
    [/1/g, 'i'],
    [/3/g, 'e'],
    [/4/g, 'a'],
    [/0/g, 'o'],
    [/7/g, 't'],
    [/\$/g, 's'],
    [/@/g, 'a'],
    [/5/g, 's'],
    [/!/g, 'i'],
    [/>k/gi, 'x'], // Specific replacement
    [/\|_|\<|\|/gi, 'k'], // Rough approximation for k
]);

/**
 * Decodes a leet speak string to plain English.
 * @param text The leet text to decode
 * @returns The decoded string
 */
const decodeLeet = (text: string): string => {
    let result = text;
    for (const [pattern, replacement] of leetMap) {
        result = result.replace(pattern, replacement);
    }

    // Capitalize each word
    result = result.replace(/\b[a-z]/g, (char) => char.toUpperCase());

    return result;
};

/**
 * Recursively walks the DOM and decodes text nodes.
 * @param node The DOM node to start from
 */
const walk = (node: Node): void => {
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
            walk(child);
        }
    }
};

// Start from document body
walk(document.body);
