import CONSTANTS from '../constants/constants';
import getGeminiApiKey from './getGeminiApiKey';
import { ISalaryEntry } from '../types/types';
import extractJsonArray from './extractJsonArray';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

const fetchSalaryInfoFromGemini = async (
    companyName: string
): Promise<ISalaryEntry[]> => {
    const prompt = `
        Provide the latest salary structure for different positions at "${companyName}".
        Use Glassdoor or other reputable sources for up-to-date information.
        
        Return the result as a valid JSON array and nothing else (no markdown, no commentary):
        [
          {
            "position": "Software Engineer",
            "salaryRange": "$80k–$120k"
          },
          {
            "position": "QA Engineer",
            "salaryRange": "$60k–$80k"
          }
        ]
    `.trim();

    const res = await fetch(
        `${GEMINI_FLASH_API_URL}?key=${await getGeminiApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );
    if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}`);
    }

    const { candidates } = await res.json();
    const raw = candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonText = extractJsonArray(raw);
    try {
        return JSON.parse(jsonText) as ISalaryEntry[];
    } catch (err: any) {
        console.error('Failed parsing JSON:', jsonText);
        throw new Error(`Could not parse salary JSON: ${err.message}`);
    }
};

export default fetchSalaryInfoFromGemini;
