/**
 * Limits for poem generation: a short wait between requests and a maximum per
 * day. `applyRateLimit` is the rule itself. On Cloudflare it runs inside a
 * Durable Object, so the count is global (see server/durable/RateLimitCounter.ts).
 * `createRateLimiter` keeps the same counts in memory, for the Node build and
 * as a fallback when the Durable Object cannot be reached.
 */

export type RateLimitVerdict =
  | { ok: true; retry?: true }
  | { ok: false; reason: 'debounce' | 'limit'; retryAfterSeconds: number };

/** How many requests counted in the current window, without counting one. */
export function usedInWindow(entry: RateLimitEntry | undefined, now: number): number {
  return entry && now < entry.resetTime ? entry.count : 0;
}

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
  /** The attempt ID of the last counted poem, so a retry of it does not count again. */
  attempt?: string;
  /** Retries of that attempt so far. */
  retries?: number;
}

/**
 * A poem request from the page. The page makes a new ID per poem and sends
 * the same ID again when the connection dropped (`retry`).
 */
export interface PoemAttempt {
  id: string;
  retry: boolean;
}

/** IDs from crypto.randomUUID(), or the page's fallback. */
export const POEM_ATTEMPT_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/**
 * A dropped connection must not cost a poem: up to 3 retries of the last
 * counted poem, each within 10 minutes of the try before it, do not count and
 * skip the 10 s wait. The page retries twice by itself and once more when the
 * visitor tries again (usePoemGenerator). The server cannot tell whether the
 * visitor got the poem (in one case it finished 16 s before the phone
 * reported the drop), so a page that fakes retries gets at most 4 poems for 1.
 */
export const MAX_POEM_RETRIES = 3;
export const POEM_RETRY_WINDOW_MS = 10 * 60 * 1000;

/** The attempt in a poem request body, if it has a valid one. */
export function poemAttempt(body: unknown): PoemAttempt | undefined {
  const { attempt, retry } = (body ?? {}) as { attempt?: unknown; retry?: unknown };
  return typeof attempt === 'string' && POEM_ATTEMPT_PATTERN.test(attempt)
    ? { id: attempt, retry: retry === true }
    : undefined;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Free visitors, per IP: the one free poem the page offers. The page counts
 * it in localStorage, which a private window or cleared site data resets, so
 * the server holds the same number per connection.
 */
export const POEM_RATE_LIMIT = {
  maxRequests: 1,
  windowMs: DAY_MS,
  debounceMs: 10_000,
} as const satisfies RateLimitRule;

/**
 * Free visitors, per IP, while payments do not work (see paymentsStatus.ts).
 * Nobody can buy more poems then, so the page lifts its own limit and the
 * server allows a few free poems a day.
 */
export const PAYMENTS_DOWN_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: DAY_MS,
  debounceMs: 10_000,
} as const satisfies RateLimitRule;

/** The rule for a free visitor. */
export function freeRateLimit(paymentsOn: boolean): RateLimitRule {
  return paymentsOn ? POEM_RATE_LIMIT : PAYMENTS_DOWN_RATE_LIMIT;
}

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
 * Buyers of a tier with a fixed number of poems (Drie): one window that ends
 * when their access ends, so the count never resets before then.
 */
export function creditsRule(poems: number, expiresAt: number, now: number): RateLimitRule {
  return {
    maxRequests: poems,
    windowMs: Math.max(1, expiresAt - now),
    debounceMs: BUYER_RATE_LIMIT.debounceMs,
  };
}

/**
 * Decides one request. Returns the new entry when the request is allowed, and
 * no entry when it is refused, because a refused request does not count.
 */
export function applyRateLimit(
  entry: RateLimitEntry | undefined,
  now: number,
  rule: RateLimitRule,
  attempt?: PoemAttempt,
): { verdict: RateLimitVerdict; entry?: RateLimitEntry } {
  if (
    attempt?.retry
    && entry?.attempt === attempt.id
    && (entry.retries ?? 0) < MAX_POEM_RETRIES
    && now - entry.last < POEM_RETRY_WINDOW_MS
  ) {
    return { verdict: { ok: true, retry: true }, entry: { ...entry, retries: (entry.retries ?? 0) + 1, last: now } };
  }

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
    return { verdict: { ok: true }, entry: counted({ count: 1, resetTime: now + rule.windowMs, last: now }, attempt) };
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

  return { verdict: { ok: true }, entry: counted({ ...entry, count: entry.count + 1, last: now }, attempt) };
}

/** A counted poem replaces the attempt a retry may refer to. */
function counted(entry: RateLimitEntry, attempt?: PoemAttempt): RateLimitEntry {
  const { attempt: _attempt, retries: _retries, ...rest } = entry;
  return attempt ? { ...rest, attempt: attempt.id, retries: 0 } : rest;
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
  const defaultRule = { maxRequests, windowMs, debounceMs };

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
  const check = (key: string, now = Date.now(), rule: RateLimitRule = defaultRule, attempt?: PoemAttempt): RateLimitVerdict => {
    const { verdict, entry } = applyRateLimit(entries.get(key), now, rule, attempt);
    if (entry) {
      entries.set(key, entry);
      prune(now);
    }
    return verdict;
  };

  return {
    check,
    peek: (key: string, now = Date.now()) => usedInWindow(entries.get(key), now),
    /** Number of keys with a counter, for tests. */
    trackedCount: () => entries.size,
  };
}
