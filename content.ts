// Leet character map
const leetMap = new Map<string | RegExp, string>([
    [/1/g, 'l'],
    [/3/g, 'e'],
    [/4/g, 'a'],
    [/0/g, 'o'],
    [/7/g, 't'],
    [/\$/g, 's'],
    [/@/g, 'a'],
    [/5/g, 's'],
    [/!/g, 'i'],
    [/>k/gi, 'x'],
    [/\|\_?\|/gi, 'k'], // Matches "|_|", "||", "|_|"
]);

/**
 * Decode leet speak text to plain English.
 */
const decodeLeet = (text: string): string => {
    let result = text;
    for (const [pattern, replacement] of leetMap) {
        result = result.replace(pattern, replacement);
    }
    return result.replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

/**
 * Recursively decode all leet-speak in text nodes.
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

/**
 * Find all leet-encoded company names, decode them,
 * update the DOM, and insert a search link.
 */
const insertCompanyWebsite = async () => {
    const companySpans = document.querySelectorAll('.company-name');

    companySpans.forEach((companySpan) => {
        const innerSpan = companySpan.querySelector('span');
        if (!innerSpan || !innerSpan.textContent?.trim()) return;

        const leetText = innerSpan.textContent.trim();
        const decodedName = decodeLeet(leetText);
        innerSpan.textContent = decodedName;

        const searchQuery = encodeURIComponent(`${decodedName} official site`);
        const searchUrl = `https://duckduckgo.com/?q=${searchQuery}`;

        // Avoid duplicate links
        const parentDiv = companySpan.closest('div');
        if (!parentDiv || parentDiv.querySelector(`a[href="${searchUrl}"]`))
            return;

        // Create styled link with smaller icon
        const link = document.createElement('a');
        link.href = searchUrl;
        link.target = '_blank';
        link.className =
            'flex items-center gap-1 text-primary font-medium underline underline-offset-4 ml-3 hover:opacity-80 transition-colors';

        link.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" style="margin-left: 0.5rem; width: 1.2rem; height: 1.2rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 0c2 2 3 5 3 10s-1 8-3 10m0-20c-2 2-3 5-3 10s1 8 3 10m-7-10h14" />
            </svg>
            <span>Visit ${decodedName}</span>
        `;

        parentDiv.appendChild(link);
    });
};

// 1. Decode entire page
walk(document.body);

// 2. Decode company names and insert links
insertCompanyWebsite();
