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

export const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/></g, 'x')
    .replace(/[013457@!$<>]/g, (character) => MASK_MAP[character] ?? character)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export const slugFromCompanyUrl = (value: string): string | null => {
  try {
    const url = new URL(value, 'https://deshimula.com');
    const match = url.pathname.match(/^\/companies\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

export const excerpt = (value: string, length = 280): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= length
    ? normalized
    : `${normalized.slice(0, length).trimEnd()}…`;
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
