const MASK_CANDIDATES: Record<string, string[]> = {
  '0': ['o'],
  '1': ['i', 'l'],
  '3': ['e'],
  '4': ['a'],
  '5': ['s'],
  '7': ['t'],
  '8': ['b'],
  '@': ['a'],
  '!': ['i'],
  '$': ['s'],
  '<': ['c'],
  '>': ['x'],
  '><': ['x'],
};

const fallbackMask = (token: string): string =>
  MASK_CANDIDATES[token]?.[0] ?? token;

export const decodeLeetText = (
  value: string,
  canonicalSlug?: string,
): string => {
  const normalized = value.normalize('NFKC');
  const reference = (canonicalSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let referenceIndex = 0;
  let referenceAligned = Boolean(reference);
  let wordStart = true;
  let decoded = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const pair = normalized.slice(index, index + 2);
    const token = pair === '><' ? pair : normalized[index] || '';
    if (token === '><') index += 1;

    const candidates = MASK_CANDIDATES[token];
    const isReferenceCharacter = /^[a-z0-9]$/i.test(token) || Boolean(candidates);
    if (!isReferenceCharacter) {
      decoded += token;
      wordStart = /[\s/_-]/.test(token);
      continue;
    }

    const referenceCharacter = reference[referenceIndex];
    const sourceCharacter = token.toLowerCase();
    if (candidates) {
      let replacement = fallbackMask(token);
      if (
        referenceAligned &&
        referenceCharacter &&
        (referenceCharacter === sourceCharacter ||
          candidates.includes(referenceCharacter))
      ) {
        replacement =
          referenceCharacter === sourceCharacter ? token : referenceCharacter;
      }
      if (wordStart && /^[a-z]$/.test(replacement)) {
        replacement = replacement.toUpperCase();
      }
      decoded += replacement;
      if (
        referenceAligned &&
        referenceCharacter !== replacement.toLowerCase() &&
        referenceCharacter !== sourceCharacter
      ) {
        referenceAligned = false;
      }
    } else {
      decoded += token;
      if (
        referenceAligned &&
        referenceCharacter !== sourceCharacter
      ) {
        referenceAligned = false;
      }
    }

    referenceIndex += 1;
    wordStart = false;
  }

  return decoded;
};

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
