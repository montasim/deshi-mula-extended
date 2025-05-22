const appendBadgeLink = (
    container: Element,
    href: string,
    iconHTML: string,
    label: string | null,
    className: string,
    target: string = '_blank'
): HTMLAnchorElement => {
    const link = document.createElement('a');
    link.href = href;
    link.className = `ms-2 ${className}`;
    link.innerHTML = iconHTML;
    if (label) link.title = label;
    if (target) link.setAttribute('target', target);

    container.appendChild(link);
    return link;
};

export default appendBadgeLink;
