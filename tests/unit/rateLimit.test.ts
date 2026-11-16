import { describe, expect, it } from 'vitest';
import {
  applyRateLimit,
  BUYER_RATE_LIMIT,
  createRateLimiter,
  freeRateLimit,
  MAX_POEM_RETRIES,
  PAYMENTS_DOWN_RATE_LIMIT,
  POEM_RATE_LIMIT,
  POEM_RETRY_WINDOW_MS,
  poemAttempt,
} from '../../server/utils/rateLimit';

const HOUR = 60 * 60 * 1000;
const T0 = 1_800_000_000_000;

describe('createRateLimiter', () => {
  it('uses the documented free limit: 1 per day, 10 s apart', () => {
    expect(POEM_RATE_LIMIT).toEqual({ maxRequests: 1, windowMs: 24 * HOUR, debounceMs: 10_000 });
  });

  it('allows 3 free poems a day only while payments do not work', () => {
    expect(PAYMENTS_DOWN_RATE_LIMIT).toEqual({ maxRequests: 3, windowMs: 24 * HOUR, debounceMs: 10_000 });
    expect(freeRateLimit(true)).toBe(POEM_RATE_LIMIT);
    expect(freeRateLimit(false)).toBe(PAYMENTS_DOWN_RATE_LIMIT);
  });

  it('refuses a second free poem from the same connection, as from a private window', () => {
    const limiter = createRateLimiter(POEM_RATE_LIMIT);
    expect(limiter.check('1.1.1.1', T0)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 20_000)).toMatchObject({ ok: false, reason: 'limit' });
    expect(limiter.check('2.2.2.2', T0 + 20_000)).toEqual({ ok: true });
  });

  it('allows three requests a day and refuses the fourth', () => {
    const limiter = createRateLimiter(PAYMENTS_DOWN_RATE_LIMIT);
    expect(limiter.check('1.1.1.1', T0)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 20_000)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 40_000)).toEqual({ ok: true });

    const verdict = limiter.check('1.1.1.1', T0 + 60_000);
    expect(verdict).toMatchObject({ ok: false, reason: 'limit' });
    // Until the day that started with the first request is over.
    expect(verdict.ok || verdict.retryAfterSeconds).toBe((24 * HOUR - 60_000) / 1000);
  });

  it('refuses a request within 10 seconds and says how long to wait', () => {
    const limiter = createRateLimiter(PAYMENTS_DOWN_RATE_LIMIT);
    limiter.check('1.1.1.1', T0);
    expect(limiter.check('1.1.1.1', T0 + 2_500)).toEqual({
      ok: false,
      reason: 'debounce',
      retryAfterSeconds: 8,
    });
    expect(limiter.check('1.1.1.1', T0 + 10_000)).toEqual({ ok: true });
  });

  it('does not count a refused request', () => {
    const limiter = createRateLimiter(PAYMENTS_DOWN_RATE_LIMIT);
    limiter.check('1.1.1.1', T0);
    // Ten fast retries are all refused, and none of them uses up the limit.
    for (let i = 1; i <= 10; i++) limiter.check('1.1.1.1', T0 + i * 100);
    expect(limiter.check('1.1.1.1', T0 + 20_000)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 40_000)).toEqual({ ok: true });
  });

  it('keeps a separate count per IP', () => {
    const limiter = createRateLimiter(PAYMENTS_DOWN_RATE_LIMIT);
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1', T0 + i * 20_000);
    expect(limiter.check('1.1.1.1', T0 + 60_000).ok).toBe(false);
    expect(limiter.check('2.2.2.2', T0 + 60_000)).toEqual({ ok: true });
  });

  it('starts a new day after the window', () => {
    const limiter = createRateLimiter(PAYMENTS_DOWN_RATE_LIMIT);
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1', T0 + i * 20_000);
    expect(limiter.check('1.1.1.1', T0 + 24 * HOUR)).toEqual({ ok: true });
  });

  it('forgets expired IPs when many are tracked, so memory stays bounded', () => {
    const limiter = createRateLimiter({ ...PAYMENTS_DOWN_RATE_LIMIT, maxTracked: 100 });
    for (let i = 0; i < 100; i++) limiter.check(`10.0.0.${i}`, T0);
    expect(limiter.trackedCount()).toBe(100);
    // A day later the old entries have expired and are removed.
    limiter.check('10.0.1.1', T0 + 25 * HOUR);
    expect(limiter.trackedCount()).toBe(1);
  });

  it('keeps entries that still count, even above the threshold', () => {
    const limiter = createRateLimiter({ ...PAYMENTS_DOWN_RATE_LIMIT, maxTracked: 10 });
    for (let i = 0; i < 20; i++) limiter.check(`10.0.0.${i}`, T0 + i);
    expect(limiter.trackedCount()).toBe(20);
    expect(limiter.check('10.0.0.0', T0 + 30_000)).toEqual({ ok: true });
  });
});

