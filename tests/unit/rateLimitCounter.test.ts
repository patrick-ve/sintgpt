import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitCounter, type CounterState } from '../../server/durable/RateLimitCounter';
import { creditsRule, POEM_RATE_LIMIT } from '../../server/utils/rateLimit';

const T0 = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function fakeState() {
  const data = new Map<string, unknown>();
  const alarms: number[] = [];
  const state: CounterState = {
    storage: {
      get: async <T>(key: string) => data.get(key) as T | undefined,
      put: async (key, value) => { data.set(key, value); },
      deleteAll: async () => { data.clear(); },
      setAlarm: async (time) => { alarms.push(time); },
    },
  };
  return { state, data, alarms };
}

async function check(counter: RateLimitCounter) {
  const res = await counter.fetch(new Request('https://rate-limit.internal/check', {
    method: 'POST',
    body: JSON.stringify(POEM_RATE_LIMIT),
  }));
  return res.json();
}

describe('RateLimitCounter (Durable Object)', () => {
  beforeEach(() => vi.useFakeTimers({ now: T0 }));
  afterEach(() => vi.useRealTimers());

  it('applies the rule from the request and keeps the count in storage', async () => {
    const { state, data } = fakeState();
    const counter = new RateLimitCounter(state);
    for (let i = 0; i < 3; i++) {
      expect(await check(counter)).toEqual({ ok: true });
      vi.advanceTimersByTime(20_000);
    }
    expect(await check(counter)).toMatchObject({ ok: false, reason: 'limit' });
    expect(data.get('entry')).toMatchObject({ count: 3 });
  });

  it('survives a restart, because the count is in storage', async () => {
    const { state } = fakeState();
    await check(new RateLimitCounter(state));
    expect(await check(new RateLimitCounter(state))).toMatchObject({ ok: false, reason: 'debounce' });
  });

  it('sets one alarm per window, at its end, and deletes everything then', async () => {
    const { state, data, alarms } = fakeState();
    const counter = new RateLimitCounter(state);
    await check(counter);
    vi.advanceTimersByTime(20_000);
    await check(counter);
    expect(alarms).toEqual([T0 + DAY]);

    await counter.alarm();
    expect(data.size).toBe(0);
  });
});

describe('Drie: 3 poems until pakjesavond', () => {
  beforeEach(() => vi.useFakeTimers({ now: T0 }));
  afterEach(() => vi.useRealTimers());

  const peek = async (counter: RateLimitCounter) =>
    (await (await counter.fetch(new Request('https://rate-limit.internal/peek', { method: 'POST' }))).json()).used;

  it('allows 3 poems in one window that lasts until the access ends, and peeks without counting', async () => {
    const { state, alarms } = fakeState();
    const counter = new RateLimitCounter(state);
    const expiresAt = T0 + 26 * DAY;
    const ask = async () => (await counter.fetch(new Request('https://rate-limit.internal/check', {
      method: 'POST',
      body: JSON.stringify(creditsRule(3, expiresAt, Date.now())),
    }))).json();

    expect(await peek(counter)).toBe(0);
    for (let i = 0; i < 3; i++) {
      expect(await ask()).toEqual({ ok: true });
      vi.advanceTimersByTime(2 * DAY);
    }
    expect(await peek(counter)).toBe(3);
    expect(await peek(counter)).toBe(3);
    expect(await ask()).toMatchObject({ ok: false, reason: 'limit' });
    // The data goes when the access ends, not after a day.
    expect(alarms).toEqual([expiresAt]);
  });
});
