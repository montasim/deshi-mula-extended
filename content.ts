/**
 * A Map of leet speak patterns to their decoded replacements.
 * Includes both regular expressions and string mappings.
 *
 * @constant {Map<string | RegExp, string>}
 */
const LEET_CHARACTER_MAP = new Map<string | RegExp, string>([
    // multi-char / special first
    [/></g, 'x'], // you already had Technone><T → TechnonextT
    [/>\s*k/gi, 'x'],
    [/\|_?\|/gi, 'k'], // |_| or || → k

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

/**
 * The base URL for the search engine to generate company website links.
 *
 * @constant {string}
 */
const SEARCH_ENGINE_URL = 'https://duckduckgo.com/?q=' as const;

/**
 * SVG icons for web links and sentiment badges.
 *
 * @constant {Object}
 */
const ICONS = {
    /**
     * SVG icon for website links.
     *
     * @type {string}
     */
    WEB: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',

    /**
     * SVG icon for positive sentiment (thumbs-up).
     *
     * @type {string}
     */
    POSITIVE:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up-icon lucide-thumbs-up"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',

    /**
     * SVG icon for negative sentiment (thumbs-down).
     *
     * @type {string}
     */
    NEGATIVE:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down-icon lucide-thumbs-down"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>',

    /**
     * SVG icon for mixed sentiment (up/down arrows).
     *
     * @type {string}
     */
    MIXED: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flip-vertical2-icon lucide-flip-vertical-2"><path d="m17 3-5 5-5-5h10"/><path d="m17 21-5-5-5 5h10"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>',

    /**
     * SVG icon for email links.
     *
     * @type {string}
     */
    LINKEDIN:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin-icon lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',

    /**
     * SVG icon for github links.
     *
     * @type {string}
     */
    GITHUB: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',

    /**
     * SVG icon for facebook links.
     *
     * @type {string}
     */
    FACEBOOK:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook-icon lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',

    /**
     * SVG icon for email address.
     *
     * @type {string}
     */
    EMAIL: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',

    /**
     * SVG icon for search.
     *
     * @type {string}
     */
    SEARCH: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-icon lucide-search"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
} as const;

/**
 * CSS selectors for elements containing leet-speak text to decode.
 *
 * @constant {string[]}
 */
const SELECTORS_TO_DECODE = [
    '.company-name span',
    '.post-title',
    '.company-review',
    '.badge h4',
    'h4.badge',
    'td > a.k-link.text-primary.fw-semibold',
    'a.k-link.text-primary.fw-semibold',
    'tr.k-master-row td > a.k-link.text-primary.fw-semibold',
    '.col-12 h3',
];

/**
 * The endpoint for Google Cloud's Gemini API.
 */
const GEMINI_FLASH_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Supported text casing styles.
 */
type TCaseStyle = 'sentence' | 'title' | 'upper';

/**
 * Interface representing company details.
 */
interface CompanyDetails {
    website?: string;
    linkedin?: string;
    facebook?: string;
    github?: string;
    email?: string;
}

/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase).
 *
 * @param {string} str - The input string.
 * @returns {string} The string in sentence case.
 */
const toSentenceCase = (str: string): string => {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts a string to title case (first letter of each word capitalized).
 *
 * @param {string} str - The input string.
 * @returns {string} The string in title case.
 */
const toTitleCase = (str: string): string =>
    str.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Decodes leet-speak text to plain English and applies the specified casing.
 *
 * @param {string} text - The leet-speak input string.
 * @param {TCaseStyle} [style='title'] - The casing style ('sentence', 'title', or 'upper').
 * @returns {string} The decoded string with applied casing.
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
 * Recursively walks through DOM nodes and decodes leet-speak in text nodes.
 * Preserves original font styling by modifying textContent directly.
 *
 * @param {Node} node - The current DOM node being processed.
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
 * Decodes leet-speak text for elements matching the provided selectors.
 * Adds mouseenter/mouseleave event listeners to show/hide badges.
 *
 * @param {string | string[]} selectors - A single selector or array of selectors.
 */
const decodeSelected = (selectors: string | string[]): void => {
    // Normalize to a comma-separated string so querySelectorAll runs only once
    const sel = Array.isArray(selectors) ? selectors.join(',') : selectors;

    document.querySelectorAll<HTMLElement>(sel).forEach(walkTextNode);
};

const getApiKey = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['apiKey'], (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result.apiKey);
        });
    });
};

