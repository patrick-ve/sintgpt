import type { H3Event } from 'h3';
import { consola } from 'consola';
import {
  BUYER_RATE_LIMIT,
  createRateLimiter,
  FREE_REWRITE_LIMIT,
  GIFT_CLAIM_RULE,
  POEM_PREVIEW_LIMIT,
  POEM_RATE_LIMIT,
  type PoemAttempt,
  type RateLimitRule,
  type RateLimitVerdict,
} from './rateLimit';

/**
 * Who a limit applies to: a free visitor by IP, a buyer by payment, or the
 * browsers that claimed one season gift code (by gift ID). `rewrite` and
 * `preview` count a free visitor's free rewrite and poems written before
 * payment, by IP, apart from the free poem.
 */
export type RateLimitSubject = { kind: 'ip' | 'buyer' | 'gift' | 'rewrite' | 'preview'; id: string };

interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(url: string, init: RequestInit): Promise<Response> };
}

interface RateLimitBindingLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface RateLimitEnv {
  RATE_LIMITER?: DurableObjectNamespaceLike;
  POEM_BURST?: RateLimitBindingLike;
}

const RULES: Record<RateLimitSubject['kind'], RateLimitRule> = {
  ip: POEM_RATE_LIMIT,
  buyer: BUYER_RATE_LIMIT,
  gift: GIFT_CLAIM_RULE,
  rewrite: FREE_REWRITE_LIMIT,
  preview: POEM_PREVIEW_LIMIT,
};

// Per isolate: for the Node build, and when Cloudflare cannot be reached.
// Drie buyers use the buyer limiter with their own rule.
const memory = {
  ip: createRateLimiter(POEM_RATE_LIMIT),
  buyer: createRateLimiter(BUYER_RATE_LIMIT),
  gift: createRateLimiter(GIFT_CLAIM_RULE),
  rewrite: createRateLimiter(FREE_REWRITE_LIMIT),
  preview: createRateLimiter(POEM_PREVIEW_LIMIT),
};

/**
 * One IPv6 host usually has a whole /64 and can pick any address in it, so
 * IPv6 counts per /64. IPv4 counts per address.
 */
export function rateLimitIp(ip: string): string {
  if (!ip.includes(':')) return ip;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1]!;
  const [head = '', tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::')
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left;
  return `${groups.slice(0, 4).map(group => group.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

/**
 * The name of the counter. A keyed hash, so Cloudflare stores no IP addresses
 * or payment IDs, and nobody can work out the name from an IP.
 */
export async function counterName(subject: RateLimitSubject, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${subject.kind}:${subject.id}`);
  const digest = secret
    ? await crypto.subtle.sign(
        'HMAC',
        await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        data,
      )
    : await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${subject.kind}:${hex.slice(0, 32)}`;
}

/**
 * Counts one poem request for the subject.
 *
 * On Cloudflare there are two layers:
 * 1. The Rate Limiting binding (`POEM_BURST`) refuses fast repeats. It is
 *    approximate and per location, but costs nothing.
 * 2. A Durable Object per subject (`RATE_LIMITER`) keeps the strict, global
 *    count per day.
 * If either is missing or fails, the in-memory limiter decides, so a
 * Cloudflare problem never blocks all visitors.
 */
export async function checkPoemRateLimit(
  event: H3Event,
  subject: RateLimitSubject,
  rule: RateLimitRule = RULES[subject.kind],
  attempt?: PoemAttempt,
): Promise<RateLimitVerdict> {
  const env = (event.context as { cloudflare?: { env?: RateLimitEnv } }).cloudflare?.env;

  if (env?.RATE_LIMITER) {
    try {
      const name = await counterName(subject, useRuntimeConfig(event).accessCookieSecret);

      // A retry after a dropped connection comes within seconds; the Durable
      // Object decides whether it really is one.
      // Gift claims are not poems: a phone and a laptop may claim in the same minute.
      if (subject.kind !== 'gift' && !attempt?.retry && env.POEM_BURST && !(await env.POEM_BURST.limit({ key: name })).success) {
        return { ok: false, reason: 'debounce', retryAfterSeconds: Math.ceil(rule.debounceMs / 1000) };
      }

      const counter = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(name));
      const res = await counter.fetch('https://rate-limit.internal/check', {
        method: 'POST',
        body: JSON.stringify({ ...rule, attempt }),
      });
      if (res.ok) return (await res.json()) as RateLimitVerdict;
      consola.warn(`Rate limit counter answered ${res.status}, using memory`);
    } catch (error: any) {
      consola.warn('Rate limit counter failed, using memory:', error?.message);
    }
  }

  return memory[subject.kind].check(subject.id, Date.now(), rule, attempt);
}

/**
 * Gives back the poem of an attempt that came back without text, so it does
 * not count (releaseAttempt in rateLimit.ts). Returns whether it was given back.
 */
export async function releasePoemCount(event: H3Event, subject: RateLimitSubject, attemptId: string): Promise<boolean> {
  const env = (event.context as { cloudflare?: { env?: RateLimitEnv } }).cloudflare?.env;
  if (env?.RATE_LIMITER) {
    try {
      const name = await counterName(subject, useRuntimeConfig(event).accessCookieSecret);
      const counter = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(name));
      const res = await counter.fetch('https://rate-limit.internal/release', {
        method: 'POST',
        body: JSON.stringify({ attempt: attemptId }),
      });
      if (res.ok) return ((await res.json()) as { released: boolean }).released;
    } catch (error: any) {
      consola.warn('Rate limit counter failed, using memory:', error?.message);
    }
  }
  return memory[subject.kind].release(subject.id, attemptId);
}

/** How many requests the subject's current window has used. Counts nothing. */
export async function poemsUsed(event: H3Event, subject: RateLimitSubject): Promise<number> {
  const env = (event.context as { cloudflare?: { env?: RateLimitEnv } }).cloudflare?.env;
  if (env?.RATE_LIMITER) {
    try {
      const name = await counterName(subject, useRuntimeConfig(event).accessCookieSecret);
      const counter = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(name));
      const res = await counter.fetch('https://rate-limit.internal/peek', { method: 'POST' });
      if (res.ok) return ((await res.json()) as { used: number }).used;
    } catch (error: any) {
      consola.warn('Rate limit counter failed, using memory:', error?.message);
    }
  }
  return memory[subject.kind].peek(subject.id);
}
