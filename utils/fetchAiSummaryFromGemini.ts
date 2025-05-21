import CONSTANTS from '../constants/constants';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

/**
 * Generate a concise overall summary of the given comments via Gemini Flash.
 *
 * @param apiKey
 * @param comments - Array of comment strings to summarize
 * @returns The AI-generated summary text
 * @throws If the network request fails or returns non-OK
 */
const fetchAiSummaryFromGemini = async (
    apiKey: string,
    comments: string[]
): Promise<string> => {
    const prompt = `Please provide a concise overall summary of these comments:\n\n${comments.join('\n\n')}\n\nSummary:`;
    const res = await fetch(`${GEMINI_FLASH_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    return candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
};

export default fetchAiSummaryFromGemini;
