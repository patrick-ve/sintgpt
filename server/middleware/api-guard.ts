import { consola } from 'consola';
import { apiGuard, apiLimiter, type ApiLimiter } from '../utils/apiGuard';
import { counterName, rateLimitIp } from '../utils/poemRateLimit';

interface RateLimitBindingLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** The request IP as a keyed hash, like the poem counters: never the raw IP. */
async function ipKey(event: Parameters<typeof getHeader>[0]): Promise<string> {
  const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  return counterName({ kind: 'ip', id: rateLimitIp(ip) }, useRuntimeConfig(event).accessCookieSecret);
}

// Every /api request: safe headers, no writes from other sites, no oversized
// bodies, and a per-IP limit on the routes without one of their own
// (server/utils/apiGuard.ts).
export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!;
  if (!path.startsWith('/api/')) return;

  // Handlers that want caching or streaming set their own cache-control.
  setResponseHeaders(event, {
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store',
  });

  const refusal = apiGuard({
    method: event.method,
    path,
    fetchSite: getHeader(event, 'sec-fetch-site'),
    origin: getHeader(event, 'origin'),
    ownHost: getRequestHost(event),
    contentLength: getHeader(event, 'content-length'),
  });
  if (refusal) {
    consola.warn(`API request refused: ${refusal.status} ${event.method} ${path}`);
    throw createError({ statusCode: refusal.status, statusMessage: refusal.message });
  }

  const name = apiLimiter(event.method, path);
  if (!name) return;
  const { cloudflare } = event.context as { cloudflare?: { env?: Partial<Record<ApiLimiter, RateLimitBindingLike>> } };
  const limiter = cloudflare?.env?.[name];
  // Without the binding (Node build, tests) there is no limit here.
  if (!limiter) return;
  if (!(await limiter.limit({ key: `${name}:${await ipKey(event)}` })).success) {
    consola.warn(`Rate limit: ${name} ${path}`);
    setResponseHeader(event, 'retry-after', 60);
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Please wait a minute.', data: { reason: 'burst' } });
  }
});
