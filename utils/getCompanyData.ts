import getGeminiApiKey from './getGeminiApiKey';
import getAllReviewsOfTheCompany from './getAllReviewsOfTheCompany';
import fetchCompanyContactInfoFromGemini from './fetchCompanyContactInfoFromGemini';
import fetchAiSummaryAndSentimentFromGemini from './fetchAiSummaryAndSentimentFromGemini';

/**
 * Fetches comprehensive data for a given company, including contact info,
 * AI-generated summaries, and sentiment. Uses caching to prevent duplicate API calls.
 * @param companyName - The name of the company.
 * @returns A promise that resolves to an object containing company details, English summary, and Bengali summary.
 */
const getCompanyData = async (companyName: string, companyDataCache) => {
    // Check cache first to avoid redundant API calls
    if (companyDataCache.has(companyName)) {
        return companyDataCache.get(companyName);
    }

    const geminiApiKey = await getGeminiApiKey();

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

export default getCompanyData;
