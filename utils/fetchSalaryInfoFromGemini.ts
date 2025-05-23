import CONSTANTS from '../constants/constants';
import getGeminiApiKey from './getGeminiApiKey';
import extractJsonArray from './extractJsonArray';
import { ISalaryEntry } from '../types/types';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

// This utility function is not directly used in the modified fetchSalaryInfoFromGemini,
// but kept for completeness if other parts of the application still use it.
/**
 * Uses Gemini to fetch the current open job titles at a company.
 * @param companyName – Exact name of the company.
 * @param careersUrl – Public URL of the company’s careers or jobs page.
 * @returns An array of job‐title strings.
 */
const fetchJobTitlesFromGemini = async (
    companyName: string,
    careersUrl: string
): Promise<string[]> => {
    const prompt = `
        List the current open job titles at "${companyName}" by inspecting their careers page at:
        ${careersUrl}

        Return only a valid JSON array of strings (no markdown, no commentary), for example:
        [
          "Software Engineer",
          "Product Manager",
          "QA Analyst"
        ]
    `.trim();

    const res = await fetch(
        `${GEMINI_FLASH_API_URL}?key=${await getGeminiApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );
    if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}`);
    }

    const { candidates } = await res.json();
    const raw = candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonText = extractJsonArray(raw);

    try {
        return JSON.parse(jsonText) as string[];
    } catch (err: any) {
        console.error('Failed parsing job titles JSON:', jsonText);
        throw new Error(`Could not parse job titles JSON: ${err.message}`);
    }
};

const fetchSalaryInfoFromGemini = async (
    companyName: string
): Promise<ISalaryEntry[]> => {
    // The single prompt to get both job titles and BDT salary ranges
    const prompt = `
        For "${companyName}", please identify the current open job titles by inspecting the "${companyName}" website careers page on web".
            Then, for each identified job title, provide its estimated salary range in **Bangladeshi Taka (BDT)**.
        Use reputable sources like Glassdoor or local job boards for salary information.
        
            Return your response as a valid JSON array of objects, with no markdown or additional commentary.
            Each object in the array should have two properties:
                - "position": (string) The job title.
                - "salaryRange": (string) The estimated salary range in BDT (e.g., "৳80,000 – ৳120,000").
        
            Example expected output:
            [
                {
                    "position": "Software Engineer L-1",
                    "salaryRange": "৳80,000 – ৳120,000"
                },
                {
                    "position": "Software Engineer L-2",
                    "salaryRange": "৳80,000 – ৳120,000"
                },
                {
                    "position": "Software Engineer L-3",
                    "salaryRange": "৳80,000 – ৳120,000"
                },
                {
                    "position": "Project Manager",
                    "salaryRange": "৳95,000 – ৳140,000"
                },
                {
                    "position": "Product Manager",
                    "salaryRange": "৳95,000 – ৳140,000"
                },
                {
                    "position": "QA Analyst",
                    "salaryRange": "৳60,000 – ৳80,000"
                }
            ]
    `.trim();

    // Call Gemini API with the combined prompt
    const res = await fetch(
        `${GEMINI_FLASH_API_URL}?key=${await getGeminiApiKey()}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );

    if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}: ${res.statusText}`);
    }

    const { candidates } = await res.json();
    const raw = candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonText = extractJsonArray(raw); // Ensure this utility correctly extracts the JSON part

    try {
        const result = JSON.parse(jsonText) as ISalaryEntry[];
        if (result.length === 0) {
            console.warn(
                `Gemini returned an empty array for ${companyName}. No job titles or salary info found.`
            );
            // Return an empty array or throw a more specific error based on desired behavior
            return [];
        }
        return result;
    } catch (err: any) {
        console.error('Failed parsing JSON for salary info:', jsonText);
        throw new Error(
            `Could not parse salary JSON from Gemini: ${err.message}. Raw text: ${jsonText}`
        );
    }
};

export default fetchSalaryInfoFromGemini;
