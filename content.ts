import CONSTANTS from './constants/constants';

import decodeSpeak from './utils/decodeSpeak';
import decodeSelected from './utils/decodeSelected';
import fetchCompanyContactInfoFromGemini from './utils/fetchCompanyContactInfoFromGemini';
import isValidURL from './utils/isValidURL';
import renderAiSummary from './utils/renderAiSummary';
import fetchAiSummaryFromGemini from './utils/fetchAiSummaryFromGemini';
import getGeminiApiKey from './utils/getGeminiApiKey';

const { SEARCH_ENGINE_URL, ICONS, SELECTORS_TO_DECODE, SITE_ROOT } = CONSTANTS;

/**
 * Append a simple badge element (non-link) for displaying vibe text.
 */
const appendVibeBadge = (container, text) => {
    if (!text || container.querySelector('.vibe-badge')) return;
    const span = document.createElement('span');
    span.className = 'vibe-badge';
    span.textContent = text;
    container.appendChild(span);
};

/**
 * Fetches reviews page, extracts reviews, and asks Gemini for an overall vibe.
 */
const fetchOverallVibe = async (company) => {
    try {
        const url = `${SITE_ROOT}/stories/1?SearchTerm=${encodeURIComponent(company)}&Vibe=0`;
        const res = await fetch(url);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Safely extract and trim review texts
        const reviews = Array.from(doc.querySelectorAll('.company-review'))
            .map((el) => el.textContent?.trim() ?? '')
            .filter((txt) => txt !== '');
        if (!reviews.length) return null;
        // Use your Gemini summary endpoint; assuming API_KEY available
        const summary = await fetchAiSummaryFromGemini(
            await getGeminiApiKey(),
            reviews
        );
        return summary;
    } catch {
        return null;
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
const appendBadgeLink = (
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
const renderCompanyContactLinks = () => {
    document
        .querySelectorAll<HTMLElement>('.company-name')
        .forEach((companyElem) => {
            const raw = companyElem.textContent?.trim();
            if (!raw) return;

            const decoded = decodeSpeak(raw);
            companyElem.textContent = decoded;
            companyElem.dataset.decodedName = decoded;

            const container = companyElem.closest('div');
            if (!container) return;

            // Add hover event to trigger badge visibility and fetch
            companyElem.addEventListener('mouseenter', async () => {
                // overall vibe badge
                const vibe = await fetchOverallVibe(decoded);
                if (vibe) {
                    appendVibeBadge(container, `Vibe: ${vibe}`);
                }

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
                const details =
                    await fetchCompanyContactInfoFromGemini(decoded);

                // Remove placeholder and update fetching status
                placeholder.remove();
                companyElem.dataset.fetching = 'false';
                companyElem.dataset.fetched = 'true';

                if (details.website && isValidURL(details.website)) {
                    appendBadgeLink(
                        container,
                        details.website,
                        ICONS.WEB,
                        null,
                        'visit-social-badge'
                    );
                } else {
                    const duckDuckGoUrl = `${SEARCH_ENGINE_URL}${encodeURIComponent(decoded + ' official site')}`;
                    appendBadgeLink(
                        container,
                        duckDuckGoUrl,
                        ICONS.SEARCH,
                        'DuckDuckGo Search',
                        'visit-badge'
                    );
                }

                if (details.linkedin)
                    appendBadgeLink(
                        container,
                        details.linkedin,
                        ICONS.LINKEDIN,
                        null,
                        'visit-social-badge'
                    );
                if (details.facebook)
                    appendBadgeLink(
                        container,
                        details.facebook,
                        ICONS.FACEBOOK,
                        null,
                        'visit-social-badge'
                    );
                if (details.github)
                    appendBadgeLink(
                        container,
                        details.github,
                        ICONS.GITHUB,
                        null,
                        'visit-social-badge'
                    );
                if (details.email)
                    appendBadgeLink(
                        container,
                        `mailto:${details.email}`,
                        ICONS.EMAIL,
                        null,
                        'visit-social-badge'
                    );
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
            const decoded = decodeSpeak(raw);
            badgeElem.textContent = decoded;

            // grab API data:
            const details = await fetchCompanyContactInfoFromGemini(decoded);

            // find a container to append into (adjust as needed):
            const container = badgeElem.closest('div');
            if (!container) return;

            // insert each link if present:
            if (details.website) {
                appendBadgeLink(
                    container,
                    details.website,
                    ICONS.WEB,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.linkedin) {
                appendBadgeLink(
                    container,
                    details.linkedin,
                    ICONS.LINKEDIN,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.facebook) {
                appendBadgeLink(
                    container,
                    details.facebook,
                    ICONS.FACEBOOK,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.github) {
                appendBadgeLink(
                    container,
                    details.github,
                    ICONS.GITHUB,
                    null,
                    'visit-story-social-badge'
                );
            }
            if (details.email) {
                appendBadgeLink(
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
                appendBadgeLink(
                    container,
                    ddg,
                    ICONS.SEARCH,
                    'Search',
                    'visit-badge'
                );
            }
        });
};

// Execute decoding and badge insertion on load
// Decode company names, post titles, and reviews on load
decodeSelected(SELECTORS_TO_DECODE);

// Decode company names and insert links
renderCompanyContactLinks();

/**
 * Remove any ad-related elements:
 *  • <iframe> with id starting "aswift"
 *  • Any element with id/class/label/aria-label containing "advertisement"
 */
const removeAdComponents = () => {
    document
        .querySelectorAll<HTMLElement>(
            [
                'iframe[id^="aswift"]',
                '[id*="advertisement" i]',
                '[class*="advertisement" i]',
                '[label*="advertisement" i]',
                '[aria-label*="advertisement" i]',
            ].join(',')
        )
        .forEach((el) => el.remove());
};

/**
 * Now your two entry points become trivial configurations
 */
renderAiSummary({
    itemSelector: '.commentText p',
    placeholderClass: 'ai-summary-box p-3 my-4',
    placeholderText: 'AI Analyzing Comments…',
    containerSelector: '#comments-section',
    buildProps: ({ summary, sentiment, translation, count }) => ({
        title: 'AI Comments Analysis',
        subtitle: `${
            sentiment === 'Positive'
                ? ICONS.POSITIVE
                : sentiment === 'Negative'
                  ? ICONS.NEGATIVE
                  : ICONS.MIXED
        } ${sentiment}`,
        description: `Analyzed ${count} comments.`,
        main: `
          <p><strong>Summary:</strong><br>${summary}</p>
          ${translation ? `<p><strong>Translation (বাংলা):</strong><br>${translation}</p>` : ''}
        `,
    }),
});

renderAiSummary({
    itemSelector: '.company-review',
    skipCondition: () =>
        window.location.pathname === '/' || window.location.pathname === '',
    placeholderClass: 'ai-summary-box p-3 my-4',
    placeholderText: 'AI Analyzing Reviews…',
    containerSelector: '.container.mt-5',
    buildProps: ({ summary, sentiment, translation, count }) => ({
        title: 'AI Review Summary',
        subtitle: `${
            sentiment === 'Positive'
                ? ICONS.POSITIVE
                : sentiment === 'Negative'
                  ? ICONS.NEGATIVE
                  : ICONS.MIXED
        } ${sentiment}`,
        description: `Summarized ${count} reviews in English and translated with Gemini.`,
        main: `
          <p><strong>English:</strong> ${summary}</p>
          ${translation ? `<p><strong>Bangla:</strong> ${translation}</p>` : ''}
        `,
    }),
});

const observer = new MutationObserver(removeAdComponents);
observer.observe(document.body, { childList: true, subtree: true });
