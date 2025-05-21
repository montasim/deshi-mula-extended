/**
 * Inserts a placeholder DIV before `referenceNode` with given class/text.
 * Returns the placeholder element so you can later replace it.
 */
const insertPlaceholder = (
    containerElem: Node,
    placeholderClass: string,
    placeholderText: string
): HTMLElement => {
    const placeholder = document.createElement('div');
    placeholder.className = placeholderClass;
    placeholder.textContent = placeholderText;
    containerElem.parentNode!.insertBefore(placeholder, containerElem);
    return placeholder;
};

export default insertPlaceholder;
