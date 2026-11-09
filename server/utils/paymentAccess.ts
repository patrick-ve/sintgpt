// Pure access logic, free of h3 and Dodo imports so it is easy to test.
// Web Crypto keeps it working on both Node and Cloudflare Workers.

const TOKEN_VERSION = 'v1';
export const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 365;

export type PaymentDecision = 'granted' | 'pending' | 'denied';

export interface PaymentFacts {
  status?: string | null;
  product_cart?: { product_id: string }[] | null;
  refunds?: unknown[] | null;
  disputes?: unknown[] | null;
}

// Statuses that can still end in a successful payment.
const PENDING_STATUSES = new Set([
  'processing',
  'requires_customer_action',
  'requires_merchant_action',
  'requires_confirmation',
  'requires_capture',
]);

export function decidePaymentAccess(
  payment: PaymentFacts,
  productId: string,
): PaymentDecision {
  const hasProduct = payment.product_cart?.some(
    item => item.product_id === productId,
  );
  if (!hasProduct) return 'denied';
  if (payment.refunds?.length || payment.disputes?.length) return 'denied';
  if (payment.status === 'succeeded') return 'granted';
  if (payment.status && PENDING_STATUSES.has(payment.status)) return 'pending';
  return 'denied';
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

// Token format: v1.<paymentId>.<expiry in unix seconds>.<hex HMAC-SHA256>
export async function signAccessToken(
  paymentId: string,
  secret: string,
  nowMs = Date.now(),
): Promise<string> {
  const expiry = Math.floor(nowMs / 1000) + ACCESS_TTL_SECONDS;
  const payload = `${TOKEN_VERSION}.${paymentId}.${expiry}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toHex(signature)}`;
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  return (await readAccessToken(token, secret, nowMs)) !== null;
}

/** The payment ID in a valid, unexpired token, or null. */
export async function readAccessToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): Promise<string | null> {
  const [version, paymentId, expiry, signature, ...rest] = token.split('.');
  if (version !== TOKEN_VERSION || !paymentId || !expiry || !signature || rest.length) {
    return null;
  }
  if (!(Number(expiry) * 1000 > nowMs)) return null;

  const signatureBytes = fromHex(signature);
  if (!signatureBytes) return null;

  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signatureBytes,
    new TextEncoder().encode(`${version}.${paymentId}.${expiry}`),
  );
  return valid ? paymentId : null;
}
