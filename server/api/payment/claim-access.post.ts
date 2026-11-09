import { consola } from 'consola';
import { trackServerEvent } from '../../utils/analytics';
import { createDodoClient } from '../../utils/dodo';
import { decidePaymentAccess } from '../../utils/paymentAccess';
import { setAccessCookie } from '../../utils/paymentCookie';
import { tierProducts } from '../../utils/paymentsStatus';

const PAYMENT_ID = /^pay_[A-Za-z0-9]+$/;

// The return URL only tells us which payment to look at. Dodo is the source
// of truth: access is granted only if its API says this payment succeeded
// for one of our products and has no refund or dispute. The product decides
// the tier, the payment date how long it lasts.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (
    !config.dodoPaymentsApiKey
    || !config.dodoProductId
    || !config.accessCookieSecret
  ) {
    consola.error('Payment access is not configured');
    throw createError({
      statusCode: 503,
      statusMessage: 'Payment system not configured',
    });
  }

  const body = await readBody<{ paymentId?: unknown; source?: unknown }>(event).catch(() => null);
  const paymentId = body?.paymentId;
  if (typeof paymentId !== 'string' || !PAYMENT_ID.test(paymentId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payment ID' });
  }

  let payment;
  try {
    payment = await createDodoClient(config.dodoPaymentsApiKey).payments.retrieve(paymentId);
  } catch (error: any) {
    if (error?.status === 404) return { status: 'denied' as const };
    consola.error('Could not retrieve payment:', error?.status, error?.message);
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not verify payment',
    });
  }

  const decision = decidePaymentAccess(payment, tierProducts(event));
  consola.info(`Payment ${paymentId}: ${payment.status} -> ${decision.status}`);
  if (decision.status !== 'granted') return { status: decision.status };

  await setAccessCookie(event, { paymentId, tier: decision.tier, expiresAt: decision.expiresAt }, config.accessCookieSecret);
  // Counted here, not in the browser, so blocked scripts do not hide a sale.
  // `return` is a buyer back from Dodo, `restore` someone entering an ID.
  trackServerEvent(event, 'Payment verified', {
    detail: body?.source === 'restore' ? 'restore' : 'return',
    plan: 'paid',
    tier: decision.tier,
  });
  return { status: decision.status, tier: decision.tier, expiresAt: decision.expiresAt };
});
