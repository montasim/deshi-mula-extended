import decodeSpeak from './decodeSpeak';
import appendSocialBadges from './appendSocialBadges';
import getCompanyData from './getCompanyData';

const initCompanyBadges = (
    COMPANY_SELECTOR: string,
    className: string = 'visit-social-badge',
    companyDataCache: Map<string, any> = new Map()
) => {
    document
        .querySelectorAll<HTMLElement>(COMPANY_SELECTOR)
        .forEach(async (elem) => {
            // 1. raw + decode
            const raw = elem.textContent?.trim();
            if (!raw) return;
            const decoded = decodeSpeak(raw);

            // 2. update DOM
            elem.textContent = decoded;
            elem.dataset.decodedName = decoded;

            // 3. fetch data + badges
            const container = elem.closest('div.d-flex.my-2');
            if (!container) return;

            try {
                const { details, enSummary, bnSummary } = await getCompanyData(
                    decoded,
                    companyDataCache
                );
                appendSocialBadges(
                    container,
                    className,
                    details,
                    enSummary,
                    bnSummary,
                    decoded
                );
            } catch (err) {
                console.error('Could not load badges for', decoded, err);
            }
        });
};

export default initCompanyBadges;
