import { consola } from 'consola';
import { trackServerEvent } from '../../utils/analytics';
import { paidAccess } from '../../utils/paymentCookie';
import { checkPoemRateLimit, counterName } from '../../utils/poemRateLimit';
import { signPoemShare } from '../../utils/poemShare';
import { BUYER_RATE_LIMIT, creditsRule } from '../../utils/rateLimit';
import {
  PREVIEW_ID_PATTERN,
  previewKey,
  previewStore,
  UNLOCKED_TTL_SECONDS,
  type StoredPreview,
} from '../../utils/poemPreview';
import { TIERS } from '../../../utils/pricingTiers';

/**
 * Gives a buyer the whole poem that was written before they paid
 * (server/utils/poemPreview.ts). It counts as one of their poems, once: the
 * same buyer may fetch it again for 15 minutes without counting.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const store = previewStore(event);
  const { id } = (await readBody<{ id?: unknown }>(event).catch(() => null)) ?? {};
  if (typeof id !== 'string' || !PREVIEW_ID_PATTERN.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid preview', data: { reason: 'invalid' } });
  }

  const access = await paidAccess(event);
  if (!access) {
    throw createError({ statusCode: 403, statusMessage: 'Payment needed', data: { reason: 'paid' } });
  }

  const raw = store && config.accessCookieSecret ? await store.get(previewKey(id)) : null;
  const stored = raw ? JSON.parse(raw) as StoredPreview : null;
  const buyer = await counterName({ kind: 'buyer', id: access.paymentId }, config.accessCookieSecret);
  if (!stored || (stored.unlockedBy && stored.unlockedBy !== buyer)) {
    trackServerEvent(event, 'Poem unlocked', { detail: 'expired', plan: 'paid', tier: access.tier });
    throw createError({ statusCode: 404, statusMessage: 'This poem is no longer available', data: { reason: 'expired' } });
  }

  const tier = TIERS[access.tier];
  if (!stored.unlockedBy) {
    if (!import.meta.dev) {
      const rule = tier.poems ? creditsRule(tier.poems, access.expiresAt, Date.now()) : BUYER_RATE_LIMIT;
      const verdict = await checkPoemRateLimit(event, { kind: 'buyer', id: access.paymentId }, rule);
      if (!verdict.ok) {
        const reason = verdict.reason === 'limit' ? (tier.poems ? 'credits' : 'fair-use') : verdict.reason;
        consola.warn(`Unlock refused: ${reason}`);
        trackServerEvent(event, 'Rate limited', { detail: `unlock:${reason}`, plan: 'paid', tier: access.tier });
        throw createError({
          statusCode: 429,
          statusMessage: 'No poems left',
          data: { reason, retryAfterSeconds: verdict.retryAfterSeconds },
        });
      }
    }
    await store!.put(previewKey(id), JSON.stringify({ ...stored, unlockedBy: buyer }), { expirationTtl: UNLOCKED_TTL_SECONDS });
    trackServerEvent(event, 'Poem unlocked', {
      detail: 'new',
      plan: 'paid',
      tier: access.tier,
      style: stored.style,
      rhymeScheme: stored.rhymeScheme,
      language: stored.language,
      lines: stored.lines,
      // Minutes from the preview to the unlock: how long people take to pay.
      value: Math.round((Date.now() - stored.createdAt) / 60_000),
    });
  }

  return {
    poem: stored.poem,
    share: await signPoemShare(stored.poem, stored.language === 'dutch' ? 'nl' : 'en', config.accessCookieSecret),
    style: stored.style,
    rhymeScheme: stored.rhymeScheme,
    language: stored.language,
    lines: stored.lines,
  };
});
