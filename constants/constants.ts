/**
 * A Map of leet speak patterns to their decoded replacements.
 * Includes both regular expressions and string mappings.
 *
 * @constant {Map<string | RegExp, string>}
 */
const LEET_SPEAK_MAP = new Map<string | RegExp, string>([
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
    '.k-master-row a',
    'td > a.k-link.text-primary.fw-semibold',
    'a.k-link.text-primary.fw-semibold',
    'tr.k-master-row td > a.k-link.text-primary.fw-semibold',
    '.col-12 h3',
];

/**
 * The endpoint for Google Cloud's Gemini API.
 */
const GEMINI_FLASH_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SITE_ROOT = 'https://deshimula.com';

const CONSTANTS = {
    LEET_SPEAK_MAP,
    SEARCH_ENGINE_URL,
    ICONS,
    SELECTORS_TO_DECODE,
    GEMINI_FLASH_API_URL,
    SITE_ROOT,
};

export default CONSTANTS;
