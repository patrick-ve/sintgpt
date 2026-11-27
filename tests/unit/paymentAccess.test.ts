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
  CARD_TIER_IDS,
  fillSeasons,
  formatPrice,
  gezinPriceText,
  pakjesavondEnd,
  poemsBelowOneEuro,
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
    expect(formatPrice(TIERS.gezin.priceCents)).toBe('€4,99');
    expect(gezinPriceText('nl')).toBe('€4,99');
    expect(gezinPriceText('en')).toBe('€4.99');
    expect(formatPrice(TIERS.familie.priceCents, 'en')).toBe('€12.99');
    expect(formatPrice(pricePerPoemCents(TIERS.drie)!)).toBe('€1,33');
    // "Bij 5 gedichten minder dan €1 per gedicht" is plain maths: 5 is the
    // smallest number of poems that brings the price under €1 per poem.
    const poems = poemsBelowOneEuro(TIERS.gezin.priceCents);
    expect(poems).toBe(5);
    expect(TIERS.gezin.priceCents / poems).toBeLessThan(100);
    expect(TIERS.gezin.priceCents / (poems - 1)).toBeGreaterThanOrEqual(100);
    // "Voor €1 meer schrijf je met Gezin zoveel gedichten als je wilt".
    expect(TIERS.gezin.priceCents - TIERS.drie.priceCents).toBe(100);
  });

  it('sells a single poem for €1,99, until pakjesavond, without rewrites', () => {
    expect(TIERS.een).toMatchObject({ priceCents: 199, poems: 1, rewrites: false, extraDesigns: false, surpriseIdeas: false });
    // "Voor €2 meer schrijf je 3 gedichten".
    expect(TIERS.drie.priceCents - TIERS.een.priceCents).toBe(200);
    expect(decidePaymentAccess(
      { status: 'succeeded', created_at: '2026-11-27T12:00:00Z', product_cart: [{ product_id: 'pdt_een' }] },
      { ...PRODUCTS, een: 'pdt_een' },
      Date.parse('2026-11-27T12:05:00Z'),
    )).toEqual({ status: 'granted', tier: 'een', expiresAt: Date.parse('2026-12-05T23:00:00Z') });
  });

  it('recommends the middle tier and lets buyers only move up', () => {
    expect(RECOMMENDED_TIER).toBe('gezin');
    expect(tiersAbove(null)).toEqual(['een', 'drie', 'gezin', 'familie']);
    expect(tiersAbove('een')).toEqual(['drie', 'gezin', 'familie']);
    expect(tiersAbove('drie')).toEqual(['gezin', 'familie']);
    // The cards stay three; the single poem is the small option under them.
    expect(CARD_TIER_IDS).toEqual(['drie', 'gezin', 'familie']);
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

describe('gift links', async () => {
  const { claimGiftCode, giftId, giftStillValid, isGiftId, parseGiftCodes } = await import('../../server/utils/giftAccess');
  const CODE = '0123456789abcdef0123';
  const SECRET = ` ${CODE}, short, another-code-0123456789 `;

  it('reads the codes and ignores short ones', () => {
    expect(parseGiftCodes(SECRET)).toEqual([CODE, 'another-code-0123456789']);
    expect(parseGiftCodes(undefined)).toEqual([]);
  });

  it('accepts a known code and refuses anything else', async () => {
    expect(await claimGiftCode(CODE, SECRET)).toBe(await giftId(CODE));
    expect(await claimGiftCode('short', SECRET)).toBeNull();
    expect(await claimGiftCode(`${CODE}x`, SECRET)).toBeNull();
    expect(await claimGiftCode(CODE, '')).toBeNull();
    expect(await claimGiftCode({ code: CODE }, SECRET)).toBeNull();
  });

  it('keeps no code in the ID, and ends when the code leaves the secret', async () => {
    const id = await giftId(CODE);
    expect(isGiftId(id)).toBe(true);
    expect(id).not.toContain(CODE);
    expect(await giftStillValid(id, SECRET)).toBe(true);
    expect(await giftStillValid(id, 'another-code-0123456789')).toBe(false);
  });
});

describe('season gift codes', async () => {
  const { claimGift, giftId, giftInLists, giftLists, seasonGiftEnd, GIFT_BROWSERS } = await import('../../server/utils/giftAccess');
  const { applyRateLimit, giftClaimRule } = await import('../../server/utils/rateLimit');
  const STANDING = 'standing-code-0123456789';
  const SEASON = 'season-code-0123456789ab';
  const lists = { codes: STANDING, seasonCodes: ` ${SEASON} , other-season-code-0123`, seasonEnd: '2026-12-05' };
  const END = Date.UTC(2026, 11, 5, 23);
  const BEFORE = Date.UTC(2026, 10, 20, 12);

  it('ends at the end of the date, Dutch winter time', () => {
    expect(seasonGiftEnd('2026-12-05')).toBe(END);
    expect(seasonGiftEnd('')).toBeNull();
    expect(seasonGiftEnd(undefined)).toBeNull();
    expect(seasonGiftEnd('5 december')).toBeNull();
    expect(seasonGiftEnd('2026-02-30')).toBeNull();
  });

  it('gives a season code until the end date', async () => {
    expect(await claimGift(SEASON, lists, BEFORE)).toEqual({ kind: 'season', id: await giftId(SEASON), expiresAt: END });
  });

  it('refuses a season code after the end, or without an end date', async () => {
    expect(await claimGift(SEASON, lists, END)).toEqual({ kind: 'expired' });
    expect(await claimGift(SEASON, { ...lists, seasonEnd: '' }, BEFORE)).toEqual({ kind: 'expired' });
  });

  it('keeps standing codes as they were, and lets them win', async () => {
    expect(await claimGift(STANDING, lists, BEFORE)).toEqual({ kind: 'standing', id: await giftId(STANDING) });
    expect(await claimGift(STANDING, { ...lists, seasonCodes: STANDING }, BEFORE)).toMatchObject({ kind: 'standing' });
  });

  it('refuses unknown and malformed codes', async () => {
    expect(await claimGift('unknown-code-0123456789', lists, BEFORE)).toBeNull();
    expect(await claimGift('short', lists, BEFORE)).toBeNull();
    expect(await claimGift({ code: SEASON }, lists, BEFORE)).toBeNull();
  });

  it('ends a season gift when its code leaves the list', async () => {
    const id = await giftId(SEASON);
    expect(await giftInLists(id, lists)).toBe(true);
    expect(await giftInLists(await giftId(STANDING), lists)).toBe(true);
    expect(await giftInLists(id, { ...lists, seasonCodes: '' })).toBe(false);
  });

  it('reads the lists from the runtime config', () => {
    expect(giftLists({ giftCodes: 'a', giftCodesSeason: 'b', giftSeasonEnd: '2026-12-05' }))
      .toEqual({ codes: 'a', seasonCodes: 'b', seasonEnd: '2026-12-05' });
    expect(giftLists({})).toEqual({ codes: '', seasonCodes: '', seasonEnd: '' });
  });

  it('lets 3 browsers claim one code until the gift ends, not a 4th', () => {
    const rule = giftClaimRule(GIFT_BROWSERS, END, BEFORE);
    let entry;
    for (let browser = 1; browser <= GIFT_BROWSERS; browser++) {
      const result = applyRateLimit(entry, BEFORE + browser, rule);
      expect(result.verdict.ok).toBe(true);
      entry = result.entry;
    }
    expect(applyRateLimit(entry, BEFORE + 10, rule).verdict).toMatchObject({ ok: false, reason: 'limit' });
    // Still full a week later: the window lasts until the gift ends.
    expect(applyRateLimit(entry, BEFORE + 7 * 24 * 60 * 60 * 1000, rule).verdict.ok).toBe(false);
  });
});
