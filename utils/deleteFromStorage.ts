import CONSTANTS from '../constants/constants';

const { STORAGE_PREFIX } = CONSTANTS;

const deleteFromStorage = (company: string) => {
    try {
        sessionStorage.removeItem(STORAGE_PREFIX + company);
    } catch (e) {
        console.warn('Failed to delete from storage.');
    }
};

export default deleteFromStorage;
