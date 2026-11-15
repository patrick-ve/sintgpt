export type BrowserLocale = 'nl' | 'en';

/** Crawlers render pages too. They must see Dutch, the language the site is indexed in. */
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|whatsapp/i;

/**
 * The language for a visitor who never chose one: English when the browser
 * lists no Dutch at all, Dutch otherwise. Many Dutch people run an English
 * browser with Dutch further down the list; they keep Dutch. Crawlers and
 * automated browsers (navigator.webdriver) always get Dutch.
 */
export function browserLocale(languages: readonly string[], userAgent = '', webdriver = false): BrowserLocale {
  if (webdriver || BOT.test(userAgent) || !languages.length) return 'nl';
  return languages.some(language => /^nl\b/i.test(language)) ? 'nl' : 'en';
}
