import { walkDom } from './walk-dom';

const observer = new MutationObserver(() => walkDom(document.body));
observer.observe(document.body, { childList: true, subtree: true });
