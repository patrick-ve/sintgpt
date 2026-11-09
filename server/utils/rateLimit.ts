/**
 * The free limit for poem generation, per client IP: a short wait between
 * requests and a maximum per day. State is in memory, so on Workers it is per
 * isolate, not global. Visitors with unlimited access skip it.
 */

export type RateLimitVerdict =
  | { ok: true }
  | { ok: false; reason: 'debounce' | 'limit'; retryAfterSeconds: number };

export interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  debounceMs?: number;
  /** Above this many tracked IPs, expired entries are removed. */
  maxTracked?: number;
}

export const POEM_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 24 * 60 * 60 * 1000,
  debounceMs: 10_000,
} as const;

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    maxRequests = POEM_RATE_LIMIT.maxRequests,
    windowMs = POEM_RATE_LIMIT.windowMs,
    debounceMs = POEM_RATE_LIMIT.debounceMs,
    maxTracked = 10_000,
  } = options;

  const usage = new Map<string, { count: number; resetTime: number }>();
  const lastRequest = new Map<string, number>();

  // Keeps memory bounded when many different IPs pass by.
  const prune = (now: number) => {
    if (usage.size > maxTracked) {
      for (const [ip, entry] of usage) {
        if (now >= entry.resetTime) usage.delete(ip);
      }
    }
    if (lastRequest.size > maxTracked) {
      for (const [ip, time] of lastRequest) {
        if (now - time >= debounceMs) lastRequest.delete(ip);
      }
    }
  };

  /**
   * Counts the request when it is allowed. A request counts before the body is
   * validated, so invalid requests use up the limit too.
   */
  const check = (ip: string, now = Date.now()): RateLimitVerdict => {
    const last = lastRequest.get(ip);
    if (last !== undefined && now - last < debounceMs) {
      return {
        ok: false,
        reason: 'debounce',
        retryAfterSeconds: Math.ceil((debounceMs - (now - last)) / 1000),
      };
    }

    const entry = usage.get(ip);
    if (!entry || now >= entry.resetTime) {
      usage.set(ip, { count: 1, resetTime: now + windowMs });
    } else if (entry.count >= maxRequests) {
      return {
        ok: false,
        reason: 'limit',
        retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
      };
    } else {
      entry.count += 1;
    }

    lastRequest.set(ip, now);
    prune(now);
    return { ok: true };
  };

  return {
    check,
    /** Number of IPs with a counter, for tests. */
    trackedCount: () => usage.size,
  };
}
