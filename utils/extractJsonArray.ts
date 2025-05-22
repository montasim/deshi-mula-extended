/**
 * Strips any Markdown fences and pulls out the first JSON array in the text.
 */
const extractJsonArray = (text: string): string => {
    let t = text.trim();

    // remove ```json or ``` fences if present
    t = t
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

    // try to find a bracketed array
    const arrMatch = t.match(/\[([\s\S]*)\]/);
    if (arrMatch) {
        // include the brackets
        return `[${arrMatch[1].trim()}]`;
    }

    // otherwise assume the whole thing is the array
    return t;
};

export default extractJsonArray;
