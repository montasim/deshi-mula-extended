import CONSTANTS from '../constants/constants';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

/**
 * Generate English summary, Bangla translation, and overall sentiment in one API call.
 *
 * @param apiKey - Gemini API key
 * @param comments - Array of comment strings to analyze and summarize
 * @returns Object containing English summary, Bangla summary, and sentiment
 * @throws If the network request fails or returns non-OK
 */
const fetchAiSummaryAndSentimentFromGemini = async (
    apiKey: string,
    comments: string[]
): Promise<{
    enSummary: string;
    bnSummary: string;
    sentiment: 'Positive' | 'Negative' | 'Mixed';
}> => {
    const prompt = `Given these comments, please:
        1. Provide a concise English summary.
        2. Translate that summary into Bangla.
        3. Classify the overall sentiment as Positive, Negative, or Mixed.
        
        Comments:
        ${comments.join('\n\n')}
        
        Output format:
        [English Summary]
        [Your English Summary Here]
        
        [Bangla Summary]
        [Your Bangla Summary Here]
        
        Sentiment: [Positive/Negative/Mixed]
    `;

    const res = await fetch(`${GEMINI_FLASH_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) throw new Error('Failed to fetch data from Gemini');

    const { candidates } = await res.json();
    const responseText =
        candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';

    // Improved parsing using regex with better handling of whitespace
    const enRegex = /\[English Summary\]\s*(.*?)\s*\[Bangla Summary\]/s;
    const bnRegex = /\[Bangla Summary\]\s*(.*?)\s*Sentiment:/s;
    const sentimentRegex = /Sentiment:\s*(Positive|Negative|Mixed)/i;

    const enMatch = responseText.match(enRegex);
    const bnMatch = responseText.match(bnRegex);
    const sentimentMatch = responseText.match(sentimentRegex);

    const enSummary = enMatch ? enMatch[1].trim() : '';
    const bnSummary = bnMatch ? bnMatch[1].trim() : '';
    const sentiment: 'Positive' | 'Negative' | 'Mixed' = sentimentMatch
        ? ((sentimentMatch[1].charAt(0).toUpperCase() +
              sentimentMatch[1].slice(1)) as any)
        : 'Mixed';

    // Debugging: Log the parsed values
    console.log('Parsed Values:');
    console.log('English Summary:', enSummary);
    console.log('Bangla Summary:', bnSummary);
    console.log('Sentiment:', sentiment);

    return {
        enSummary,
        bnSummary,
        sentiment,
    };
};

export default fetchAiSummaryAndSentimentFromGemini;
