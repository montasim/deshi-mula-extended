import CONSTANTS from '../constants/constants';

const { STORAGE_PREFIX } = CONSTANTS;

const loadFromStorage = (company: string) => {
    const stored = sessionStorage.getItem(STORAGE_PREFIX + company);
    return stored ? JSON.parse(stored) : null;
};

export default loadFromStorage;
