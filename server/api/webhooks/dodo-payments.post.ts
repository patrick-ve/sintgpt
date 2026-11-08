import { consola } from 'consola';
import { Webhook } from 'standardwebhooks';

// Access is granted by /api/payment/claim-access, which asks the Dodo API
// directly. This webhook only records payment events in the logs.
export default defineEventHandler(async (event) => {
  const webhookSecret = useRuntimeConfig(event).dodoPaymentsWebhookSecret;

  // Never process an event we cannot verify.
  if (!webhookSecret) {
    consola.error('Webhook secret not configured - rejecting webhook');
    throw createError({
      statusCode: 503,
      statusMessage: 'Webhook not configured',
    });
  }

  const body = await readRawBody(event);
  const id = getHeader(event, 'webhook-id');
  const signature = getHeader(event, 'webhook-signature');
  const timestamp = getHeader(event, 'webhook-timestamp');

  if (!body || !id || !signature || !timestamp) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing webhook body or headers',
    });
  }

  let payload: any;
  try {
    payload = new Webhook(webhookSecret).verify(body, {
      'webhook-id': id,
      'webhook-signature': signature,
      'webhook-timestamp': timestamp,
    });
  } catch (error: any) {
    consola.error('Webhook verification failed:', error?.message);
    throw createError({
      statusCode: 401,
      statusMessage: 'Webhook verification failed',
    });
  }

  // IDs and amounts only: customer details do not belong in the logs.
  const details = {
    paymentId: payload.data?.payment_id,
    amount: payload.data?.total_amount,
    currency: payload.data?.currency,
  };

  switch (payload.type) {
    case 'payment.succeeded':
      consola.success('Payment succeeded:', details);
      break;
    case 'payment.failed':
    case 'payment.cancelled':
    case 'refund.succeeded':
      consola.warn(`${payload.type}:`, details);
      break;
    default:
      consola.info('Unhandled webhook event:', payload.type);
  }

  return { success: true };
});
