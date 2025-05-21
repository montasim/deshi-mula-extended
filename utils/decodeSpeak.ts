import { TCaseStyle } from '../types/types';
import CONSTANTS from '../constants/constants';
import sentenceCase from './sentenceCase';
import titleCase from './titleCase';

const { LEET_SPEAK_MAP } = CONSTANTS;

/**
 * Decodes leet-speak text to plain English and applies the specified casing.
 *
 * @param {string} text - The leet-speak input string.
 * @param {TCaseStyle} [style='title'] - The casing style ('sentence', 'title', or 'upper').
 * @returns {string} The decoded string with applied casing.
 */
const decodeSpeak = (text: string, style: TCaseStyle = 'title'): string => {
    let result = text;

    // 1) first replace all the leet patterns
    for (const [pattern, repl] of LEET_SPEAK_MAP) {
        result = result.replace(pattern, repl);
    }

    // 2) apply the requested casing
    switch (style) {
        case 'sentence':
            return sentenceCase(result);
        case 'upper':
            return result.toUpperCase();
        case 'title':
        default:
            return titleCase(result);
    }
};

export default decodeSpeak;
