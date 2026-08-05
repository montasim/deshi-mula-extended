import { describe, expect, it } from 'vitest';
import { decodeLeetText, escapeHtml, slugFromCompanyUrl } from '../src/text';

describe('company identity helpers', () => {
  it('decodes masked company names without lowercasing them', () => {
    expect(decodeLeetText('Code>< IT Service')).toBe('Codex IT Service');
    expect(decodeLeetText('Opt!m!zely')).toBe('Optimizely');
    expect(decodeLeetText('Expre$s Le@ther Products Ltd')).toBe(
      'Express Leather Products Ltd',
    );
  });

  it('uses the company slug to decode ambiguous masks safely', () => {
    expect(decodeLeetText('Inte11ier Ltd', 'intellier-ltd')).toBe(
      'Intellier Ltd',
    );
    expect(decodeLeetText('8RAC IT', 'brac-it')).toBe('BRAC IT');
    expect(decodeLeetText('10 Minute School', '10-minute-school')).toBe(
      '10 Minute School',
    );
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
