import { PoemEditSchema, reSignEditedPoem } from '../../utils/poemEdit';
import { counterName, rateLimitIp } from '../../utils/poemRateLimit';

interface RateLimitBindingLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Signs a poem the visitor edited, so it keeps its share link. Only small edits
 * of a poem SintGPT signed are accepted (server/utils/poemEdit.ts). Nothing is
 * stored, and the poem text is never logged.
 */
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).accessCookieSecret;
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'Poem links are off', data: { reason: 'off' } });
  }

  // Signing costs no AI, but stop one client from using it in a loop. Same
  // binding and key as the analytics endpoint.
  const { cloudflare } = event.context as { cloudflare?: { env?: { EVENTS_BURST?: RateLimitBindingLike } } };
  const limiter = cloudflare?.env?.EVENTS_BURST;
  if (limiter) {
    const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const key = await counterName({ kind: 'ip', id: rateLimitIp(ip) }, secret);
    if (!(await limiter.limit({ key })).success) {
      throw createError({ statusCode: 429, statusMessage: 'Too many requests', data: { reason: 'debounce' } });
    }
  }

  const parsed = PoemEditSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request', data: { reason: 'invalid' } });
  }

  const result = await reSignEditedPoem(parsed.data, secret);
  if (result.ok) return { share: result.share };
  // A large edit is a normal outcome, not an error: the poem simply gets no link.
  if (result.reason === 'too-different') return { share: null, reason: result.reason };
  throw createError({ statusCode: 400, statusMessage: 'The edit cannot be signed', data: { reason: result.reason } });
});
