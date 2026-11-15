// Rules for every /api request (server/middleware/api-guard.ts), kept as pure
// functions so the unit tests can check them without a server.

/**
 * The largest body a real visitor sends: a poem edit holds two poems of at
 * most 5,000 characters (POEM_INPUT_LIMITS.previousPoem), up to 3 bytes each.
 */
export const API_BODY_LIMIT = 64 * 1024;

/** Server-to-server routes: they come without a browser and check a signature. */
const SERVER_TO_SERVER = ['/api/webhooks/'];

export interface ApiRequestFacts {
  method: string;
  path: string;
  /** The browser's Sec-Fetch-Site header, if any. */
  fetchSite?: string;
  /** The Origin header, if any. */
  origin?: string;
  /**
   * The host this request was sent to, such as sintgpt.com. Only the host:
   * behind Cloudflare the server cannot always tell http from https.
   */
  ownHost: string;
  /** The Content-Length header, if any. */
  contentLength?: string;
}

export interface ApiRefusal {
  status: 403 | 413;
  message: string;
}

/**
 * Refuses a write that another website made a browser send (it would spend
 * the visitor's free poem and our tokens), and a body larger than any real
 * request. Browsers send Sec-Fetch-Site; without it, the Origin decides.
 * Requests with neither (curl, very old browsers) pass: the rate limits and
 * the input checks still apply to them.
 */
export function apiGuard(facts: ApiRequestFacts): ApiRefusal | null {
  const { method, path, fetchSite, origin, ownHost, contentLength } = facts;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null;
  if (SERVER_TO_SERVER.some(prefix => path.startsWith(prefix))) return null;

  if (fetchSite ? fetchSite !== 'same-origin' : origin !== undefined && originHost(origin) !== ownHost) {
    return { status: 403, message: 'Requests from other sites are not accepted' };
  }
  const length = contentLength === undefined ? 0 : Number(contentLength);
  if (!Number.isFinite(length) || length > API_BODY_LIMIT) {
    return { status: 413, message: 'Request too large' };
  }
  return null;
}

/** The host of an Origin header; "null" and junk give an empty string. */
function originHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return '';
  }
}

/** The Rate Limiting binding a route uses, besides the ones that have their own. */
export type ApiLimiter = 'PAYMENT_BURST' | 'LINKS_BURST';

/**
 * Routes that had no limit: payments and gifts (10 a minute per IP: Dodo
 * calls, and guessing payment IDs or gift codes), and poem links (60 a
 * minute: KV reads and signature checks). Poems, surprise ideas, edits and
 * events have their own limits in their handlers.
 */
export function apiLimiter(method: string, path: string): ApiLimiter | null {
  if (method === 'POST' && ['/api/payment/create-checkout', '/api/payment/claim-access', '/api/payment/claim-gift'].includes(path)) {
    return 'PAYMENT_BURST';
  }
  if (path === '/api/share/links' || path.startsWith('/api/share/links/') || path === '/api/share/verify') {
    return 'LINKS_BURST';
  }
  return null;
}
