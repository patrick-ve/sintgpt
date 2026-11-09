import { describe, expect, it } from 'vitest';
import { createRateLimiter, POEM_RATE_LIMIT } from '../../server/utils/rateLimit';

const HOUR = 60 * 60 * 1000;
const T0 = 1_800_000_000_000;

describe('createRateLimiter', () => {
  it('uses the documented free limit: 3 per day, 10 s apart', () => {
    expect(POEM_RATE_LIMIT).toEqual({ maxRequests: 3, windowMs: 24 * HOUR, debounceMs: 10_000 });
  });

  it('allows three requests a day and refuses the fourth', () => {
    const limiter = createRateLimiter();
    expect(limiter.check('1.1.1.1', T0)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 20_000)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 40_000)).toEqual({ ok: true });

    const verdict = limiter.check('1.1.1.1', T0 + 60_000);
    expect(verdict).toMatchObject({ ok: false, reason: 'limit' });
    // Until the day that started with the first request is over.
    expect(verdict.ok || verdict.retryAfterSeconds).toBe((24 * HOUR - 60_000) / 1000);
  });

  it('refuses a request within 10 seconds and says how long to wait', () => {
    const limiter = createRateLimiter();
    limiter.check('1.1.1.1', T0);
    expect(limiter.check('1.1.1.1', T0 + 2_500)).toEqual({
      ok: false,
      reason: 'debounce',
      retryAfterSeconds: 8,
    });
    expect(limiter.check('1.1.1.1', T0 + 10_000)).toEqual({ ok: true });
  });

  it('does not count a refused request', () => {
    const limiter = createRateLimiter();
    limiter.check('1.1.1.1', T0);
    // Ten fast retries are all refused, and none of them uses up the limit.
    for (let i = 1; i <= 10; i++) limiter.check('1.1.1.1', T0 + i * 100);
    expect(limiter.check('1.1.1.1', T0 + 20_000)).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1', T0 + 40_000)).toEqual({ ok: true });
  });

  it('keeps a separate count per IP', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1', T0 + i * 20_000);
    expect(limiter.check('1.1.1.1', T0 + 60_000).ok).toBe(false);
    expect(limiter.check('2.2.2.2', T0 + 60_000)).toEqual({ ok: true });
  });

  it('starts a new day after the window', () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 3; i++) limiter.check('1.1.1.1', T0 + i * 20_000);
    expect(limiter.check('1.1.1.1', T0 + 24 * HOUR)).toEqual({ ok: true });
  });

  it('forgets expired IPs when many are tracked, so memory stays bounded', () => {
    const limiter = createRateLimiter({ maxTracked: 100 });
    for (let i = 0; i < 100; i++) limiter.check(`10.0.0.${i}`, T0);
    expect(limiter.trackedCount()).toBe(100);
    // A day later the old entries have expired and are removed.
    limiter.check('10.0.1.1', T0 + 25 * HOUR);
    expect(limiter.trackedCount()).toBe(1);
  });

  it('keeps entries that still count, even above the threshold', () => {
    const limiter = createRateLimiter({ maxTracked: 10 });
    for (let i = 0; i < 20; i++) limiter.check(`10.0.0.${i}`, T0 + i);
    expect(limiter.trackedCount()).toBe(20);
    expect(limiter.check('10.0.0.0', T0 + 30_000)).toEqual({ ok: true });
  });
});
