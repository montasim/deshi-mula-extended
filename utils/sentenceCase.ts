/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase).
 *
 * @returns {string} The string in sentence case.
 */
const sentenceCase = (text: string): string => {
    const lowerCasedText = text.toLowerCase();
    return lowerCasedText.charAt(0).toUpperCase() + lowerCasedText.slice(1);
};

export default sentenceCase;
