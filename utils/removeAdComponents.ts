import CONSTANTS from '../constants/constants';

const { AD_ELEMENTS } = CONSTANTS;

/**
 * Remove any ad-related elements:
 *  • <iframe> with id starting "aswift"
 *  • Any element with id/class/label/aria-label containing "advertisement"
 */
const removeAdComponents = () => {
    document
        .querySelectorAll<HTMLElement>(AD_ELEMENTS.join(','))
        .forEach((el) => el.remove());
};

export default removeAdComponents;
