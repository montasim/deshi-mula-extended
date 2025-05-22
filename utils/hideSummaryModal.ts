import createSummaryModal from './createSummaryModal';

const hideSummaryModal = () => {
    let summaryModal = document.getElementById(
        'summary-modal'
    ) as HTMLElement | null;
    if (!summaryModal) {
        summaryModal = createSummaryModal();
    }

    if (summaryModal) {
        summaryModal.style.display = 'none';
    }
};

export default hideSummaryModal;
