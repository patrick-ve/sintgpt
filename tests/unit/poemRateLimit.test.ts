import type { H3Event } from 'h3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPoemRateLimit, rateLimitIp } from '../../server/utils/poemRateLimit';

describe('rateLimitIp', () => {
  it('keeps an IPv4 address as it is', () => {
    expect(rateLimitIp('203.0.113.7')).toBe('203.0.113.7');
  });

  it('counts IPv6 per /64, so one host cannot rotate addresses', () => {
    expect(rateLimitIp('2001:db8:aa:bb:1:2:3:4')).toBe('2001:db8:aa:bb::/64');
    expect(rateLimitIp('2001:db8:aa:bb::99')).toBe('2001:db8:aa:bb::/64');
    expect(rateLimitIp('2001:0DB8:00aa::1')).toBe('2001:db8:aa:0::/64');
  });

  it('treats an IPv4-mapped address as IPv4', () => {
    expect(rateLimitIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });
});

describe('checkPoemRateLimit', () => {
  beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({ accessCookieSecret: 'test-secret' }));
  });
  afterEach(() => vi.unstubAllGlobals());

  function cloudflareEvent(env: Record<string, unknown>) {
    return { context: { cloudflare: { env } } } as unknown as H3Event;
  }

  function counterNamespace(answer: () => Promise<Response>) {
    const names: string[] = [];
    return {
      names,
      namespace: {
        idFromName: (name: string) => { names.push(name); return name; },
        get: () => ({ fetch: answer }),
      },
    };
  }

  it('asks the Durable Object, under a hashed name without the IP', async () => {
    const { names, namespace } = counterNamespace(async () =>
      Response.json({ ok: false, reason: 'limit', retryAfterSeconds: 60 }));
    const verdict = await checkPoemRateLimit(
      cloudflareEvent({ RATE_LIMITER: namespace, POEM_BURST: { limit: async () => ({ success: true }) } }),
      { kind: 'ip', id: '203.0.113.7' },
    );
    expect(verdict).toEqual({ ok: false, reason: 'limit', retryAfterSeconds: 60 });
    expect(names).toHaveLength(1);
    expect(names[0]).toMatch(/^ip:[0-9a-f]{32}$/);
    expect(names[0]).not.toContain('203.0.113.7');
  });

  it('gives a buyer and an IP different counters', async () => {
    const { names, namespace } = counterNamespace(async () => Response.json({ ok: true }));
    const event = cloudflareEvent({ RATE_LIMITER: namespace });
    await checkPoemRateLimit(event, { kind: 'ip', id: 'x' });
    await checkPoemRateLimit(event, { kind: 'buyer', id: 'x' });
    expect(names[0]).not.toBe(names[1]);
    expect(names[1]).toMatch(/^buyer:/);
  });

  it('refuses a fast repeat at the burst limit without asking the Durable Object', async () => {
    const answer = vi.fn(async () => Response.json({ ok: true }));
    const { namespace } = counterNamespace(answer);
    const verdict = await checkPoemRateLimit(
      cloudflareEvent({ RATE_LIMITER: namespace, POEM_BURST: { limit: async () => ({ success: false }) } }),
      { kind: 'ip', id: '203.0.113.8' },
    );
    expect(verdict).toEqual({ ok: false, reason: 'debounce', retryAfterSeconds: 10 });
    expect(answer).not.toHaveBeenCalled();
  });

  it('falls back to memory when the Durable Object fails, so visitors are not blocked', async () => {
    const { namespace } = counterNamespace(async () => { throw new Error('overloaded'); });
    const event = cloudflareEvent({ RATE_LIMITER: namespace });
    expect(await checkPoemRateLimit(event, { kind: 'ip', id: '203.0.113.9' })).toEqual({ ok: true });
    // The memory limiter still counts.
    expect(await checkPoemRateLimit(event, { kind: 'ip', id: '203.0.113.9' }))
      .toMatchObject({ ok: false, reason: 'debounce' });
  });

  it('uses memory outside Cloudflare', async () => {
    const event = { context: {} } as unknown as H3Event;
    expect(await checkPoemRateLimit(event, { kind: 'buyer', id: 'pay_mem' })).toEqual({ ok: true });
  });
});
