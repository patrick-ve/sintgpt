import type { H3Event } from 'h3';
import { consola } from 'consola';
import { trackServerEvent } from '../../utils/analytics';
import { createDodoClient } from '../../utils/dodo';
import {
  markPaymentsUnavailable,
  paymentsAvailable,
  paymentsConfigured,
} from '../../utils/paymentsStatus';

interface CheckoutResponse {
  checkoutUrl: string;
}

/** The page shows a friendly message for this code, never Dodo's own text. */
function paymentsUnavailableError(event: H3Event, detail: string) {
  trackServerEvent(event, 'Payments unavailable', { detail });
  return createError({
    statusCode: 503,
    statusMessage: 'Payments are not available right now',
    data: { code: 'payments_unavailable' },
  });
}

export default defineEventHandler(async (event): Promise<CheckoutResponse> => {
  const runtimeConfig = useRuntimeConfig(event);

  if (!paymentsConfigured(event)) {
    consola.error('Dodo Payments API key or product ID not configured');
    throw paymentsUnavailableError(event, 'not configured');
  }

  // Dodo refused a checkout a few minutes ago. Do not ask again yet.
  if (!(await paymentsAvailable(event))) {
    throw paymentsUnavailableError(event, 'flag set');
  }

  const client = createDodoClient(runtimeConfig.dodoPaymentsApiKey);

  // Get the base URL for return URL
  const host = getHeader(event, 'host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  let checkoutUrl: string | null | undefined;
  try {
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: runtimeConfig.dodoProductId,
          quantity: 1,
        },
      ],
      // Dodo appends payment_id and status. The page sends the ID to
      // /api/payment/claim-access, which verifies it with Dodo.
      return_url: `${baseUrl}/`,
      cancel_url: `${baseUrl}/?payment=cancelled`,
      // Configure allowed payment methods (excludes Klarna and other BNPL)
      allowed_payment_method_types: [
        'ideal',
        'credit',
        'debit',
        'paypal',
        'bancontact_card',
        'apple_pay',
        'google_pay',
      ],
    });
    checkoutUrl = session.checkout_url;
  } catch (error: any) {
    consola.error(`Dodo refused the checkout (${error?.status ?? 'no status'}):`, error?.message);
    // 401 and 403 do not go away by trying again: a wrong key, or live
    // payments that Dodo has not enabled yet. Remember that for a while.
    if (error?.status === 401 || error?.status === 403) {
      await markPaymentsUnavailable(event);
    }
    throw paymentsUnavailableError(event, `dodo ${error?.status ?? 'error'}`);
  }

  if (!checkoutUrl) {
    consola.error('Dodo returned no checkout URL');
    throw paymentsUnavailableError(event, 'no checkout url');
  }

  consola.success('Checkout session created');
  trackServerEvent(event, 'Proceed to payment');
  return { checkoutUrl };
});
