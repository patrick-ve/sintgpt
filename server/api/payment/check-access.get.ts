import type { H3Event } from 'h3';
import { hasUnlimitedAccess } from '../../utils/paymentCookie';

export default defineEventHandler(async (event: H3Event) => {
  return {
    hasAccess: await hasUnlimitedAccess(event),
  };
});
