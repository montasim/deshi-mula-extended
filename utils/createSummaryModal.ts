import hideSummaryModal from './hideSummaryModal';

const createSummaryModal = () => {
    // create overlay
    const modal = document.createElement('div');
    modal.id = 'summary-modal';

    // create white “card”
    const content = document.createElement('div');
    content.className = 'modal-content';

    // close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => hideSummaryModal();

    // container for dynamic content
    const modalBody = document.createElement('div');
    modalBody.id = 'summary-modal-body';
    modalBody.className = 'modal-body';

    // assemble
    content.appendChild(closeBtn);
    content.appendChild(modalBody);
    modal.appendChild(content);
    document.body.appendChild(modal);

    return modal;
};

export default createSummaryModal;
