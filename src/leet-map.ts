import leetMapData from './leet-map.json' assert { type: 'json' };

type LeetMapEntry = {
    pattern: string;
    replacement: string;
};

console.log('leetMapData', leetMapData);

export const leetMap: Map<RegExp, string> = new Map(
    (leetMapData as LeetMapEntry[]).map(({ pattern, replacement }) => [
        new RegExp(pattern, 'g'),
        replacement,
    ])
);
