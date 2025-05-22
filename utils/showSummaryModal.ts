import createSummaryModal from './createSummaryModal';

const showSummaryModal = (content: string) => {
    const body = document.getElementById('summary-modal-body');
    if (body) {
        body.innerHTML = content;
    }

    let summaryModal = document.getElementById(
        'summary-modal'
    ) as HTMLElement | null;
    if (!summaryModal) {
        summaryModal = createSummaryModal();
    }

    if (summaryModal) {
        summaryModal.style.display = 'flex';
    }
};

export default showSummaryModal;
