import { consola } from 'consola';
import DodoPayments from 'dodopayments';

interface CheckoutResponse {
  checkoutUrl: string;
}

export default defineEventHandler(async (event): Promise<CheckoutResponse> => {
  try {
    const runtimeConfig = useRuntimeConfig();

    // Check if Dodo Payments is configured
    if (!runtimeConfig.dodoPaymentsApiKey) {
      consola.error('Dodo Payments API key not configured');
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment system not configured',
      });
    }

    if (!runtimeConfig.dodoProductId) {
      consola.error('Dodo Payments product ID not configured');
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment product not configured',
      });
    }

    consola.info('Creating checkout session...');

    // Initialize Dodo Payments client
    // Use test_mode in development, live_mode in production
    const client = new DodoPayments({
      bearerToken: runtimeConfig.dodoPaymentsApiKey,
      environment: import.meta.dev ? 'test_mode' : 'live_mode',
    });

    // Get the base URL for return URL
    const headers = getHeaders(event);
    const host = headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Create checkout session
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: runtimeConfig.dodoProductId,
          quantity: 1,
        },
      ],
      return_url: `${baseUrl}/?payment=success`,
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

    consola.success('Checkout session created:', session.checkout_url);

    return {
      checkoutUrl: session.checkout_url,
    };
  } catch (error: any) {
    consola.error('Error creating checkout session:', error);

    // Handle Dodo Payments API errors
    if (error.status) {
      throw createError({
        statusCode: error.status,
        statusMessage: `Payment API Error: ${error.message}`,
      });
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create checkout session',
      data: { originalError: error.message },
    });
  }
});
