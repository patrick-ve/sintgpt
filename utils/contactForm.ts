// Shared by the contact page (pages/contact.vue) and its route
// (server/api/contact.post.ts, rules in server/utils/contact.ts).

export const CONTACT_EMAIL = 'patrick@sintgpt.com';

export const CONTACT_TOPICS = ['help', 'question', 'complaint'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_LIMITS = {
  email: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;

/** A person needs more than this to type a message; a script fills the form at once. */
export const CONTACT_MIN_SECONDS = 3;

/** The action the page gives the Turnstile widget; the server checks it. */
export const TURNSTILE_ACTION = 'contact';

/**
 * Cloudflare's test site key: the widget always passes. Only for `npm run dev`
 * without NUXT_PUBLIC_TURNSTILE_SITE_KEY; its secret is
 * 1x0000000000000000000000000000000AA.
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/** Why the server refused a message; the page has a text for each. */
export type ContactErrorReason = 'captcha' | 'debounce' | 'limit' | 'unavailable';

/** A plain check for the page; the server checks the address with Zod. */
export function looksLikeEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= CONTACT_LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
