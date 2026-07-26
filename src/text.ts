const MASK_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '!': 'i',
  '$': 's',
  '<': 'c',
  '>': 'x',
};

export const decodeLeetText = (value: string): string =>
  value
    .normalize('NFKC')
    .replace(/></g, 'x')
    .replace(/[013457@!$<>]/g, (character) => MASK_MAP[character] ?? character);

export const slugFromCompanyUrl = (value: string): string | null => {
  try {
    const url = new URL(value, 'https://deshimula.com');
    const match = url.pathname.match(/^\/companies\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
