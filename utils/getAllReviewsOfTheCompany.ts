/**
 * Fetches all reviews for a given company from a specific URL.
 * @param company - The name of the company to fetch reviews for.
 * @returns A promise that resolves to an array of review strings.
 */
const getAllReviewsOfTheCompany = async (
    company: string
): Promise<string[]> => {
    // Construct the URL for fetching company reviews.
    const url = `/stories/1?SearchTerm=${encodeURIComponent(company)}&Vibe=0`;
    // Fetch the HTML content from the URL.
    const res = await fetch(url);
    const html = await res.text();
    // Parse the HTML string into a DOM document.
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Select all elements with the class 'company-review', extract their text content,
    // trim whitespace, and filter out empty strings.
    const reviews = Array.from(doc.querySelectorAll('.company-review'))
        .map((el) => el.textContent?.trim() ?? '')
        .filter((txt) => txt !== '');

    return reviews;
};

export default getAllReviewsOfTheCompany;
