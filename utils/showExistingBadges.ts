const showExistingBadges = (container: Element) => {
    container
        .querySelectorAll<HTMLElement>(
            '.visit-badge, .visit-social-badge, .sentiment-badge'
        )
        .forEach((badge) => badge.classList.remove('hidden'));
};

export default showExistingBadges;
