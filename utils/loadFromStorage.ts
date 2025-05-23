import CONSTANTS from '../constants/constants';

const { STORAGE_PREFIX } = CONSTANTS;

const loadFromStorage = (company: string) => {
    try {
        const stored = localStorage.getItem(STORAGE_PREFIX + company);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.warn('Failed to load from storage.');
    }
};

export default loadFromStorage;
