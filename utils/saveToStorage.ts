import CONSTANTS from '../constants/constants';

const { STORAGE_PREFIX } = CONSTANTS;

const saveToStorage = (company: string, data: any) => {
    try {
        localStorage.setItem(STORAGE_PREFIX + company, JSON.stringify(data));
    } catch (e) {
        console.warn('Storage quota exceeded, cannot persist company data.');
    }
};

export default saveToStorage;
