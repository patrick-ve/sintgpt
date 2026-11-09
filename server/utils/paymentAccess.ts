// Pure access logic, free of h3 and Dodo imports so it is easy to test.
// Web Crypto keeps it working on both Node and Cloudflare Workers.

import { accessExpiry, isTierId, type TierId } from '../../utils/pricingTiers';

/** Tokens from before the tiers. They carry no tier and mean Gezin. */
const LEGACY_VERSION = 'v1';
const TOKEN_VERSION = 'v2';
const DAY_SECONDS = 60 * 60 * 24;
/** Browsers keep a cookie at most 400 days; a longer tier restores with the payment ID. */
export const MAX_COOKIE_SECONDS = 400 * DAY_SECONDS;
/** How long a v1 token lasted. */
export const LEGACY_TTL_SECONDS = 365 * DAY_SECONDS;

export type PaymentStatus = 'granted' | 'pending' | 'denied' | 'expired';

export type PaymentDecision =
  | { status: 'granted'; tier: TierId; expiresAt: number }
  | { status: Exclude<PaymentStatus, 'granted'> };

export interface PaymentFacts {
  status?: string | null;
  created_at?: string | null;
  product_cart?: { product_id: string }[] | null;
  refunds?: unknown[] | null;
  disputes?: unknown[] | null;
}

/** Which Dodo product sells which tier. A tier without a product is not on sale. */
export type TierProducts = Partial<Record<TierId, string>>;

/** What a valid access cookie says. */
export interface PaidAccess {
  paymentId: string;
  tier: TierId;
  /** Unix ms. */
  expiresAt: number;
}

// Statuses that can still end in a successful payment.
const PENDING_STATUSES = new Set([
  'processing',
  'requires_customer_action',
  'requires_merchant_action',
  'requires_confirmation',
  'requires_capture',
]);

export function tierForPayment(payment: PaymentFacts, products: TierProducts): TierId | null {
  for (const item of payment.product_cart ?? []) {
    for (const [tier, productId] of Object.entries(products)) {
      if (productId && item.product_id === productId && isTierId(tier)) return tier;
    }
  }
  return null;
}

/**
 * Access runs from the moment of payment, not from the moment someone claims
 * it, so restoring an old payment never starts a new period.
 */
export function decidePaymentAccess(
  payment: PaymentFacts,
  products: TierProducts,
  nowMs = Date.now(),
): PaymentDecision {
  const tier = tierForPayment(payment, products);
  if (!tier) return { status: 'denied' };
  if (payment.refunds?.length || payment.disputes?.length) return { status: 'denied' };
  if (payment.status && PENDING_STATUSES.has(payment.status)) return { status: 'pending' };
  if (payment.status !== 'succeeded') return { status: 'denied' };

  const paidAt = payment.created_at ? Date.parse(payment.created_at) : Number.NaN;
  const expiresAt = accessExpiry(tier, new Date(Number.isFinite(paidAt) ? paidAt : nowMs)).getTime();
  if (expiresAt <= nowMs) return { status: 'expired' };
  return { status: 'granted', tier, expiresAt };
}

/** Seconds the access cookie should live: until the access ends, within the browser's cap. */
export function cookieMaxAge(expiresAt: number, nowMs = Date.now()): number {
  return Math.max(0, Math.min(MAX_COOKIE_SECONDS, Math.floor((expiresAt - nowMs) / 1000)));
}

export function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string) {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^0-9a-f]/.test(hex)) {
    return null;
  }
  return Uint8Array.from(hex.match(/../g)!, pair => Number.parseInt(pair, 16));
}

async function sign(payload: string, secret: string) {
  return toHex(await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload)));
}

// Token format: v2.<paymentId>.<tier>.<expiry in unix seconds>.<hex HMAC-SHA256>
export async function signAccessToken(
  access: { paymentId: string; tier: TierId; expiresAt: number },
  secret: string,
): Promise<string> {
  const payload = `${TOKEN_VERSION}.${access.paymentId}.${access.tier}.${Math.floor(access.expiresAt / 1000)}`;
  return `${payload}.${await sign(payload, secret)}`;
}

/** A token in the format from before the tiers, for tests and old cookies. */
export async function signLegacyAccessToken(paymentId: string, secret: string, nowMs = Date.now()) {
  const payload = `${LEGACY_VERSION}.${paymentId}.${Math.floor(nowMs / 1000) + LEGACY_TTL_SECONDS}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  return (await readAccessToken(token, secret, nowMs)) !== null;
}

/** What a valid, unexpired token grants, or null. A v1 token means Gezin. */
export async function readAccessToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<PaidAccess | null> {
  const parts = token.split('.');
  let paymentId: string | undefined;
  let tier: string | undefined;
  let expiry: string | undefined;
  let signature: string | undefined;
  if (parts[0] === TOKEN_VERSION && parts.length === 5) {
    [, paymentId, tier, expiry, signature] = parts;
  } else if (parts[0] === LEGACY_VERSION && parts.length === 4) {
    [, paymentId, expiry, signature] = parts;
    tier = 'gezin';
  } else {
    return null;
  }
  if (!paymentId || !isTierId(tier) || !expiry || !signature) return null;
  if (!(Number(expiry) * 1000 > nowMs)) return null;

  const signatureBytes = fromHex(signature);
  if (!signatureBytes) return null;

  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signatureBytes,
    new TextEncoder().encode(parts.slice(0, -1).join('.')),
  );
  return valid ? { paymentId, tier, expiresAt: Number(expiry) * 1000 } : null;
}
