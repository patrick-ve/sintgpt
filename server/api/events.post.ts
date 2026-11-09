import { ClientEventSchema, trackServerEvent } from '../utils/analytics';
import { unlimitedAccessPaymentId } from '../utils/paymentCookie';
import { counterName, rateLimitIp } from '../utils/poemRateLimit';

interface RateLimitBindingLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Browser events (clicks, page views). The page sends them with
 * navigator.sendBeacon, so the answer is never read: 204 or an error status.
 */
export default defineEventHandler(async (event) => {
  // A Rate Limiting binding per IP stops one client from flooding the
  // dataset. The key is a keyed hash, like the poem counters.
  const { cloudflare } = event.context as { cloudflare?: { env?: { EVENTS_BURST?: RateLimitBindingLike } } };
  const limiter = cloudflare?.env?.EVENTS_BURST;
  if (limiter) {
    const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const key = await counterName({ kind: 'ip', id: rateLimitIp(ip) }, useRuntimeConfig(event).accessCookieSecret);
    if (!(await limiter.limit({ key })).success) {
      setResponseStatus(event, 429);
      return null;
    }
  }

  const parsed = ClientEventSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    setResponseStatus(event, 400);
    return null;
  }

  const { name, ...fields } = parsed.data;
  trackServerEvent(event, name, {
    ...fields,
    plan: (await unlimitedAccessPaymentId(event)) ? 'paid' : 'free',
  });
  setResponseStatus(event, 204);
  return null;
});
