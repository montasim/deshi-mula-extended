import { ISummaryProps } from '../types/types';
import insertPlaceholder from './insertPlaceholder';
import fetchAiSentimentFromGemini from './fetchAiSentimentFromGemini';
import fetchAiSummaryFromGemini from './fetchAiSummaryFromGemini';
import translateText from './translateText';
import createSummaryBlock from './createSummaryBlock';
import getGeminiApiKey from './getGeminiApiKey';

/**
 * Generic runner: collects texts, does AI calls, builds & injects summary.
 */
const renderAiSummary = async ({
    itemSelector,
    skipCondition,
    placeholderClass,
    placeholderText,
    containerSelector,
    buildProps,
}: {
    itemSelector: string;
    skipCondition?: () => boolean;
    placeholderClass: string;
    placeholderText: string;
    containerSelector: string;
    buildProps: (responses: {
        summary: string;
        sentiment: string;
        translation?: string;
        count: number;
    }) => ISummaryProps;
}) => {
    if (skipCondition?.()) return;

    const containerElem =
        document.querySelector<HTMLElement>(containerSelector);
    if (!containerElem) return;

    // collect raw texts
    const items = Array.from(
        document.querySelectorAll<HTMLElement>(itemSelector)
    )
        .map((el) => el.textContent?.trim() ?? '')
        .filter((txt) => txt !== '');
    if (!items.length) return;

    // check for API key
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        insertPlaceholder(
            containerElem,
            placeholderClass,
            'Please provide the Gemini Flash API key to continue.'
        );
        return;
    }

    // insert placeholder
    const placeholder = insertPlaceholder(
        containerElem,
        placeholderClass,
        placeholderText
    );

    // run AI calls in parallel
    const [summary, sentiment] = await Promise.all([
        fetchAiSummaryFromGemini(apiKey, items).catch(() => 'Summary failed.'),
        fetchAiSentimentFromGemini(apiKey, items).catch(() => 'Unknown'),
    ]);
    if (summary === 'Summary failed.') {
        placeholder.remove();

        insertPlaceholder(
            containerElem,
            placeholderClass,
            'AI Summary failed.'
        );

        return;
    }

    // optional translation step
    let translation: string | undefined;
    const isBangla = /[\u0980-\u09FF]/.test(summary);
    if (!isBangla) {
        translation = await translateText(summary, 'Bangla').catch(
            () => 'Translation failed.'
        );
    }

    // build props & block
    const props = buildProps({
        summary,
        sentiment,
        translation,
        count: items.length,
    });
    const summaryBlock = createSummaryBlock(props);

    // replace placeholder
    placeholder.replaceWith(summaryBlock);
};

export default renderAiSummary;
