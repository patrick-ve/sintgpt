import { describe, expect, it } from 'vitest';
import {
  ACCESS_TTL_SECONDS,
  decidePaymentAccess,
  signAccessToken,
  verifyAccessToken,
} from '../../server/utils/paymentAccess';
import { dodoEnvironment } from '../../server/utils/dodo';

const PRODUCT = 'pdt_test';
const paid = {
  status: 'succeeded',
  product_cart: [{ product_id: PRODUCT }],
  refunds: [],
  disputes: [],
};

describe('decidePaymentAccess', () => {
  it('grants a succeeded payment for our product', () => {
    expect(decidePaymentAccess(paid, PRODUCT)).toBe('granted');
  });

  it('denies a payment for another product', () => {
    expect(decidePaymentAccess(paid, 'pdt_other')).toBe('denied');
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
    expect(decidePaymentAccess({ ...paid, ...change }, PRODUCT)).toBe('denied');
  });

  it('reports a payment that is still processing as pending', () => {
    expect(decidePaymentAccess({ ...paid, status: 'processing' }, PRODUCT)).toBe('pending');
  });
});

describe('access token', () => {
  const secret = 'test-secret';

  it('accepts a token it signed', async () => {
    expect(await verifyAccessToken(await signAccessToken('pay_1', secret), secret)).toBe(true);
  });

  it('rejects a token signed with another secret', async () => {
    expect(await verifyAccessToken(await signAccessToken('pay_1', 'other'), secret)).toBe(false);
  });

  it('rejects a token with a changed payment ID or expiry', async () => {
    const [version, , expiry, signature] = (await signAccessToken('pay_1', secret)).split('.');
    expect(await verifyAccessToken(`${version}.pay_2.${expiry}.${signature}`, secret)).toBe(false);
    expect(await verifyAccessToken(`${version}.pay_1.${Number(expiry) + 1}.${signature}`, secret)).toBe(false);
  });

  it('rejects an expired token', async () => {
    const now = Date.now();
    const token = await signAccessToken('pay_1', secret, now);
    expect(await verifyAccessToken(token, secret, now + ACCESS_TTL_SECONDS * 1000 - 1000)).toBe(true);
    expect(await verifyAccessToken(token, secret, now + ACCESS_TTL_SECONDS * 1000 + 1000)).toBe(false);
  });

  it.each(['', 'true', 'v1.pay_1', 'v1.pay_1.9999999999.zz', 'v1.pay_1.9999999999.abc', 'v1.a.b.c.d'])(
    'rejects the malformed token %j',
    async (token) => {
      expect(await verifyAccessToken(token, secret)).toBe(false);
    },
  );
});

describe('dodoEnvironment', () => {
  it('uses live mode only for live keys', () => {
    expect(dodoEnvironment('dodo_live_abc')).toBe('live_mode');
    expect(dodoEnvironment('dodo_test_abc')).toBe('test_mode');
    expect(dodoEnvironment('anything-else')).toBe('test_mode');
  });
});
