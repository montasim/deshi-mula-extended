import decodeSpeak from './decodeSpeak';
import appendSocialBadges from './appendSocialBadges';
import initCompanyBadges from './initCompanyBadges';
import getCompanyData from './getCompanyData';

// Cache for API key and company data to prevent redundant calls
const processedElements = new WeakSet<HTMLElement>();

/**
 * Renders company contact links and social badges on hover for elements matching HOVER_SELECTOR.
 * Prevents multiple API calls and UI renderings through caching and element tracking.
 */
const renderCompanyContactLinks = () => {
    const HOVER_SELECTOR = '.company-name';
    const COMPANY_SELECTOR =
        'div.d-flex.my-2 > h4.badge.soft.fw-bold.me-2.font-14';
    const params = new URLSearchParams(window.location.search);
    const forcedTerm = params.get('SearchTerm');
    const storyPathRegex = /^\/story\/[0-9a-f]+$/;

    // if we're on a story page, only do the one‐time init
    if (storyPathRegex.test(window.location.pathname)) {
        initCompanyBadges(COMPANY_SELECTOR, 'visit-social-badge');

        // after your badges are in place:
        document
            .querySelectorAll<HTMLDivElement>('div.d-flex.my-2')
            .forEach((div) => {
                // find the first h4 inside
                const h4 = div.querySelectorAll<HTMLHeadingElement>('h4');
                h4.forEach((h) => {
                    if (h) {
                        h.style.marginBottom = '0';
                    }
                });
            });

        document
            .querySelectorAll<HTMLDivElement>('div.d-flex.my-2')
            .forEach((div) => {
                div.style.marginBottom = '2px';
            });

        return;
    }

    // If there's a forcedTerm, fetch its data once...
    if (forcedTerm) {
        getCompanyData(forcedTerm)
            .then(({ details, enSummary, bnSummary, salaries, jobs }) => {
                // ...and apply it to every matching element immediately
                document
                    .querySelectorAll<HTMLElement>(HOVER_SELECTOR)
                    .forEach(async (elem) => {
                        const raw = elem.textContent?.trim();
                        if (!raw) return;
                        const decoded = decodeSpeak(raw);
                        if (decoded !== forcedTerm) return;

                        // Update text & dataset
                        elem.textContent = decoded;
                        elem.dataset.decodedName = decoded;

                        const container = elem.closest('div');
                        if (!container) return;

                        // Append badges immediately
                        appendSocialBadges(
                            container,
                            'visit-social-badge',
                            details,
                            enSummary,
                            bnSummary,
                            decoded,
                            salaries,
                            jobs
                        );
                    });
            })
            .catch((err) =>
                console.error('Failed to load forcedTerm company data:', err)
            );

        // Done—no hover listeners needed when forcedTerm is used
        return;
    }

    // Otherwise, fall back to hover-per-element
    document.querySelectorAll<HTMLElement>(HOVER_SELECTOR).forEach((elem) => {
        if (!(elem instanceof HTMLElement) || processedElements.has(elem))
            return;

        const raw = elem.textContent?.trim();
        if (!raw) return;

        const decoded = decodeSpeak(raw);
        elem.textContent = decoded;
        elem.dataset.decodedName = decoded;

        const container = elem.closest('div');
        if (!container) return;

        processedElements.add(elem);
        let badgesRendered = false;
        let isLoading = false;

        const loadBadges = async () => {
            if (badgesRendered || isLoading) return;
            isLoading = true;
            try {
                const { details, enSummary, bnSummary, salaries, jobs } =
                    await getCompanyData(decoded);
                badgesRendered = true;
                appendSocialBadges(
                    container,
                    'visit-social-badge',
                    details,
                    enSummary,
                    bnSummary,
                    decoded,
                    salaries,
                    jobs
                );
            } catch (error) {
                console.error('Failed to load company info:', error);
            } finally {
                isLoading = false;
            }
        };

        elem.addEventListener('mouseenter', loadBadges);
    });
};

export default renderCompanyContactLinks;
