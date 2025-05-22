import { ISummaryProps } from '../types/types';
import insertPlaceholder from './insertPlaceholder';
import fetchAiSummaryAndSentimentFromGemini from './fetchAiSummaryAndSentimentFromGemini';
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
        enSummary: string;
        sentiment: string;
        bnSummary?: string;
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
    const { enSummary, bnSummary, sentiment } =
        await fetchAiSummaryAndSentimentFromGemini(apiKey, items);

    // build props & block
    const props = buildProps({
        enSummary,
        sentiment,
        bnSummary,
        count: items.length,
    });
    const summaryBlock = createSummaryBlock(props);

    // replace placeholder
    placeholder.replaceWith(summaryBlock);
};

export default renderAiSummary;
