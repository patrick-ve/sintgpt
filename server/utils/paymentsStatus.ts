import type { H3Event } from 'h3';
import { shortLinkStore } from './poemShortLink';

/**
 * Remembers for a while that Dodo refuses checkouts, for example while live
 * payments wait for approval ("403 Live payments not enabled for merchant").
 * Then the site stops sending visitors to a payment that cannot work, and lets
 * them use the free daily limit instead.
 *
 * The flag sits in Workers KV, so every Cloudflare location sees it. It shares
 * the POEM_LINKS namespace: short link IDs never contain a colon, so the key
 * cannot clash with a poem. Builds without KV keep it in memory.
 */
const FLAG_KEY = 'status:payments-unavailable';
export const PAYMENTS_UNAVAILABLE_TTL_SECONDS = 15 * 60;

let memoryUntil = 0;

export function paymentsConfigured(event: H3Event): boolean {
  const config = useRuntimeConfig(event);
  return Boolean(config.dodoPaymentsApiKey && config.dodoProductId);
}

export async function paymentsAvailable(event: H3Event): Promise<boolean> {
  if (!paymentsConfigured(event)) return false;
  if (Date.now() < memoryUntil) return false;
  const store = shortLinkStore(event);
  if (!store) return true;
  try {
    return (await store.get(FLAG_KEY)) === null;
  } catch {
    // When KV fails, try the payment: Dodo gives the real answer.
    return true;
  }
}

export async function markPaymentsUnavailable(event: H3Event): Promise<void> {
  memoryUntil = Date.now() + PAYMENTS_UNAVAILABLE_TTL_SECONDS * 1000;
  const store = shortLinkStore(event);
  if (!store) return;
  try {
    // The free plan allows few KV writes a day. Write once per period.
    if ((await store.get(FLAG_KEY)) !== null) return;
    await store.put(FLAG_KEY, new Date().toISOString(), {
      expirationTtl: PAYMENTS_UNAVAILABLE_TTL_SECONDS,
    });
  } catch {
    // The flag in memory still covers this isolate.
  }
}