/**
 * Queries the Gemini Flash API for a company’s details and parses the JSON response.
 *
 * Sends a POST to the Gemini endpoint asking **only** for a JSON object of the form
 * `{ website: string, linkedin: string, facebook: string, github: string }`, then
 * strips any stray Markdown fences and parses it.
 *
 * @param {string} name - The exact name of the company to look up.
 * @returns {Promise<CompanyDetails>} An object containing any of:
 *   - `website` (string URL of the company’s official site),
 *   - `linkedin` (string URL of LinkedIn profile),
 *   - `facebook` (string URL of Facebook page),
 *   - `github` (string URL of GitHub org/user).
 *   - `email` (string URL of Email org/user).
 *   If the fetch fails or the response can’t be parsed, returns an empty object.
 */
const fetchCompanyDetailsViaGemini = async (
    name: string
): Promise<CompanyDetails> => {
    const res = await fetch(
        `${GEMINI_FLASH_ENDPOINT}?key=${await getApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: [
                                    `For the company named "${name}", respond with ONLY the JSON object below—`,
                                    'no markdown, no code fences, nothing else:',
                                    '{"website":"…","linkedin":"…","facebook":"…","github":"…","email":"…"}',
                                ].join(' '),
                            },
                        ],
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        console.error('Gemini API error', await res.text());
        return {};
    }

    const { candidates } = (await res.json()) as any;
    let message = (candidates?.[0]?.content?.parts?.[0]?.text as string) || '';

    // strip ```json and ``` if they slipped through
    message = message
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim();

    try {
        return JSON.parse(message) as CompanyDetails;
    } catch (e) {
        console.warn('Failed to parse JSON from Gemini reply:', message);
        return {};
    }
};

/**
 * Checks whether a given string is a well-formed URL.
 *
 * @param {string} string - The URL string to validate.
 * @returns {boolean} True if the string is a valid URL; false otherwise.
 */
const isValidURL = (string: string): boolean => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

/**
 * Appends a link element (badge) to the specified container if the URL is valid
 * and not already present.
 *
 * @param {HTMLElement} container - The DOM element to which the link will be appended.
 * @param {string} url - The URL to normalize and set as the link's href.
 * @param {string} iconSvg - An SVG string representing the icon to display inside the link.
 * @param {string | null} [label=null] - Optional text label to display alongside the icon.
 * @param {string} [className='visit-badge'] - CSS class to apply to the link element.
 */
const addLinkElement = (
    container: HTMLElement,
    url: string,
    iconSvg: string,
    label: string | null = null,
    className: string = 'visit-badge'
) => {
    // Skip if URL is missing or already exists
    if (!url || container.querySelector(`a[href="${url}"]`)) return;

    // Normalize URL and validate
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Optional: Validate URL format before proceeding
    if (!isValidURL(normalizedUrl)) return;

    // Create and configure link
    const a = document.createElement('a');
    a.href = normalizedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = className;
    a.innerHTML = label ? `${iconSvg}<span>${label}</span>` : iconSvg;

    // Append to DOM
    container.appendChild(a);
};

/**
 * Finds company names encoded in leet-speak, decodes them, updates the DOM,
 * and inserts social media and website links that appear on hover and stay visible.
 */
const insertCompanyWebsite = () => {
    document
        .querySelectorAll<HTMLElement>('.company-name')
        .forEach((companyElem) => {
            const raw = companyElem.textContent?.trim();
            if (!raw) return;

            const decoded = decodeLeet(raw);
            companyElem.textContent = decoded;
            companyElem.dataset.decodedName = decoded;

            const container = companyElem.closest('div');
            if (!container) return;

            // Add hover event to trigger badge visibility and fetch
            companyElem.addEventListener('mouseenter', async () => {
                // Show existing badges by removing .hidden
                container
                    .querySelectorAll<HTMLElement>(
                        '.visit-badge, .visit-social-badge, .sentiment-badge'
                    )
                    .forEach((badge) => badge.classList.remove('hidden'));

                // Skip if already fetching or fetched
                if (
                    companyElem.dataset.fetching === 'true' ||
                    companyElem.dataset.fetched === 'true'
                ) {
                    return;
                }

                // Mark as fetching and show placeholder
                companyElem.dataset.fetching = 'true';
                const placeholder = document.createElement('span');
                placeholder.className = 'searching-text';
                placeholder.textContent = 'Searching…';
                container.appendChild(placeholder);

                // Fetch company details
                const details = await fetchCompanyDetailsViaGemini(decoded);

                // Remove placeholder and update fetching status
                placeholder.remove();
                companyElem.dataset.fetching = 'false';
                companyElem.dataset.fetched = 'true';

                if (details.website && isValidURL(details.website)) {
                    addLinkElement(
                        container,
                        details.website,
                        ICONS.WEB,
                        null,
                        'visit-social-badge'
                    );
                } else {
                    const duckDuckGoUrl = `${SEARCH_ENGINE_URL}${encodeURIComponent(decoded + ' official site')}`;
                    addLinkElement(
                        container,
                        duckDuckGoUrl,
                        ICONS.SEARCH,
                        'DuckDuckGo Search',
                        'visit-badge'
                    );
                }

                if (details.linkedin)
                    addLinkElement(
                        container,
                        details.linkedin,
                        ICONS.LINKEDIN,
                        null,
                        'visit-social-badge'
                    );
                if (details.facebook)
                    addLinkElement(
                        container,
                        details.facebook,
                        ICONS.FACEBOOK,
                        null,
                        'visit-social-badge'
                    );
                if (details.github)
                    addLinkElement(
                        container,
                        details.github,
                        ICONS.GITHUB,
                        null,
                        'visit-social-badge'
                    );
                if (details.email)
                    addLinkElement(
                        container,
                        `mailto:${details.email}`,
                        ICONS.EMAIL,
                        null,
                        'visit-social-badge'
                    );

                // If no data at all, show a research button to retry manually
                if (!Object.values(details).some(Boolean)) {
                    const researchBtn = document.createElement('button');
                    researchBtn.className = 'research-button';
                    researchBtn.textContent = '🔍 Research Manually';
                    researchBtn.title =
                        'Try searching again or view more options';

                    researchBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();

                        // Clear previous badges except the research button itself
                        container
                            .querySelectorAll(
                                '.visit-social-badge, .searching-text'
                            )
                            .forEach((el) => el.remove());

                        // Placeholder again
                        container.appendChild(placeholder);
                        companyElem.dataset.fetching = 'true';

                        // Retry fetching
                        const newDetails =
                            await fetchCompanyDetailsViaGemini(decoded);

                        placeholder.remove();
                        companyElem.dataset.fetching = 'false';

                        if (newDetails.website)
                            addLinkElement(
                                container,
                                newDetails.website,
                                ICONS.WEB,
                                null,
                                'visit-social-badge'
                            );
                        if (newDetails.linkedin)
                            addLinkElement(
                                container,
                                newDetails.linkedin,
                                ICONS.LINKEDIN,
                                null,
                                'visit-social-badge'
                            );
                        if (newDetails.facebook)
                            addLinkElement(
                                container,
                                newDetails.facebook,
                                ICONS.FACEBOOK,
                                null,
                                'visit-social-badge'
                            );
                        if (newDetails.github)
                            addLinkElement(
                                container,
                                newDetails.github,
                                ICONS.GITHUB,
                                null,
                                'visit-social-badge'
                            );
                        if (newDetails.email)
                            addLinkElement(
                                container,
                                `mailto:${newDetails.email}`,
                                ICONS.EMAIL,
                                null,
                                'visit-social-badge'
                            );

                        if (!Object.values(newDetails).some(Boolean)) {
                            const noResult = document.createElement('span');
                            noResult.className = 'no-result-text';
                            noResult.textContent = 'No results found.';
                            container.appendChild(noResult);
                        }
                    });

                    container.appendChild(researchBtn);
                }
            });
        });

    // 1) Define which badges should always show company info:
    const ALWAYS_SHOW = 'h4.soft.fw-bold.me-2.font-14';

    // 2) On load, decode them and immediately fetch+insert links:
    document
        .querySelectorAll<HTMLElement>(ALWAYS_SHOW)
        .forEach(async (badgeElem) => {
            const raw = badgeElem.textContent?.trim();
            if (!raw) return;

            // decode leet-speak (optional):
            const decoded = decodeLeet(raw);
            badgeElem.textContent = decoded;

            // grab API data:
            const details = await fetchCompanyDetailsViaGemini(decoded);

            // find a container to append into (adjust as needed):
            const container = badgeElem.closest('div');
            if (!container) return;

            // insert each link if present:
            if (details.website) {
                addLinkElement(
                    container,
                    details.website,
                    ICONS.WEB,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.linkedin) {
                addLinkElement(
                    container,
                    details.linkedin,
                    ICONS.LINKEDIN,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.facebook) {
                addLinkElement(
                    container,
                    details.facebook,
                    ICONS.FACEBOOK,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.github) {
                addLinkElement(
                    container,
                    details.github,
                    ICONS.GITHUB,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.email) {
                addLinkElement(
                    container,
                    `mailto:${details.email}`,
                    ICONS.EMAIL,
                    null,
                    'visit-story-social-badge'
                );
            }

            // fallback: if nothing found, you could add a DuckDuckGo search badge
            if (!Object.values(details).some(Boolean)) {
                const ddg = `${SEARCH_ENGINE_URL}${encodeURIComponent(decoded + ' official site')}`;
                addLinkElement(
                    container,
                    ddg,
                    ICONS.SEARCH,
                    'Search',
                    'visit-badge'
                );
            }
        });
};

/**
 * Inserts a sentiment badge (Positive/Negative/Mixed) next to other badges
 * based on vote counts. Badges are initially hidden.
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
            badge.classList.add('sentiment-badge', cls, 'hidden'); // Initially hidden
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

/**
 * Main entry: inserts placeholder, runs AI analysis (summary, sentiment, translation),
 * and replaces placeholder with results above the comments section.
 */
const analyzeComments = async () => {
    const commentsSection = document.getElementById('comments-section');
    if (!commentsSection) return;

    // 1) Insert placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'ai-analysis-placeholder';
    placeholder.textContent = 'Analyzing AI…';
    commentsSection.parentNode!.insertBefore(placeholder, commentsSection);

    // 2) Collect comment texts
    const comments = Array.from(
        document.querySelectorAll<HTMLParagraphElement>('.commentText p')
    )
        .map((p) => p.textContent)
        .filter((txt): txt is string => !!txt && txt.trim() !== '')
        .map((txt) => txt.trim());
    if (comments.length === 0) {
        placeholder.textContent = 'No comments to analyze.';
        return;
    }

    // 3) Perform all AI calls in parallel
    const [summary, sentiment] = await Promise.all([
        getAiSummary(comments).catch(() => 'Summary failed.'),
        getAiSentiment(comments).catch(() => 'Unknown'),
    ]);

    // 4) Detect language and translate
    const isBangla = /[\u0980-\u09FF]/.test(summary);
    const targetLang = isBangla ? 'English' : 'Bangla';
    const translation = await translateText(summary, targetLang).catch(
        () => `Translation to ${targetLang} failed.`
    );

    // 5) Build final analysis block
    const container = document.createElement('div');
    container.className = 'ai-summary-display';
    container.innerHTML = `
    <h5>AI Comments Analysis</h5>
    <p>
        <strong>Overall Sentiment:</strong> 
        ${
            sentiment === 'Positive'
                ? ICONS.POSITIVE
                : sentiment === 'Negative'
                  ? ICONS.NEGATIVE
                  : ICONS.MIXED
        } ${sentiment} 
    </p>
    <hr>
    <p><strong>Summary (${isBangla ? 'বাংলা' : 'English'}):</strong><br>${summary}</p>
    <p><strong>Translation (${targetLang}):</strong><br>${translation}</p>
  `;

    // 6) Replace placeholder with final results
    placeholder.replaceWith(container);
};

/**
 * Generate a concise overall summary of the given comments via Gemini Flash.
 *
 * @param comments - Array of comment strings to summarize
 * @returns The AI-generated summary text
 * @throws If the network request fails or returns non-OK
 */
const getAiSummary = async (comments: string[]): Promise<string> => {
    const prompt = `Please provide a concise overall summary of these comments:\n\n${comments.join('\n\n')}\n\nSummary:`;
    const res = await fetch(
        `${GEMINI_FLASH_ENDPOINT}?key=${await getApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    return candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
};

/**
 * Translate given text into the specified language via Gemini Flash.
 *
 * @param text - The source text to translate
 * @param to - Target language: 'English' or 'Bangla'
 * @returns The translated text
 * @throws If the network request fails or returns non-OK
 */
const translateText = async (
    text: string,
    to: 'English' | 'Bangla'
): Promise<string> => {
    const prompt = `Translate the following text into ${to}:\n\n${text}\n\nTranslation:`;
    const res = await fetch(
        `${GEMINI_FLASH_ENDPOINT}?key=${await getApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    return candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
};

/**
 * Classify overall sentiment of comments as Positive, Negative, or Mixed via Gemini Flash.
 *
 * @param comments - Array of comment strings to analyze
 * @returns 'Positive', 'Negative', or 'Mixed'
 * @throws If the network request fails or returns non-OK
 */
const getAiSentiment = async (
    comments: string[]
): Promise<'Positive' | 'Negative' | 'Mixed'> => {
    const prompt = `Given these comments, classify the overall sentiment as Positive, Negative, or Mixed:\n\n${comments.join('\n\n')}\n\nSentiment:`;
    const res = await fetch(
        `${GEMINI_FLASH_ENDPOINT}?key=${await getApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    const label = candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
    if (/positive/i.test(label)) return 'Positive';
    if (/negative/i.test(label)) return 'Negative';
    return 'Mixed';
};

const aiReviewSummary = async () => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
        console.log('Skipping AI summary on root');
        return;
    }

    // 1. Collect all review texts
    const reviews = Array.from(document.querySelectorAll('.company-review'))
        .map((el) => el.textContent?.trim() ?? '')
        .filter((text) => text.length > 0);
    if (!reviews.length) return;

    // 2. Insert a placeholder box
    const placeholder = document.createElement('div');
    placeholder.className = 'ai-summary-box p-3 my-4';
    placeholder.textContent = 'Analyzing reviews…';
    const firstContainer = document.querySelector('.container.mt-5');
    if (firstContainer && firstContainer.parentNode) {
        firstContainer.parentNode.insertBefore(placeholder, firstContainer);
    }

    // 3. Run all AI calls in sequence
    let engSummary: string, bnSummary: string, sentiment: string;
    try {
        engSummary = await getAiSummary(reviews);
    } catch {
        engSummary = 'English summary unavailable';
    }

    try {
        bnSummary = await translateText(engSummary, 'Bangla');
    } catch {
        bnSummary = 'Bangla translation unavailable';
    }

    try {
        sentiment = await getAiSentiment(reviews);
    } catch {
        sentiment = 'Sentiment unavailable';
    }

    // 4. Replace placeholder with the real summary + translation + sentiment
    placeholder.innerHTML = `
    <h4>AI-Generated Review Summary</h4>
    <p><strong>English:</strong> ${engSummary}</p>
    <p><strong>Bangla:</strong> ${bnSummary}</p>
    <p><strong>Sentiment:</strong> ${
        sentiment === 'Positive'
            ? ICONS.POSITIVE
            : sentiment === 'Negative'
              ? ICONS.NEGATIVE
              : ICONS.MIXED
    } ${sentiment} </p>
    <p><em>Total reviews analyzed: ${reviews.length}</em></p>
  `;
};

// Execute decoding and badge insertion on load
// Decode company names, post titles, and reviews on load
decodeSelected(SELECTORS_TO_DECODE);

// Decode company names and insert links
insertCompanyWebsite();

// Insert sentiment badges
// insertSentimentBadges();

// Add AI Summary button
analyzeComments();

aiReviewSummary();
