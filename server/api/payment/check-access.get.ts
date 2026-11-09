import type { H3Event } from 'h3';
import { TIERS } from '../../../utils/pricingTiers';
import { paidAccess } from '../../utils/paymentCookie';
import { poemsUsed } from '../../utils/poemRateLimit';

/**
 * What this browser bought, if anything. For a tier with a fixed number of
 * poems it also says how many are left. Reading it counts no poem.
 */
export default defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'cache-control', 'no-store');
  const access = await paidAccess(event);
  if (!access) return { hasAccess: false, tier: null, expiresAt: null, poemsLeft: null };

  const { poems } = TIERS[access.tier];
  const poemsLeft = poems === null
    ? null
    : Math.max(0, poems - await poemsUsed(event, { kind: 'buyer', id: access.paymentId }));
  return { hasAccess: true, tier: access.tier, expiresAt: access.expiresAt, poemsLeft };
});
