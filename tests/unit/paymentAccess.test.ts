import { describe, expect, it } from 'vitest';
import {
  cookieMaxAge,
  decidePaymentAccess,
  MAX_COOKIE_SECONDS,
  readAccessToken,
  signAccessToken,
  signLegacyAccessToken,
  verifyAccessToken,
} from '../../server/utils/paymentAccess';
import { dodoEnvironment } from '../../server/utils/dodo';
import {
  accessExpiry,
  fillSeasons,
  formatPrice,
  pakjesavondEnd,
  pricePerPoemCents,
  RECOMMENDED_TIER,
  tiersAbove,
  TIERS,
} from '../../utils/pricingTiers';

const PRODUCTS = { drie: 'pdt_drie', gezin: 'pdt_gezin', familie: 'pdt_familie' };
const NOW = Date.parse('2026-11-09T12:00:00Z');
const paid = {
  status: 'succeeded',
  created_at: '2026-11-09T11:00:00Z',
  product_cart: [{ product_id: 'pdt_gezin' }],
  refunds: [],
  disputes: [],
};
const DAY = 24 * 60 * 60 * 1000;

describe('decidePaymentAccess', () => {
  it('grants Gezin for a year from the payment', () => {
    expect(decidePaymentAccess(paid, PRODUCTS, NOW)).toEqual({
      status: 'granted',
      tier: 'gezin',
      expiresAt: Date.parse('2026-11-09T11:00:00Z') + 365 * DAY,
    });
  });

  it('gives each product its own tier and period', () => {
    const drie = decidePaymentAccess({ ...paid, product_cart: [{ product_id: 'pdt_drie' }] }, PRODUCTS, NOW);
    expect(drie).toEqual({ status: 'granted', tier: 'drie', expiresAt: Date.parse('2026-12-05T23:00:00Z') });
    const familie = decidePaymentAccess({ ...paid, product_cart: [{ product_id: 'pdt_familie' }] }, PRODUCTS, NOW);
    expect(familie).toEqual({ status: 'granted', tier: 'familie', expiresAt: Date.parse('2027-12-05T23:00:00Z') });
  });

  it('denies a payment for another product, or for a tier that is not on sale', () => {
    expect(decidePaymentAccess({ ...paid, product_cart: [{ product_id: 'pdt_other' }] }, PRODUCTS, NOW).status).toBe('denied');
    expect(decidePaymentAccess({ ...paid, product_cart: [{ product_id: 'pdt_drie' }] }, { gezin: 'pdt_gezin' }, NOW).status).toBe('denied');
  });

  it.each([
    ['refunded', { refunds: [{}] }],
    ['disputed', { disputes: [{}] }],
    ['failed', { status: 'failed' }],
    ['cancelled', { status: 'cancelled' }],
    ['abandoned', { status: 'requires_payment_method' }],
    ['without status', { status: null }],
    ['without cart', { product_cart: null }],
  ])('denies a payment that is %s', (_name, change) => {
    expect(decidePaymentAccess({ ...paid, ...change }, PRODUCTS, NOW).status).toBe('denied');
  });

  it('reports a payment that is still processing as pending', () => {
    expect(decidePaymentAccess({ ...paid, status: 'processing' }, PRODUCTS, NOW).status).toBe('pending');
  });

  it('does not start a new period when an old payment is restored', () => {
    const old = { ...paid, created_at: '2025-11-01T10:00:00Z' };
    expect(decidePaymentAccess(old, PRODUCTS, NOW).status).toBe('expired');
    const oldDrie = { ...old, product_cart: [{ product_id: 'pdt_drie' }] };
    expect(decidePaymentAccess(oldDrie, PRODUCTS, NOW).status).toBe('expired');
  });
});

