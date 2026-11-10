import type { H3Event } from 'h3';
import { canonicalRedirect } from '../utils/canonicalHost';

// Six months. Browsers then use https for sintgpt.com without asking.
const HSTS = 'max-age=15552000';

/**
 * The protocol the visitor used. Cloudflare says it in x-forwarded-proto and
 * cf-visitor. Only an explicit "http" counts as http, so a missing header can
 * never cause a redirect loop on the live site.
 */
function visitorProtocol(event: H3Event): 'http' | 'https' {
  const forwarded = (getRequestHeader(event, 'x-forwarded-proto') ?? '').split(',')[0]!.trim().toLowerCase();
  const visitor = getRequestHeader(event, 'cf-visitor') ?? '';
  if (forwarded === 'http' || /"scheme"\s*:\s*"http"/.test(visitor)) return 'http';
  if (forwarded === 'https' || visitor) return 'https';
  return getRequestURL(event).protocol === 'http:' ? 'http' : 'https';
}

export default defineEventHandler((event) => {
  const host = getRequestHost(event);
  const protocol = visitorProtocol(event);
  const explicitHttp = protocol === 'http' && (getRequestHeader(event, 'x-forwarded-proto') || getRequestHeader(event, 'cf-visitor'));
  const target = canonicalRedirect({
    host,
    path: event.path,
    // On the live site only a header that says http leads to https.
    protocol: host === 'sintgpt.com' && !explicitHttp ? 'https' : protocol,
    method: event.method,
  });
  if (target) return sendRedirect(event, target, 301);
  if (host === 'sintgpt.com' && !explicitHttp) setResponseHeader(event, 'strict-transport-security', HSTS);
});
