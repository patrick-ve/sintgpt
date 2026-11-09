// Gift links: https://sintgpt.com/?cadeau=<code> gives someone Hele familie
// without a payment, for example a family member who tests the site.
//
// The codes sit in the Worker secret NUXT_GIFT_CODES (comma-separated, each
// at least 16 characters; make one with `openssl rand -hex 16`). The cookie
// holds a hash of the code, never the code. Removing a code from the secret
// ends that access at once: paidAccess checks the list on every request.

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

/** The gift ID for a code in the list, or null. */
export async function claimGiftCode(code: unknown, secret: string | undefined): Promise<string | null> {
  if (typeof code !== 'string' || code.length < MIN_CODE_LENGTH || code.length > 200) return null;
  let found = false;
  for (const known of parseGiftCodes(secret)) found = sameText(known, code) || found;
  return found ? giftId(code) : null;
}

/** Whether a gift ID from a cookie still belongs to a code in the list. */
export async function giftStillValid(id: string, secret: string | undefined): Promise<boolean> {
  for (const code of parseGiftCodes(secret)) {
    if (await giftId(code) === id) return true;
  }
  return false;
}
