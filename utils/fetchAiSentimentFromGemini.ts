import CONSTANTS from '../constants/constants';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

/**
 * Classify overall sentiment of comments as Positive, Negative, or Mixed via Gemini Flash.
 *
 * @param apiKey
 * @param comments - Array of comment strings to analyze
 * @returns 'Positive', 'Negative', or 'Mixed'
 * @throws If the network request fails or returns non-OK
 */
const fetchAiSentimentFromGemini = async (
    apiKey: string,
    comments: string[]
): Promise<'Positive' | 'Negative' | 'Mixed'> => {
    const prompt = `Given these comments, classify the overall sentiment as Positive, Negative, or Mixed:\n\n${comments.join('\n\n')}\n\nSentiment:`;
    const res = await fetch(`${GEMINI_FLASH_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    const label = candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
    if (/positive/i.test(label)) return 'Positive';
    if (/negative/i.test(label)) return 'Negative';
    return 'Mixed';
};

export default fetchAiSentimentFromGemini;
