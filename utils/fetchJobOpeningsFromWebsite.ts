import CONSTANTS from '../constants/constants';
import getGeminiApiKey from './getGeminiApiKey';
import { ICompanyContactInfo, IJobOpening } from '../types/types';
import extractJsonArray from './extractJsonArray';

const { GEMINI_FLASH_API_URL } = CONSTANTS;

// Lightweight crawl of /careers, /jobs, etc:
const fetchJobOpeningsFromWebsite = async (
    companyWebsite: string
): Promise<IJobOpening[]> => {
    if (!companyWebsite) return [];
    const base = companyWebsite.replace(/\/+$/, '') + '/';
    const careerPaths = ['careers', 'career', 'jobs', 'openings'];

    for (const path of careerPaths) {
        try {
            const res = await fetch(new URL(path, base).href);
            if (!res.ok) continue;
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const jobs: IJobOpening[] = [];
            doc.querySelectorAll<HTMLAnchorElement>('a').forEach((a) => {
                const title = a.textContent?.trim() ?? '';
                const href = a.getAttribute('href') ?? '';
                if (
                    title &&
                    href &&
                    /\b(job|opening|position|role)\b/i.test(title)
                ) {
                    const link = new URL(href, base).href;
                    jobs.push({ title, location: '', link });
                }
            });

            if (jobs.length) return jobs;
        } catch {
            // swallow and try next path
        }
    }

    return [];
};

// Combines local crawl + Gemini‐powered search + de-duplication
const fetchJobOpeningsEnhanced = async (
    companyName: string,
    details: ICompanyContactInfo
): Promise<IJobOpening[]> => {
    const { website = '' } = details;
    const localJobs = await fetchJobOpeningsFromWebsite(website);

    // build the prompt
    const prompt = `
Find all current job openings for "${companyName}" by:
  • Crawling every page under "${website}"
  • Checking the official LinkedIn company page
  • Checking Glassdoor listings

Return a valid JSON array and nothing else:
[
  { "title": "string", "location": "string", "link": "string" },
  …
]
  `.trim();

    // call Gemini
    let geminiJobs: IJobOpening[] = [];
    try {
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
        if (res.ok) {
            const { candidates } = await res.json();
            const raw = candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const jsonText = extractJsonArray(raw);
            geminiJobs = JSON.parse(jsonText) as IJobOpening[];
            // normalize any relative links
            geminiJobs = geminiJobs.map((j) => ({
                ...j,
                link: new URL(j.link, website).href,
            }));
        }
    } catch {
        // if anything goes wrong, we just ignore Gemini output
    }

    // merge & de-dupe by link
    const map = new Map<string, IJobOpening>();
    [...localJobs, ...geminiJobs].forEach((job) => {
        if (job.link) map.set(job.link, job);
    });

    return Array.from(map.values());
};

export default fetchJobOpeningsEnhanced;
