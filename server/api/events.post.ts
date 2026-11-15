import { ClientEventSchema, trackServerEvent } from '../utils/analytics';
import { paidAccess } from '../utils/paymentCookie';
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
  const { cloudflare } = event.context as { cloudflare?: { env?: { EVENTS_BURST?: RateLimitBindingLike; CLIENT_ERRORS_BURST?: RateLimitBindingLike } } };
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

  // Error events also reach the alerts, so they get a tighter limit of their
  // own. A refused one is dropped quietly: the page never reads the answer.
  if (name === 'Client error') {
    const errorLimiter = cloudflare?.env?.CLIENT_ERRORS_BURST;
    if (errorLimiter) {
      const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown';
      const key = await counterName({ kind: 'ip', id: rateLimitIp(ip) }, useRuntimeConfig(event).accessCookieSecret);
      if (!(await errorLimiter.limit({ key })).success) {
        setResponseStatus(event, 204);
        return null;
      }
    }
  }
  const access = await paidAccess(event);
  trackServerEvent(event, name, {
    ...fields,
    plan: access ? 'paid' : 'free',
    tier: access?.tier,
  });
  setResponseStatus(event, 204);
  return null;
});
