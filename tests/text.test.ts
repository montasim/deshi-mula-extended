import { describe, expect, it } from 'vitest';
import { decodeLeetText, escapeHtml, slugFromCompanyUrl } from '../src/text';

describe('company identity helpers', () => {
  it('decodes masked company names without lowercasing them', () => {
    expect(decodeLeetText('Code>< IT Service')).toBe('Codex IT Service');
    expect(decodeLeetText('Opt!m!zely')).toBe('Optimizely');
  });

  it('extracts only company slugs', () => {
    expect(
      slugFromCompanyUrl('https://deshimula.com/companies/technonext-ltd'),
    ).toBe('technonext-ltd');
    expect(slugFromCompanyUrl('https://deshimula.com/story/123')).toBeNull();
  });

  it('escapes untrusted markup', () => {
    expect(escapeHtml('<img onerror="x">')).toBe(
      '&lt;img onerror=&quot;x&quot;&gt;',
    );
  });
});
