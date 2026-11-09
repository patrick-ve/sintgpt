/**
 * Limits for poem generation: a short wait between requests and a maximum per
 * day. `applyRateLimit` is the rule itself. On Cloudflare it runs inside a
 * Durable Object, so the count is global (see server/durable/RateLimitCounter.ts).
 * `createRateLimiter` keeps the same counts in memory, for the Node build and
 * as a fallback when the Durable Object cannot be reached.
 */

export type RateLimitVerdict =
  | { ok: true }
  | { ok: false; reason: 'debounce' | 'limit'; retryAfterSeconds: number };

export interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  debounceMs: number;
}

/** The state for one IP or one buyer. */
export interface RateLimitEntry {
  count: number;
  /** End of the current window, in ms since the epoch. */
  resetTime: number;
  /** Time of the last allowed request. */
  last: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Free visitors, per IP. */
export const POEM_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: DAY_MS,
  debounceMs: 10_000,
} as const satisfies RateLimitRule;

/**
 * Buyers with unlimited access, per payment. High enough that no family
 * notices it, low enough that a leaked cookie or a script cannot run up the
 * AI Gateway bill.
 */
export const BUYER_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: DAY_MS,
  debounceMs: 10_000,
} as const satisfies RateLimitRule;

/**
 * Decides one request. Returns the new entry when the request is allowed, and
 * no entry when it is refused, because a refused request does not count.
 */
export function applyRateLimit(
  entry: RateLimitEntry | undefined,
  now: number,
  rule: RateLimitRule,
): { verdict: RateLimitVerdict; entry?: RateLimitEntry } {
  if (entry && now - entry.last < rule.debounceMs) {
    return {
      verdict: {
        ok: false,
        reason: 'debounce',
        retryAfterSeconds: Math.ceil((rule.debounceMs - (now - entry.last)) / 1000),
      },
    };
  }

  if (!entry || now >= entry.resetTime) {
    return { verdict: { ok: true }, entry: { count: 1, resetTime: now + rule.windowMs, last: now } };
  }

  if (entry.count >= rule.maxRequests) {
    return {
      verdict: {
        ok: false,
        reason: 'limit',
        retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
      },
    };
  }

  return { verdict: { ok: true }, entry: { ...entry, count: entry.count + 1, last: now } };
}

export interface RateLimiterOptions extends Partial<RateLimitRule> {
  /** Above this many tracked keys, expired entries are removed. */
  maxTracked?: number;
}

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    maxRequests = POEM_RATE_LIMIT.maxRequests,
    windowMs = POEM_RATE_LIMIT.windowMs,
    debounceMs = POEM_RATE_LIMIT.debounceMs,
    maxTracked = 10_000,
  } = options;
  const rule = { maxRequests, windowMs, debounceMs };

  const entries = new Map<string, RateLimitEntry>();

  // Keeps memory bounded when many different keys pass by.
  const prune = (now: number) => {
    if (entries.size <= maxTracked) return;
    for (const [key, entry] of entries) {
      if (now >= entry.resetTime && now - entry.last >= debounceMs) entries.delete(key);
    }
  };

  /**
   * Counts the request when it is allowed. A request counts before the body is
   * validated, so invalid requests use up the limit too.
   */
  const check = (key: string, now = Date.now()): RateLimitVerdict => {
    const { verdict, entry } = applyRateLimit(entries.get(key), now, rule);
    if (entry) {
      entries.set(key, entry);
      prune(now);
    }
    return verdict;
  };

  return {
    check,
    /** Number of keys with a counter, for tests. */
    trackedCount: () => entries.size,
  };
}
