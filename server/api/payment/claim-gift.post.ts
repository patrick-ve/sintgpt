import { consola } from 'consola';
import { accessExpiry } from '../../../utils/pricingTiers';
import { trackServerEvent } from '../../utils/analytics';
import { claimGift, GIFT_BROWSERS, giftLists } from '../../utils/giftAccess';
import { paidAccess, setAccessCookie } from '../../utils/paymentCookie';
import { checkPoemRateLimit } from '../../utils/poemRateLimit';
import { giftClaimRule } from '../../utils/rateLimit';

/** A gift link gives Hele familie: a standing code for as long as a buyer would have it, a season code until its end date. */
const GIFT_TIER = 'familie' as const;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<{ code?: unknown }>(event).catch(() => null);
  const now = Date.now();
  const gift = config.accessCookieSecret ? await claimGift(body?.code, giftLists(config), now) : null;
  if (!gift) {
    trackServerEvent(event, 'Gift claimed', { detail: 'denied' });
    return { status: 'denied' as const };
  }
  if (gift.kind === 'expired') {
    trackServerEvent(event, 'Gift claimed', { detail: 'expired' });
    return { status: 'denied' as const };
  }

  let expiresAt = accessExpiry(GIFT_TIER, new Date(now)).getTime();
  if (gift.kind === 'season') {
    expiresAt = Math.min(expiresAt, gift.expiresAt);
    // A browser that already holds this gift opens the link again: no new browser.
    const current = await paidAccess(event);
    if (current?.paymentId !== gift.id) {
      const verdict = await checkPoemRateLimit(
        event,
        { kind: 'gift', id: gift.id },
        giftClaimRule(GIFT_BROWSERS, gift.expiresAt, now),
      );
      if (!verdict.ok) {
        trackServerEvent(event, 'Gift claimed', { detail: 'full' });
        return { status: 'full' as const };
      }
    }
  }

  await setAccessCookie(event, { paymentId: gift.id, tier: GIFT_TIER, expiresAt }, config.accessCookieSecret);
  // Never log the code; the ID is a hash of it.
  consola.info(`Gift link used: ${gift.id}`);
  trackServerEvent(event, 'Gift claimed', { detail: gift.kind === 'season' ? 'granted:season' : 'granted', plan: 'paid', tier: GIFT_TIER });
  return { status: 'granted' as const, tier: GIFT_TIER, expiresAt };
});
