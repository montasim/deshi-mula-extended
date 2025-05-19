// Leet character map
const leetMap = new Map<string | RegExp, string>([
    // multi-char / special first
    [/></g, 'x'], // you already had Technone><T → TechnonextT
    [/>\s*k/gi, 'x'],
    [/\|\_?\|/gi, 'k'], // |_| or || → k

    // now the new ones:
    [/</g, 'k'], // l< → lk (BackVenture, Ranl< → Rank)
    [/8/g, 'b'], // 8etopia → betopia

    // then your old digit mappings:
    [/2/g, 's'],
    [/1/g, 'l'],
    [/3/g, 'e'],
    [/4/g, 'a'],
    [/5/g, 's'],
    [/6/g, 'a'],
    [/0/g, 'o'],
    [/7/g, 't'],

    // symbols
    [/\$/g, 's'],
    [/@/g, 'a'],
    [/!/g, 'i'],
]);

type CaseStyle = 'sentence' | 'title' | 'upper';

const toSentenceCase = (str: string): string => {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const toTitleCase = (str: string): string => {
    return str.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
};

/**
 * Decode leet speak text to plain English, then apply casing.
 *
 * @param text    The input leet-speak string
 * @param style   'sentence' | 'title' | 'upper' (defaults to 'title')
 */
const decodeLeet = (text: string, style: CaseStyle = 'title'): string => {
    let result = text;

    // 1) first replace all the leet patterns
    for (const [pattern, repl] of leetMap) {
        result = result.replace(pattern, repl);
    }

    // 2) apply the requested casing
    switch (style) {
        case 'sentence':
            return toSentenceCase(result);
        case 'upper':
            return result.toUpperCase();
        case 'title':
        default:
            return toTitleCase(result);
    }
};

/**
 * Recursively decode all leet-speak in text nodes,
 * but *preserve* the original font style by simply updating
 * the textContent in place rather than swapping in a new <span>.
 */
const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const decodedText = decodeLeet(node.textContent);
        if (decodedText !== node.textContent) {
            // Just overwrite the text node itself, so all inherited
            // CSS (font-family, size, weight, etc.) stays exactly the same:
            node.textContent = decodedText;
        }
    } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !['SCRIPT', 'STYLE', 'TEXTAREA'].includes((node as HTMLElement).tagName)
    ) {
        for (const child of Array.from(node.childNodes)) {
            walk(child);
        }
    }
};

/**
 * Decode only the text within elements matching `selectors`.
 */
const decodeSelected = (selectors: string) => {
    document.querySelectorAll<HTMLElement>(selectors).forEach((el) => walk(el));
};

/**
 * Find all leet-encoded company names, decode them,
 * update the DOM, and insert a search link.
 */
