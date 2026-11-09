import { consola } from 'consola';
import { accessExpiry } from '../../../utils/pricingTiers';
import { trackServerEvent } from '../../utils/analytics';
import { claimGiftCode } from '../../utils/giftAccess';
import { setAccessCookie } from '../../utils/paymentCookie';

/** A gift link gives Hele familie, for as long as a buyer would have it. */
const GIFT_TIER = 'familie' as const;

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<{ code?: unknown }>(event).catch(() => null);
  const id = config.accessCookieSecret ? await claimGiftCode(body?.code, String(config.giftCodes || "")) : null;
  if (!id) {
    trackServerEvent(event, 'Gift claimed', { detail: 'denied' });
    return { status: 'denied' as const };
  }

  const expiresAt = accessExpiry(GIFT_TIER, new Date()).getTime();
  await setAccessCookie(event, { paymentId: id, tier: GIFT_TIER, expiresAt }, config.accessCookieSecret);
  // Never log the code; the ID is a hash of it.
  consola.info(`Gift link used: ${id}`);
  trackServerEvent(event, 'Gift claimed', { detail: 'granted', plan: 'paid', tier: GIFT_TIER });
  return { status: 'granted' as const, tier: GIFT_TIER, expiresAt };
});