describe('applyRateLimit', () => {
  it('starts a window on the first request', () => {
    expect(applyRateLimit(undefined, T0, POEM_RATE_LIMIT)).toEqual({
      verdict: { ok: true },
      entry: { count: 1, resetTime: T0 + 24 * HOUR, last: T0 },
    });
  });

  it('returns no entry for a refused request, so it is not stored', () => {
    const entry = { count: 3, resetTime: T0 + HOUR, last: T0 };
    const result = applyRateLimit(entry, T0 + 60_000, POEM_RATE_LIMIT);
    expect(result.verdict).toMatchObject({ ok: false, reason: 'limit' });
    expect(result.entry).toBeUndefined();
  });

  it('does not change the entry it gets', () => {
    const entry = { count: 1, resetTime: T0 + HOUR, last: T0 };
    applyRateLimit(entry, T0 + 60_000, POEM_RATE_LIMIT);
    expect(entry).toEqual({ count: 1, resetTime: T0 + HOUR, last: T0 });
  });
});

describe('BUYER_RATE_LIMIT', () => {
  it('allows 100 poems a day per payment, 10 s apart', () => {
    expect(BUYER_RATE_LIMIT).toEqual({ maxRequests: 100, windowMs: 24 * HOUR, debounceMs: 10_000 });
  });

  it('refuses the 101st poem in a day', () => {
    const limiter = createRateLimiter(BUYER_RATE_LIMIT);
    for (let i = 0; i < 100; i++) {
      expect(limiter.check('pay_1', T0 + i * 10_000).ok).toBe(true);
    }
    expect(limiter.check('pay_1', T0 + 100 * 10_000)).toMatchObject({ ok: false, reason: 'limit' });
  });
});

describe('retries after a dropped connection', () => {
  const first = { id: 'attempt-1234', retry: false };
  const again = { id: 'attempt-1234', retry: true };
  const counted = applyRateLimit(undefined, T0, POEM_RATE_LIMIT, first).entry!;

  it('remembers the attempt of a counted poem', () => {
    expect(counted).toEqual({ count: 1, resetTime: T0 + 24 * HOUR, last: T0, attempt: 'attempt-1234', retries: 0 });
  });

  it('lets 3 retries of that attempt through without counting or waiting 10 s', () => {
    let entry = counted;
    for (let retry = 1; retry <= MAX_POEM_RETRIES; retry++) {
      const result = applyRateLimit(entry, entry.last + 2_000, POEM_RATE_LIMIT, again);
      expect(result.verdict).toEqual({ ok: true, retry: true });
      entry = result.entry!;
      expect(entry).toMatchObject({ count: 1, retries: retry });
    }
    // The fourth is a new poem, and the free one is used.
    expect(applyRateLimit(entry, entry.last + 20_000, POEM_RATE_LIMIT, again).verdict)
      .toMatchObject({ ok: false, reason: 'limit' });
  });

  it('counts a retry that comes too late, has another ID or does not say it is a retry', () => {
    const late = counted.last + POEM_RETRY_WINDOW_MS;
    expect(applyRateLimit(counted, late, POEM_RATE_LIMIT, again).verdict).toMatchObject({ ok: false, reason: 'limit' });
    expect(applyRateLimit(counted, T0 + 20_000, POEM_RATE_LIMIT, { id: 'other-12345', retry: true }).verdict)
      .toMatchObject({ ok: false, reason: 'limit' });
    expect(applyRateLimit(counted, T0 + 20_000, POEM_RATE_LIMIT, first).verdict).toMatchObject({ ok: false, reason: 'limit' });
  });

  it('forgets the attempt when another poem counts', () => {
    const next = applyRateLimit(counted, T0 + 20_000, BUYER_RATE_LIMIT).entry!;
    expect(next).toEqual({ count: 2, resetTime: counted.resetTime, last: T0 + 20_000 });
    expect(applyRateLimit(next, T0 + 40_000, BUYER_RATE_LIMIT, again).verdict).toEqual({ ok: true });
  });

  it('reads the attempt from the request body, and only a valid ID', () => {
    expect(poemAttempt({ attempt: '0b6f2c4e-8f1a-4d4b-9a51-2f0c9e2d7a11', retry: true }))
      .toEqual({ id: '0b6f2c4e-8f1a-4d4b-9a51-2f0c9e2d7a11', retry: true });
    expect(poemAttempt({ attempt: 'abcdefgh' })).toEqual({ id: 'abcdefgh', retry: false });
    for (const body of [null, {}, { attempt: 'short' }, { attempt: 'has spaces in it' }, { attempt: 12345678 }]) {
      expect(poemAttempt(body)).toBeUndefined();
    }
  });
});
