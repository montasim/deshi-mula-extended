import getGeminiApiKey from './getGeminiApiKey';
import CONSTANTS from '../constants/constants';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

/**
 * Translate given text into the specified language via Gemini Flash.
 *
 * @param text - The source text to translate
 * @param to - Target language: 'English' or 'Bangla'
 * @returns The translated text
 * @throws If the network request fails or returns non-OK
 */
const translateText = async (
    text: string,
    to: 'English' | 'Bangla'
): Promise<string> => {
    const prompt = `Translate the following text into ${to}:\n\n${text}\n\nTranslation:`;
    const res = await fetch(
        `${GEMINI_FLASH_API_URL}?key=${await getGeminiApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) throw new Error();
    const { candidates } = await res.json();
    return candidates?.[0]?.content?.parts?.[0]?.text.trim() || '';
};

export default translateText;
