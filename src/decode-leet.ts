import { leetMap } from './leet-map';

export const decodeLeet = (text: string): string => {
    let result: string = text;

    for (const [pattern, replacement] of leetMap.entries()) {
        // pattern is RegExp, replacement is string
        result = result.replace(pattern, replacement);
    }

    // Capitalize first letter of each word
    return result.replace(/\b[a-z]/g, (char: string): string =>
        char.toUpperCase()
    );
};
