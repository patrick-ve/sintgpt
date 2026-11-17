// Gift links: https://sintgpt.com/?cadeau=<code> gives someone Hele familie
// without a payment, for example a family member who tests the site.
//
// Two lists of codes, both comma-separated, each code at least 16 characters
// (make one with `openssl rand -hex 16`):
// - NUXT_GIFT_CODES: Hele familie for as long as a buyer would have it, in any
//   number of browsers.
// - NUXT_GIFT_CODES_SEASON: Hele familie until the end of the date in
//   NUXT_GIFT_SEASON_END (the gift mail to last season's buyers,
//   docs/buyer-gift-mail.md), in at most GIFT_BROWSERS browsers per code.
// The cookie holds a hash of the code, never the code. Removing a code from
// its list ends that access at once: paidAccess checks the lists on every
// request.

import { GIFT_CLAIM_RULE } from './rateLimit';

const MIN_CODE_LENGTH = 16;
const GIFT_PREFIX = 'gift_';

/** The usable codes in the secret. Short codes are ignored, so a typo cannot open the door. */
export function parseGiftCodes(secret: string | undefined): string[] {
  return (secret ?? '')
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length >= MIN_CODE_LENGTH);
}

/** Stands in for a payment ID in the cookie and the rate-limit counter. */
export async function giftId(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gift:${code}`));
  const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${GIFT_PREFIX}${hex.slice(0, 24)}`;
}

export function isGiftId(id: string): boolean {
  return id.startsWith(GIFT_PREFIX);
}

/** Compares without stopping at the first different character. */
function sameText(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let difference = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}

/** Whether the code is in the list, without stopping at the first match. */
function inList(code: string, secret: string | undefined): boolean {
  let found = false;
  for (const known of parseGiftCodes(secret)) found = sameText(known, code) || found;
  return found;
}

function validShape(code: unknown): code is string {
  return typeof code === 'string' && code.length >= MIN_CODE_LENGTH && code.length <= 200;
}

/** The gift ID for a code in the list, or null. */
export async function claimGiftCode(code: unknown, secret: string | undefined): Promise<string | null> {
  return validShape(code) && inList(code, secret) ? giftId(code) : null;
}

/** Whether a gift ID from a cookie still belongs to a code in the list. */
export async function giftStillValid(id: string, secret: string | undefined): Promise<boolean> {
  for (const code of parseGiftCodes(secret)) {
    if (await giftId(code) === id) return true;
  }
  return false;
}

/** Browsers one season code works in (for example a phone, a laptop and a tablet). */
export const GIFT_BROWSERS = GIFT_CLAIM_RULE.maxRequests;

/** The gift settings from the runtime config. */
export function giftLists(config: { giftCodes?: unknown; giftCodesSeason?: unknown; giftSeasonEnd?: unknown }): GiftLists {
  return {
    codes: String(config.giftCodes || ''),
    seasonCodes: String(config.giftCodesSeason || ''),
    seasonEnd: String(config.giftSeasonEnd || ''),
  };
}

export interface GiftLists {
  /** NUXT_GIFT_CODES */
  codes?: string;
  /** NUXT_GIFT_CODES_SEASON */
  seasonCodes?: string;
  /** NUXT_GIFT_SEASON_END, YYYY-MM-DD */
  seasonEnd?: string;
}

export type GiftClaim =
  | { kind: 'standing'; id: string }
  | { kind: 'season'; id: string; expiresAt: number }
  | { kind: 'expired' }
  | null;

/**
 * The end of a season gift: the end of that day in the Netherlands in winter
 * time (23:00 UTC), like pakjesavondEnd. Null when the setting is missing or
 * not a date, so season codes then give nothing.
 */
export function seasonGiftEnd(date: string | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((date ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const end = Date.UTC(year, month - 1, day, 23);
  return new Date(end).getUTCDate() === day ? end : null;
}

/**
 * What a gift code gives. A standing code wins when a code is in both lists.
 * A season code after its end, or without an end date, is `expired`.
 */
export async function claimGift(code: unknown, lists: GiftLists, now = Date.now()): Promise<GiftClaim> {
  if (!validShape(code)) return null;
  const standing = inList(code, lists.codes);
  const season = inList(code, lists.seasonCodes);
  if (standing) return { kind: 'standing', id: await giftId(code) };
  if (!season) return null;
  const end = seasonGiftEnd(lists.seasonEnd);
  if (end === null || end <= now) return { kind: 'expired' };
  return { kind: 'season', id: await giftId(code), expiresAt: end };
}

/** Whether a gift ID from a cookie still belongs to a code in either list. */
export async function giftInLists(id: string, lists: GiftLists): Promise<boolean> {
  return (await giftStillValid(id, lists.codes)) || (await giftStillValid(id, lists.seasonCodes));
}
