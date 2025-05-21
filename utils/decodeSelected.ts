import walkTextNode from './walkTextNode';

/**
 * Decodes leet-speak text for elements matching the provided selectors.
 * Adds mouseenter/mouseleave event listeners to show/hide badges.
 *
 * @param {string | string[]} selectors - A single selector or array of selectors.
 */
const decodeSelected = (selectors: string | string[]): void => {
    // Normalize to a comma-separated string so querySelectorAll runs only once
    const sel = Array.isArray(selectors) ? selectors.join(',') : selectors;

    document.querySelectorAll<HTMLElement>(sel).forEach(walkTextNode);
};

export default decodeSelected;
