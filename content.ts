import CONSTANTS from './constants/constants';

import decodeSelected from './utils/decodeSelected';
import renderAiSummary from './utils/renderAiSummary';
import renderCompanyContactLinks from './utils/renderCompanyContactLinks';
import removeAdComponents from './utils/removeAdComponents';

const { ICONS, SELECTORS_TO_DECODE } = CONSTANTS;

// Execute decoding and badge insertion on load
// Decode company names, post titles, and reviews on load
decodeSelected(SELECTORS_TO_DECODE);

// Decode company names and insert links
renderCompanyContactLinks();

/**
 * Now your two entry points become trivial configurations
 */
renderAiSummary({
    itemSelector: '.commentText p',
    placeholderClass: 'ai-summary-box p-3 my-4',
    placeholderText: 'AI Analyzing Comments…',
    containerSelector: '#comments-section',
    buildProps: ({ enSummary, sentiment, bnSummary, count }) => ({
        title: 'AI Comments Analysis',
        subtitle: `${
            sentiment === 'Positive'
                ? ICONS.POSITIVE
                : sentiment === 'Negative'
                  ? ICONS.NEGATIVE
                  : ICONS.MIXED
        } ${sentiment}`,
        description: `Analyzed ${count} comments.`,
        main: `
          <p><strong>Summary:</strong><br>${enSummary}</p>
          ${bnSummary ? `<p><strong>Translation (বাংলা):</strong><br>${bnSummary}</p>` : ''}
        `,
    }),
});

renderAiSummary({
    itemSelector: '.company-review',
    skipCondition: () =>
        window.location.pathname === '/' || window.location.pathname === '',
    placeholderClass: 'ai-summary-box p-3 my-4',
    placeholderText: 'AI Analyzing Reviews…',
    containerSelector: '.container.mt-5',
    buildProps: ({ enSummary, sentiment, bnSummary, count }) => ({
        title: 'AI Review Summary',
        subtitle: `${
            sentiment === 'Positive'
                ? ICONS.POSITIVE
                : sentiment === 'Negative'
                  ? ICONS.NEGATIVE
                  : ICONS.MIXED
        } ${sentiment}`,
        description: `Summarized ${count} reviews in English and translated with Gemini.`,
        main: `
          <p><strong>English:</strong> ${enSummary}</p>
          ${bnSummary ? `<p><strong>Bangla:</strong> ${bnSummary}</p>` : ''}
        `,
    }),
});

const observer = new MutationObserver(removeAdComponents);
observer.observe(document.body, { childList: true, subtree: true });
