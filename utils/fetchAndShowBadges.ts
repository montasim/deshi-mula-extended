import showExistingBadges from './showExistingBadges';
import decodeSpeak from './decodeSpeak';
import fetchCompanyContactInfoFromGemini from './fetchCompanyContactInfoFromGemini';
import fetchAiSummaryAndSentimentFromGemini from './fetchAiSummaryAndSentimentFromGemini';
import appendSocialBadges from './appendSocialBadges';
import getGeminiApiKey from './getGeminiApiKey';

const fetchAndShowBadges = async (
    companyElem: HTMLElement,
    container: Element
) => {
    if (
        companyElem.dataset.fetching === 'true' ||
        companyElem.dataset.fetched === 'true'
    ) {
        showExistingBadges(container);
        return;
    }

    companyElem.dataset.fetching = 'true';

    const placeholder = document.createElement('span');
    placeholder.className = 'searching-text';
    placeholder.textContent = 'Searching…';
    container.appendChild(placeholder);

    try {
        const raw = companyElem.textContent?.trim();
        if (!raw) {
            placeholder.remove();
            return;
        }

        const decoded = decodeSpeak(raw);
        companyElem.textContent = decoded;
        companyElem.dataset.decodedName = decoded;

        // Fire and forget — fetch details and vibe in parallel
        void (async () => {
            try {
                const [details, { enSummary, bnSummary }] = await Promise.all([
                    fetchCompanyContactInfoFromGemini(decoded),
                    fetchAiSummaryAndSentimentFromGemini(
                        await getGeminiApiKey(),
                        [decoded]
                    ),
                ]);

                // ✅ Pass both `vibe` and `translation` to appendSocialBadges
                appendSocialBadges(
                    container,
                    details,
                    enSummary,
                    bnSummary,
                    decoded
                );
            } catch (error) {
                console.error('Failed to load company info:', error);
            } finally {
                // ✅ Always remove the placeholder after everything finishes
                placeholder.remove();
            }
        })();
    } catch (error) {
        console.error('Error fetching data:', error);
        placeholder.remove();
    }
};

export default fetchAndShowBadges;
