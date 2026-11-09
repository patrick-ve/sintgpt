import { paymentsAvailable, tiersOnSale } from '../../utils/paymentsStatus';

/** Whether a checkout can work now, and which tiers are on sale. The page asks before it offers payment. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store');
  return { available: await paymentsAvailable(event), tiers: tiersOnSale(event) };
});
