import { describe, expect, it } from 'vitest';
import { API_BODY_LIMIT, apiGuard, apiLimiter } from '../../server/utils/apiGuard';

const own = 'https://sintgpt.com';
const post = (extra: Partial<Parameters<typeof apiGuard>[0]> = {}) =>
  apiGuard({ method: 'POST', path: '/api/poem/generate', ownHost: 'sintgpt.com', ...extra });

describe('api guard', () => {
  it('lets the site itself write', () => {
    expect(post({ fetchSite: 'same-origin', origin: own, contentLength: '900' })).toBeNull();
  });

  it('refuses a write that another site made a browser send', () => {
    expect(post({ fetchSite: 'cross-site', origin: 'https://evil.example' })?.status).toBe(403);
    expect(post({ fetchSite: 'same-site' })?.status).toBe(403);
    // A browser without Sec-Fetch-Site: the Origin decides.
    expect(post({ origin: 'https://evil.example' })?.status).toBe(403);
    expect(post({ origin: own })).toBeNull();
    // Only the host counts: the server may see the request as http.
    expect(post({ origin: 'http://sintgpt.com' })).toBeNull();
    expect(post({ origin: 'https://sintgpt.com.evil.example' })?.status).toBe(403);
    expect(post({ origin: 'null' })?.status).toBe(403);
  });

  it('lets requests without browser headers pass, for the other limits to handle', () => {
    expect(post()).toBeNull();
  });

  it('refuses a body larger than any real request', () => {
    expect(post({ fetchSite: 'same-origin', contentLength: String(API_BODY_LIMIT + 1) })?.status).toBe(413);
    expect(post({ fetchSite: 'same-origin', contentLength: 'lots' })?.status).toBe(413);
    expect(post({ fetchSite: 'same-origin', contentLength: String(API_BODY_LIMIT) })).toBeNull();
  });

  it('leaves reads and the payment webhook alone', () => {
    expect(apiGuard({ method: 'GET', path: '/api/payment/status', ownHost: 'sintgpt.com', fetchSite: 'cross-site' })).toBeNull();
    expect(apiGuard({ method: 'POST', path: '/api/webhooks/dodo-payments', ownHost: 'sintgpt.com', origin: 'https://dodo.example', contentLength: '999999' })).toBeNull();
  });
});

describe('api limiter', () => {
  it('limits payments and gifts, which had no limit', () => {
    for (const path of ['/api/payment/create-checkout', '/api/payment/claim-access', '/api/payment/claim-gift']) {
      expect(apiLimiter('POST', path)).toBe('PAYMENT_BURST');
    }
  });

  it('limits poem links', () => {
    expect(apiLimiter('POST', '/api/share/links')).toBe('LINKS_BURST');
    expect(apiLimiter('GET', '/api/share/links/N7Jkc_6K9d')).toBe('LINKS_BURST');
    expect(apiLimiter('GET', '/api/share/verify')).toBe('LINKS_BURST');
  });

  it('leaves routes with a limit of their own to that limit', () => {
    for (const path of ['/api/poem/generate', '/api/poem/surprise', '/api/share/edit', '/api/events', '/api/payment/status', '/api/payment/check-access']) {
      expect(apiLimiter('POST', path)).toBeNull();
    }
  });
});
