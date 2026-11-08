import { consola } from 'consola';
import { createDodoClient } from '../../utils/dodo';
import { decidePaymentAccess } from '../../utils/paymentAccess';
import { setAccessCookie } from '../../utils/paymentCookie';

const PAYMENT_ID = /^pay_[A-Za-z0-9]+$/;

// The return URL only tells us which payment to look at. Dodo is the source
// of truth: access is granted only if its API says this payment succeeded
// for our product and has no refund or dispute.
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

  const body = await readBody<{ paymentId?: unknown }>(event).catch(() => null);
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

  const status = decidePaymentAccess(payment, config.dodoProductId);
  if (status === 'granted') {
    await setAccessCookie(event, paymentId, config.accessCookieSecret);
  }
  consola.info(`Payment ${paymentId}: ${payment.status} -> ${status}`);
  return { status };
});
