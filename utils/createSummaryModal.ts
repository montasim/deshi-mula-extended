import hideSummaryModal from './hideSummaryModal';

const createSummaryModal = () => {
    const modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = '9999';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const content = document.createElement('div');
    content.style.background = '#fff';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.maxWidth = '600px';
    content.style.width = '90%';
    content.style.position = 'relative';
    content.style.maxHeight = '90vh';
    content.style.overflowY = 'auto';

    const closeBtn = document.createElement('button');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => hideSummaryModal();

    const modalBody = document.createElement('div');
    modalBody.id = 'summary-modal-body';

    content.appendChild(closeBtn);
    content.appendChild(modalBody);
    modal.appendChild(content);

    document.body.appendChild(modal);

    return modal;
};

export default createSummaryModal;
