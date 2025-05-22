import getGeminiApiKey from './getGeminiApiKey';
import getAllReviewsOfTheCompany from './getAllReviewsOfTheCompany';
import fetchCompanyContactInfoFromGemini from './fetchCompanyContactInfoFromGemini';
import fetchAiSummaryAndSentimentFromGemini from './fetchAiSummaryAndSentimentFromGemini';
import fetchSalaryInfoFromGemini from './fetchSalaryInfoFromGemini';
import fetchJobOpeningsEnhanced from './fetchJobOpeningsFromWebsite';
import loadFromStorage from './loadFromStorage';
import saveToStorage from './saveToStorage';

/**
 * Fetches comprehensive data for a given company, including contact info,
 * AI-generated summaries, and sentiment. Uses caching to prevent duplicate API calls.
 * Shows a temporary 'Searching...' indicator in the provided container.
 * @param companyName - The name of the company.
 * @param container - The HTMLElement to show the searching indicator in.
 * @returns A promise that resolves to an object containing company details, English summary, and Bengali summary.
 */
const getCompanyData = async (companyName: string, container: HTMLElement) => {
    // Show temporary search text
    const searchingText = document.createElement('span');
    searchingText.textContent = 'Searching...';
    searchingText.classList.add('searching-text');
    container.appendChild(searchingText);

    try {
        // Try cache first
        const cached = loadFromStorage(companyName);
        if (cached) {
            return cached;
        }

        const geminiApiKey = await getGeminiApiKey();

        // Fetch all reviews for the company.
        const reviews = await getAllReviewsOfTheCompany(companyName);

        // Use Promise.all to concurrently fetch contact info and AI summary/sentiment.
        const [details, { enSummary, bnSummary }, salaries] = await Promise.all(
            [
                fetchCompanyContactInfoFromGemini(companyName),
                fetchAiSummaryAndSentimentFromGemini(geminiApiKey, reviews),
                fetchSalaryInfoFromGemini(companyName),
            ]
        );

        const jobs = await fetchJobOpeningsEnhanced(companyName, details || {});

        const result = { details, enSummary, bnSummary, salaries, jobs };
        saveToStorage(companyName, result);

        return result;
    } finally {
        // Remove the temporary search indicator
        searchingText.remove();
    }
};

export default getCompanyData;
