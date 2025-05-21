/**
 * Checks whether a given string is a well-formed URL.
 *
 * @param {string} string - The URL string to validate.
 * @returns {boolean} True if the string is a valid URL; false otherwise.
 */
const isValidURL = (string: string): boolean => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

export default isValidURL;
