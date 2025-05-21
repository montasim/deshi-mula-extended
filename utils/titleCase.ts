/**
 * Converts a string to title case (first letter of each word capitalized).
 *
 * @returns {string} The string in title case.
 */
const titleCase = (text: string): string =>
    text.toLowerCase().replace(/\b([a-z])/g, (_, char) => char.toUpperCase());

export default titleCase;
