const LEET_CHARACTER_MAP = new Map<string | RegExp, string>([
    // multi-char / special first
    [/></g, 'x'], // you already had Technone><T → TechnonextT
    [/>\s*k/gi, 'x'],
    [/\|\_?\|/gi, 'k'], // |_| or || → k

    // now the new ones:
    [/</g, 'k'], // l< → lk (BackVenture, Ranl< → Rank)
    [/8/g, 'b'], // 8etopia → betopia

    // then your old digit mappings:
    [/2/g, 's'],
    [/1/g, 'l'],
    [/3/g, 'e'],
    [/4/g, 'a'],
    [/5/g, 's'],
    [/6/g, 'a'],
    [/0/g, 'o'],
    [/7/g, 't'],

    // symbols
    [/\$/g, 's'],
    [/@/g, 'a'],
    [/!/g, 'i'],
]);
const SEARCH_ENGINE_URL = 'https://duckduckgo.com/?q=';
const ICONS = {
    WEB: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',

    // 👍 thumb-up icon
    POSITIVE:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up-icon lucide-thumbs-up"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',

    // 👎 thumb-down icon
    NEGATIVE:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down-icon lucide-thumbs-down"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>',

    // ↕️ mixed: up+down arrows
    MIXED: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flip-vertical2-icon lucide-flip-vertical-2"><path d="m17 3-5 5-5-5h10"/><path d="m17 21-5-5-5 5h10"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>',
};
const SELECTORS_TO_DECODE = [
    '.company-name span',
    '.post-title',
    '.company-review',
    '.badge h4',
    'h4.badge',
    'td > a.k-link.text-primary.fw-semibold',
    'a.k-link.text-primary.fw-semibold',
    'tr.k-master-row td > a.k-link.text-primary.fw-semibold',
];

type TCaseStyle = 'sentence' | 'title' | 'upper';

const toSentenceCase = (str: string): string => {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const toTitleCase = (str: string): string =>
    str.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Decode leet speak text to plain English, then apply casing.
 *
 * @param text    The input leet-speak string
 * @param style   'sentence' | 'title' | 'upper' (defaults to 'title')
 */
const decodeLeet = (text: string, style: TCaseStyle = 'title'): string => {
    let result = text;

    // 1) first replace all the leet patterns
    for (const [pattern, repl] of LEET_CHARACTER_MAP) {
        result = result.replace(pattern, repl);
    }

    // 2) apply the requested casing
    switch (style) {
        case 'sentence':
            return toSentenceCase(result);
        case 'upper':
            return result.toUpperCase();
        case 'title':
        default:
            return toTitleCase(result);
    }
};

/**
 * Recursively decode all leet-speak in text nodes,
 * but *preserve* the original font style by simply updating
 * the textContent in place rather than swapping in a new <span>.
 */
const walkTextNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const decodedText = decodeLeet(node.textContent);
        if (decodedText !== node.textContent) {
            node.textContent = decodedText;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(walkTextNode);
    }
};

/**
 * Decode text nodes for one or more selectors in a single pass.
 * @param selectors  A selector string or array of selector strings
 */
const decodeSelected = (selectors: string | string[]): void => {
    // Normalize to a comma-separated string so querySelectorAll runs only once
    const sel = Array.isArray(selectors) ? selectors.join(',') : selectors;

    document.querySelectorAll<HTMLElement>(sel).forEach(walkTextNode);
};

/**
 * Find all leet-encoded company names, decode them,
 * update the DOM, and insert a search link.
 */
const insertCompanyWebsite = () => {
    document
        .querySelectorAll<HTMLElement>('.company-name')
        .forEach((companyElem) => {
            const raw = companyElem.textContent?.trim();
            if (!raw) return;

            const decoded = decodeLeet(raw);
            companyElem.textContent = decoded;

            const container = companyElem.closest('div');
            if (!container) return;

            // --- Official site search ---
            const siteUrl = `${SEARCH_ENGINE_URL}${encodeURIComponent(decoded + ' official site')}`;
            if (!container.querySelector(`a[href="${siteUrl}"]`)) {
                const siteLink = document.createElement('a');
                siteLink.href = siteUrl;
                siteLink.target = '_blank';
                siteLink.classList.add('visit-badge');
                siteLink.innerHTML = `
                  ${ICONS.WEB}
                  Visit ${decoded}
                `;
                container.appendChild(siteLink);
            }
        });
};

/**
 * Insert a sentiment badge (Positive/Negative/Mixed)
 * next to the other badges based on up/down vote counts.
 */
const insertSentimentBadges = () => {
    document
        .querySelectorAll<HTMLElement>('.container.mt-5 > .row')
        .forEach((row) => {
            const header = row.querySelector<HTMLElement>(
                '.d-flex.flex-wrap.align-items-center'
            );
            const footer = row.querySelectorAll<HTMLElement>('.col-12')[1];
            if (!header || !footer) return;

            let up = 0,
                down = 0;
            footer.querySelectorAll<HTMLElement>('.fw-bold').forEach((div) => {
                const d =
                    div.querySelector('svg path')?.getAttribute('d') || '';
                const n = parseInt(div.textContent || '0', 10);
                if (d.startsWith('M9.27787')) up = n;
                else if (d.startsWith('M13.2937')) down = n;
            });

            let sentiment = 'Mixed',
                cls = 'sentiment-mixed';
            if (up > down) {
                sentiment = 'Positive';
                cls = 'sentiment-positive';
            } else if (down > up) {
                sentiment = 'Negative';
                cls = 'sentiment-negative';
            }

            if (header.querySelector(`.sentiment-badge.${cls}`)) return;

            const badge = document.createElement('div');
            badge.classList.add('sentiment-badge', cls);
            badge.innerHTML = `
                ${
                    sentiment === 'Positive'
                        ? ICONS.POSITIVE
                        : sentiment === 'Negative'
                          ? ICONS.NEGATIVE
                          : ICONS.MIXED
                }
                    <span>${sentiment}</span>
                  `;
            header.appendChild(badge);
        });
};

// Decode company names, post titles *and* reviews on load:
// decodeSelected('.company-name span');
// decodeSelected('.post-title');
// decodeSelected('.company-review');
// decodeSelected('.badge h4');
// decodeSelected('h4.badge');
// decodeSelected('td > a.k-link.text-primary.fw-semibold');
// decodeSelected('a.k-link.text-primary.fw-semibold');
// decodeSelected('tr.k-master-row td > a.k-link.text-primary.fw-semibold');

decodeSelected(SELECTORS_TO_DECODE);

// Decode company names and insert links
insertCompanyWebsite();

insertSentimentBadges();
