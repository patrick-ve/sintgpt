import { consola } from 'consola';
import { Webhook } from 'standardwebhooks';

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig();

    // Get the webhook secret from environment (optional for testing)
    const webhookSecret = runtimeConfig.dodoPaymentsWebhookSecret;

    // Get raw body and headers
    const body = await readRawBody(event);
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No body provided',
      });
    }

    let payload: any;

    // If webhook secret is configured, verify the signature
    if (webhookSecret) {
      // Get webhook signature headers
      const headers = getHeaders(event);
      const signature = headers['webhook-signature'];
      const timestamp = headers['webhook-timestamp'];
      const id = headers['webhook-id'];

      if (!signature || !timestamp || !id) {
        consola.error('Missing webhook headers');
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing webhook headers',
        });
      }

      // Verify webhook signature using standardwebhooks
      const wh = new Webhook(webhookSecret);

      try {
        payload = wh.verify(body, {
          'webhook-id': id,
          'webhook-signature': signature,
          'webhook-timestamp': timestamp,
        });
        consola.info('Webhook verified successfully');
      } catch (err: any) {
        consola.error('Webhook verification failed:', err.message);
        throw createError({
          statusCode: 401,
          statusMessage: 'Webhook verification failed',
        });
      }
    } else {
      // No webhook secret configured - accept webhook without verification (testing only)
      consola.warn('Webhook secret not configured - accepting webhook without verification');
      payload = JSON.parse(body);
    }

    consola.info('Webhook event type:', payload.event_type);

    // Handle different webhook events
    switch (payload.event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(payload);
        break;

      case 'payment.failed':
        consola.warn('Payment failed:', payload.data);
        break;

      case 'payment.refunded':
        consola.warn('Payment refunded:', payload.data);
        break;

      default:
        consola.info('Unhandled webhook event:', payload.event_type);
    }

    // Return success response
    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  } catch (error: any) {
    consola.error('Error processing webhook:', error);

    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error;
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process webhook',
      data: { originalError: error.message },
    });
  }
});

async function handlePaymentCompleted(payload: any) {
  consola.info('Processing completed payment:', {
    paymentId: payload.data?.payment_id,
    customerId: payload.data?.customer_id,
    amount: payload.data?.amount,
    email: payload.data?.customer_email,
  });

  // Payment is tracked via HTTP-only cookie set when payment completes in frontend
  // This webhook is just for logging and potential future analytics/notifications

  consola.success('Payment completed successfully');
}
