import { describe, expect, it } from 'vitest';
import { browserLocale } from '../../utils/browserLocale';

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

describe('browser locale', () => {
  it('gives English to a browser without Dutch', () => {
    expect(browserLocale(['en-GB', 'en'], SAFARI)).toBe('en');
    expect(browserLocale(['de-DE'], SAFARI)).toBe('en');
  });

  it('keeps Dutch when Dutch is anywhere in the list', () => {
    expect(browserLocale(['nl-NL'], SAFARI)).toBe('nl');
    expect(browserLocale(['nl-BE', 'fr'], SAFARI)).toBe('nl');
    expect(browserLocale(['en-US', 'nl'], SAFARI)).toBe('nl');
  });

  it('keeps Dutch for crawlers, automated browsers and an empty list', () => {
    expect(browserLocale(['en-US'], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe('nl');
    expect(browserLocale(['en-US'], 'Mozilla/5.0 Chrome/140.0 HeadlessChrome/140.0')).toBe('nl');
    expect(browserLocale(['en-US'], SAFARI, true)).toBe('nl');
    expect(browserLocale([], SAFARI)).toBe('nl');
  });

  it('does not read "nlx" or similar codes as Dutch', () => {
    expect(browserLocale(['nlx'], SAFARI)).toBe('en');
  });
});
