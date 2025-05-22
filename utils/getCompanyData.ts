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
 * @param companyName - The name of the company.
 * @returns A promise that resolves to an object containing company details, English summary, and Bengali summary.
 */
const getCompanyData = async (companyName: string) => {
    // Try cache first
    const cached = loadFromStorage(companyName);
    if (cached) {
        return cached;
    }

    const geminiApiKey = await getGeminiApiKey();

    // Fetch all reviews for the company.
    const reviews = await getAllReviewsOfTheCompany(companyName);

    // Use Promise.all to concurrently fetch company contact info and AI summary/sentiment.
    const [details, { enSummary, bnSummary }, salaries] = await Promise.all([
        fetchCompanyContactInfoFromGemini(companyName),
        fetchAiSummaryAndSentimentFromGemini(geminiApiKey, reviews),
        fetchSalaryInfoFromGemini(companyName),
    ]);

    const jobs = await fetchJobOpeningsEnhanced(companyName, details || {});

    // Combine the fetched data into a single result object.
    const result = { details, enSummary, bnSummary, salaries, jobs };

    saveToStorage(companyName, result);

    return result;
};

export default getCompanyData;