describe('access token', () => {
  const secret = 'test-secret';
  const access = { paymentId: 'pay_1', tier: 'drie' as const, expiresAt: NOW + 10 * DAY };

  it('reads back what it signed, to the second', async () => {
    const read = await readAccessToken(await signAccessToken(access, secret), secret, NOW);
    expect(read).toEqual({ ...access, expiresAt: Math.floor(access.expiresAt / 1000) * 1000 });
  });

  it('rejects a token signed with another secret', async () => {
    expect(await verifyAccessToken(await signAccessToken(access, 'other'), secret, NOW)).toBe(false);
  });

  it('rejects a token with a changed payment ID, tier or expiry', async () => {
    const [version, , tier, expiry, signature] = (await signAccessToken(access, secret)).split('.');
    expect(await verifyAccessToken(`${version}.pay_2.${tier}.${expiry}.${signature}`, secret, NOW)).toBe(false);
    expect(await verifyAccessToken(`${version}.pay_1.familie.${expiry}.${signature}`, secret, NOW)).toBe(false);
    expect(await verifyAccessToken(`${version}.pay_1.${tier}.${Number(expiry) + 1}.${signature}`, secret, NOW)).toBe(false);
  });

  it('rejects an expired token', async () => {
    const token = await signAccessToken(access, secret);
    expect(await verifyAccessToken(token, secret, access.expiresAt - 1000)).toBe(true);
    expect(await verifyAccessToken(token, secret, access.expiresAt + 1000)).toBe(false);
  });

  it('reads a token from before the tiers as Gezin', async () => {
    const read = await readAccessToken(await signLegacyAccessToken('pay_old', secret, NOW), secret, NOW);
    expect(read).toMatchObject({ paymentId: 'pay_old', tier: 'gezin' });
  });

  it.each(['', 'true', 'v1.pay_1', 'v2.pay_1.gezin.9999999999', 'v1.pay_1.9999999999.zz', 'v2.pay_1.goud.9999999999.abcd', 'v1.a.b.c.d'])(
    'rejects the malformed token %j',
    async (token) => {
      expect(await verifyAccessToken(token, secret, NOW)).toBe(false);
    },
  );

  it('keeps the cookie until the access ends, within the 400 days browsers allow', () => {
    expect(cookieMaxAge(NOW + 10 * DAY, NOW)).toBe(10 * 24 * 60 * 60);
    expect(cookieMaxAge(NOW + 700 * DAY, NOW)).toBe(MAX_COOKIE_SECONDS);
    expect(cookieMaxAge(NOW - DAY, NOW)).toBe(0);
  });
});

describe('pricing tiers', () => {
  it('ends pakjesavond at midnight Dutch time after 5 December', () => {
    expect(pakjesavondEnd(new Date('2026-11-09T12:00:00Z')).toISOString()).toBe('2026-12-05T23:00:00.000Z');
    expect(pakjesavondEnd(new Date('2026-12-05T22:59:00Z')).toISOString()).toBe('2026-12-05T23:00:00.000Z');
    expect(pakjesavondEnd(new Date('2026-12-05T23:00:00Z')).toISOString()).toBe('2027-12-05T23:00:00.000Z');
    expect(pakjesavondEnd(new Date('2026-11-09T12:00:00Z'), 2).toISOString()).toBe('2027-12-05T23:00:00.000Z');
    expect(pakjesavondEnd(new Date('2027-01-10T12:00:00Z'), 2).toISOString()).toBe('2028-12-05T23:00:00.000Z');
  });

  it('gives Gezin 365 days', () => {
    expect(accessExpiry('gezin', new Date(NOW)).getTime()).toBe(NOW + 365 * DAY);
  });

  it('prices match the page and the terms', () => {
    expect(formatPrice(TIERS.drie.priceCents)).toBe('€3,99');
    expect(formatPrice(TIERS.gezin.priceCents)).toBe('€6,99');
    expect(formatPrice(TIERS.familie.priceCents, 'en')).toBe('€12.99');
    expect(formatPrice(pricePerPoemCents(TIERS.drie)!)).toBe('€1,33');
    // "Bij 7 gedichten minder dan €1 per gedicht" is plain maths.
    expect(TIERS.gezin.priceCents / 7).toBeLessThan(100);
  });

  it('recommends the middle tier and lets buyers only move up', () => {
    expect(RECOMMENDED_TIER).toBe('gezin');
    expect(tiersAbove(null)).toEqual(['drie', 'gezin', 'familie']);
    expect(tiersAbove('drie')).toEqual(['gezin', 'familie']);
    expect(tiersAbove('familie')).toEqual([]);
  });

  it('fills in the season years', () => {
    expect(fillSeasons('t/m {season}, of {nextSeason}', new Date(NOW))).toBe('t/m 2026, of 2027');
  });
});

describe('dodoEnvironment', () => {
  it('uses live mode only for live keys', () => {
    expect(dodoEnvironment('dodo_live_abc')).toBe('live_mode');
    expect(dodoEnvironment('dodo_test_abc')).toBe('test_mode');
    expect(dodoEnvironment('anything-else')).toBe('test_mode');
  });
});