const insertCompanyWebsite = () => {
    document
        .querySelectorAll<HTMLElement>('.company-name')
        .forEach((companyElem) => {
            const raw = companyElem.textContent?.trim();
            if (!raw) return;

            const decoded = decodeLeet(raw);
            companyElem.textContent = decoded;

            const container = companyElem.closest('div');
            if (!container) return;

            // --- Official site search ---
            const siteUrl = `https://duckduckgo.com/?q=${encodeURIComponent(decoded + ' official site')}`;
            if (!container.querySelector(`a[href="${siteUrl}"]`)) {
                const siteLink = document.createElement('a');
                siteLink.href = siteUrl;
                siteLink.target = '_blank';
                siteLink.classList.add('visit-badge');
                siteLink.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       class="w-4 h-4 mr-1">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
                  </svg>
                  Visit ${decoded}
                `;
                container.appendChild(siteLink);
            }

            // // --- Facebook (same styling) ---
            // const fbUrl = `https://www.facebook.com/${encodeURIComponent(decoded)}`;
            // if (
            //     !container.querySelector('a[href^="https://www.facebook.com"]')
            // ) {
            //     const fbLink = document.createElement('a');
            //     fbLink.href = fbUrl;
            //     fbLink.target = '_blank';
            //     fbLink.classList.add('visit-social-badge', 'rounded-full');
            //     fbLink.innerHTML = `
            //       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            //            class="w-4 h-4 mr-1" fill="currentColor">
            //         <path d="M22 12.07C22 6.48 17.52 2 12 2S2 6.48 2 12.07c0 4.99 3.66 9.12 8.44 9.93v-7.03H7.9v-2.9h2.53V9.41c0-2.5 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.62.77-1.62 1.56v1.88h2.77l-.44 2.9h-2.33v7.03C18.34 21.19 22 17.06 22 12.07z"/>
            //       </svg>
            //     `;
            //     container.appendChild(fbLink);
            // }
            //
            // // --- LinkedIn (same styling) ---
            // const liUrl = `https://www.linkedin.com/company/${encodeURIComponent(decoded)}`;
            // if (
            //     !container.querySelector('a[href^="https://www.linkedin.com"]')
            // ) {
            //     const liLink = document.createElement('a');
            //     liLink.href = liUrl;
            //     liLink.target = '_blank';
            //     liLink.classList.add('visit-social-badge', 'rounded-full');
            //     liLink.innerHTML = `
            //       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            //            class="w-4 h-4 mr-1" fill="currentColor">
            //         <path d="M20.45 20.45h-3.55v-5.4c0-1.29-.02-2.96-1.8-2.96-1.8 0-2.07 1.4-2.07 2.85v5.5h-3.55V9h3.41v1.56h.05c.48-.9 1.65-1.85 3.4-1.85 3.63 0 4.3 2.39 4.3 5.5v6.24zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.11 20.45H3.57V9h3.54v11.45zM22.23 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.21.8 24 1.77 24h20.46C23.2 24 24 23.21 24 22.26V1.74C24 .78 23.2 0 22.23 0z"/>
            //       </svg>
            //     `;
            //     container.appendChild(liLink);
            // }
        });
};

/**
 * Insert a sentiment badge (Positive/Negative/Mixed)
 * next to the other badges based on up/down vote counts.
 */
const insertSentimentBadges = () => {
    document
        .querySelectorAll<HTMLElement>('.container.mt-5 > .row')
        .forEach((row) => {
            const header = row.querySelector<HTMLElement>(
                '.d-flex.flex-wrap.align-items-center'
            );
            const footer = row.querySelectorAll<HTMLElement>('.col-12')[1];
            if (!header || !footer) return;

            let up = 0,
                down = 0;
            footer.querySelectorAll<HTMLElement>('.fw-bold').forEach((div) => {
                const d =
                    div.querySelector('svg path')?.getAttribute('d') || '';
                const n = parseInt(div.textContent || '0', 10);
                if (d.startsWith('M9.27787')) up = n;
                else if (d.startsWith('M13.2937')) down = n;
            });

            let sentiment = 'Mixed',
                cls = 'sentiment-mixed';
            if (up > down) {
                sentiment = 'Positive';
                cls = 'sentiment-positive';
            } else if (down > up) {
                sentiment = 'Negative';
                cls = 'sentiment-negative';
            }

            if (header.querySelector(`.sentiment-badge.${cls}`)) return;

            const badge = document.createElement('div');
            badge.classList.add('sentiment-badge', cls);
            badge.innerHTML = `
                ${
                    sentiment === 'Positive'
                        ? // 👍 thumb-up icon
                          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 20 20" fill="none">
                             <path d="M9.27787 3.93695L3.68873 9.08488C2.70226 9.99348 3.31292 11.6411 4.65327 11.6873L7.05168 11.77C7.85951 11.7978 8.5 12.4608 8.5 13.2691V16.3571C8.5 17.1856 9.17157 17.8571 10 17.8571H10.9286C11.757 17.8571 12.4286 17.1856 12.4286 16.3571V13.2666C12.4286 12.4593 13.0675 11.7968 13.8743 11.7676L15.9325 11.6931C17.2708 11.6446 17.8797 10 16.8956 9.09178L11.3114 3.93797C10.7373 3.40808 9.85254 3.40764 9.27787 3.93695Z"
                                   stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                           </svg>`
                        : sentiment === 'Negative'
                          ? // 👎 thumb-down icon
                            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                viewBox="0 0 24 24" fill="none">
                                 <path d="M13.2937 17.9202L18.8828 12.7723C19.8693 11.8637 19.2586 10.2161 17.9183 10.1699L15.5199 10.0872C14.712 10.0593 14.0715 9.39639 14.0715 8.58808L14.0715 5.50003C14.0715 4.6716 13.4 4.00003 12.5715 4.00003L11.643 4.00003C10.8145 4.00003 10.143 4.6716 10.143 5.50003L10.143 8.59057C10.143 9.39789 9.50401 10.0604 8.69722 10.0896L6.639 10.1641C5.30071 10.2125 4.69183 11.8572 5.67593 12.7654L11.2601 17.9192C11.8343 18.4491 12.719 18.4495 13.2937 17.9202Z"
                                       stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                             </svg>`
                          : // ↕️ mixed: up+down arrows
                            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                               viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                               <path d="M10 3v4M10 13v4M6 7l4-4 4 4M6 17l4-4 4 4"/>
                             </svg>`
                }
                    <span>${sentiment}</span>
                  `;
            header.appendChild(badge);
        });
};

// Decode company names, post titles *and* reviews on load:
decodeSelected('.company-name span, .post-title, .company-review');

// Decode company names and insert links
insertCompanyWebsite();

insertSentimentBadges();
