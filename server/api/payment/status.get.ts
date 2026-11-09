import { paymentsAvailable } from '../../utils/paymentsStatus';

/** Whether a checkout can work now. The page asks before it offers payment. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store');
  return { available: await paymentsAvailable(event) };
});
