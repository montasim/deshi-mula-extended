import decodeSpeak from './decodeSpeak';
import fetchAndShowBadges from './fetchAndShowBadges';
import fetchCompanyContactInfoFromGemini from './fetchCompanyContactInfoFromGemini';
import fetchAiSummaryAndSentimentFromGemini from './fetchAiSummaryAndSentimentFromGemini';
import appendSocialBadges from './appendSocialBadges';
import getGeminiApiKey from './getGeminiApiKey';

// Cache for API key and company data to prevent redundant calls
let geminiApiKey: string | null = null;
const companyDataCache = new Map<string, any>();
const processedElements = new WeakSet<HTMLElement>();

/**
 * Fetches all reviews for a given company from a specific URL.
 * @param company - The name of the company to fetch reviews for.
 * @returns A promise that resolves to an array of review strings.
 */
const getAllReviewsOfTheCompany = async (
    company: string
): Promise<string[]> => {
    // Construct the URL for fetching company reviews.
    const url = `/stories/1?SearchTerm=${encodeURIComponent(company)}&Vibe=0`;
    // Fetch the HTML content from the URL.
    const res = await fetch(url);
    const html = await res.text();
    // Parse the HTML string into a DOM document.
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Select all elements with the class 'company-review', extract their text content,
    // trim whitespace, and filter out empty strings.
    const reviews = Array.from(doc.querySelectorAll('.company-review'))
        .map((el) => el.textContent?.trim() ?? '')
        .filter((txt) => txt !== '');

    return reviews;
};

/**
 * Fetches comprehensive data for a given company, including contact info,
 * AI-generated summaries, and sentiment. Uses caching to prevent duplicate API calls.
 * @param companyName - The name of the company.
 * @returns A promise that resolves to an object containing company details, English summary, and Bengali summary.
 */
const getCompanyData = async (companyName: string) => {
    // Check cache first to avoid redundant API calls
    if (companyDataCache.has(companyName)) {
        return companyDataCache.get(companyName);
    }

    // Ensure the Gemini API key is available.
    if (!geminiApiKey) {
        geminiApiKey = await getGeminiApiKey();
    }

    // Fetch all reviews for the company.
    const reviews = await getAllReviewsOfTheCompany(companyName);

    // Use Promise.all to concurrently fetch company contact info and AI summary/sentiment.
    const [details, { enSummary, bnSummary }] = await Promise.all([
        fetchCompanyContactInfoFromGemini(companyName),
        fetchAiSummaryAndSentimentFromGemini(geminiApiKey, reviews),
    ]);

    // Combine the fetched data into a single result object.
    const result = { details, enSummary, bnSummary };

    // Cache the result to prevent future API calls for the same company
    companyDataCache.set(companyName, result);

    return result;
};

/**
 * Renders company contact links and social badges on hover for elements matching HOVER_SELECTOR.
 * Prevents multiple API calls and UI renderings through caching and element tracking.
 */
const renderCompanyContactLinks = () => {
    const HOVER_SELECTOR = '.company-name';

    // Iterate over all elements that match the HOVER_SELECTOR.
    document.querySelectorAll<HTMLElement>(HOVER_SELECTOR).forEach((elem) => {
        // Ensure the element is an HTMLElement and hasn't been processed yet.
        if (!(elem instanceof HTMLElement) || processedElements.has(elem))
            return;

        // Get and trim the raw text content of the element.
        const raw = elem.textContent?.trim();
        if (!raw) return;

        // Decode the company name and update the element's text content and dataset.
        const decoded = decodeSpeak(raw);
        elem.textContent = decoded;
        elem.dataset.decodedName = decoded;

        // Find the closest parent div container.
        const container = elem.closest('div');
        if (!container) return;

        // Mark this element as processed to prevent duplicate event listeners
        processedElements.add(elem);

        // Track if badges have been rendered for this element
        let badgesRendered = false;
        let isLoading = false;

        // Add a mouseenter event listener to the element.
        elem.addEventListener('mouseenter', async () => {
            // Prevent multiple simultaneous API calls or re-rendering
            if (badgesRendered || isLoading) return;

            // Set loading flag to prevent concurrent calls
            isLoading = true;

            try {
                // Fetch company data (uses cache if available)
                const data = await getCompanyData(decoded);
                const { details, enSummary, bnSummary } = data;

                // Only render if badges haven't been rendered yet
                if (!badgesRendered) {
                    // Append social badges to the container with the fetched data.
                    appendSocialBadges(
                        container,
                        details,
                        enSummary,
                        bnSummary,
                        decoded
                    );

                    // Mark badges as rendered to prevent future renderings
                    badgesRendered = true;

                    // Fetch and show additional badges (if any) based on the element and container.
                    fetchAndShowBadges(elem, container);
                }
            } catch (error) {
                // Log any errors that occur during the data loading process.
                console.error('Failed to load company info:', error);
            } finally {
                // Reset loading flag
                isLoading = false;
            }
        });
    });
};

export default renderCompanyContactLinks;
