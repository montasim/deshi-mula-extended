import { CompanyContactInfo } from '../types/types';
import getGeminiApiKey from './getGeminiApiKey';
import CONSTANTS from '../constants/constants';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

/**
 * Queries the Gemini Flash API for a company’s details and parses the JSON response.
 *
 * Sends a POST to the Gemini endpoint asking **only** for a JSON object of the form
 * `{ website: string, linkedin: string, facebook: string, github: string }`, then
 * strips any stray Markdown fences and parses it.
 *
 * @param {string} name - The exact name of the company to look up.
 * @returns {Promise<CompanyContactInfo>} An object containing any of:
 *   - `website` (string URL of the company’s official site),
 *   - `linkedin` (string URL of LinkedIn profile),
 *   - `facebook` (string URL of Facebook page),
 *   - `github` (string URL of GitHub org/user).
 *   - `email` (string URL of Email org/user).
 *   If the fetch fails or the response can’t be parsed, returns an empty object.
 */
const fetchCompanyContactInfoFromGemini = async (
    name: string
): Promise<CompanyContactInfo> => {
    const res = await fetch(
        `${GEMINI_FLASH_API_URL}?key=${await getGeminiApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: [
                                    `For the company named "${name}", respond with ONLY the JSON object below—`,
                                    'no markdown, no code fences, nothing else:',
                                    '{"website":"…","linkedin":"…","facebook":"…","github":"…","email":"…"}',
                                ].join(' '),
                            },
                        ],
                    },
                ],
            }),
        }
    );

    if (!res.ok) {
        console.error('Gemini API error', await res.text());
        return {};
    }

    const { candidates } = (await res.json()) as any;
    let message = (candidates?.[0]?.content?.parts?.[0]?.text as string) || '';

    // strip ```json and ``` if they slipped through
    message = message
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim();

    try {
        return JSON.parse(message) as CompanyContactInfo;
    } catch (e) {
        console.warn('Failed to parse JSON from Gemini reply:', message);
        return {};
    }
};

export default fetchCompanyContactInfoFromGemini;
