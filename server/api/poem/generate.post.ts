import { consola } from 'consola';
import {
  createGateway,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  toUIMessageStream,
} from 'ai';
import { clientDisconnectSignal } from '../../utils/clientDisconnect';
import { unlimitedAccessPaymentId } from '../../utils/paymentCookie';
import { checkPoemRateLimit, rateLimitIp } from '../../utils/poemRateLimit';
import { signPoemShare } from '../../utils/poemShare';
import { BUYER_RATE_LIMIT, POEM_RATE_LIMIT } from '../../utils/rateLimit';
import {
  buildPrompt,
  DEFAULT_POEM_MODEL,
  FALLBACK_POEM_MODEL,
  estimateCostUsd,
  PoemRequestSchema,
  REGENERATE_POEM_MODEL,
} from '../../utils/poem';

export default defineEventHandler(async (event) => {
  // Get API keys from runtime config inside handler
  const runtimeConfig = useRuntimeConfig(event);

  try {
    // Buyers have a high daily cap per payment, free visitors a low one per IP.
    const buyerPaymentId = await unlimitedAccessPaymentId(event);
    const hasUnlimited = buyerPaymentId !== null;

    // On Cloudflare, cf-connecting-ip is set by the edge and cannot be
    // spoofed. The first X-Forwarded-For entry is client-controlled.
    const ip =
      getHeader(event, 'cf-connecting-ip')
      || getRequestIP(event, { xForwardedFor: true })
      || 'unknown';

    if (!import.meta.dev) {
      const verdict = await checkPoemRateLimit(
        event,
        hasUnlimited
          ? { kind: 'buyer', id: buyerPaymentId }
          : { kind: 'ip', id: rateLimitIp(ip) },
      );
      if (!verdict.ok) {
        // The client shows the upgrade offer only for `limit`. A buyer who
        // reaches the cap gets `fair-use` and a message instead.
        const reason = verdict.reason === 'limit' && hasUnlimited ? 'fair-use' : verdict.reason;
        // No IP in the log: the reason is enough to see abuse.
        consola.warn(`Rate limit: ${reason}`);
        setResponseHeader(event, 'retry-after', verdict.retryAfterSeconds);
        throw createError({
          statusCode: 429,
          statusMessage: {
            debounce: `Please wait ${verdict.retryAfterSeconds} seconds before generating another poem.`,
            limit: `You have reached the maximum of ${POEM_RATE_LIMIT.maxRequests} free poems per 24 hours. Upgrade to unlimited access for just €6,99 (incl. VAT)!`,
            'fair-use': `You have made ${BUYER_RATE_LIMIT.maxRequests} poems in 24 hours. Please try again later.`,
          }[reason],
          data: { reason, retryAfterSeconds: verdict.retryAfterSeconds },
        });
      }
    }

    // Read and parse the request body
    const body = await readBody(event);

    // Validate the request data
    const validatedData = PoemRequestSchema.parse(body);

    consola.info('Generating poem with parameters:', {
      style: validatedData.style,
      rhymeScheme: validatedData.rhymeScheme,
      lines: validatedData.lines,
      language: validatedData.language,
      regenerate: validatedData.regenerate ?? false,
      // Never log what visitors type: names and details are personal.
    });

    // Build the prompt
    const prompt = buildPrompt(validatedData);

    // A rewrite always uses the larger model, whatever the override says.
    const modelId = validatedData.regenerate
      ? REGENERATE_POEM_MODEL
      : runtimeConfig.aiGatewayModel || DEFAULT_POEM_MODEL;
    consola.info(`Sending request to AI Gateway (${modelId})...`);

    // Pass the key explicitly: on Cloudflare Workers secrets arrive as
    // bindings (exposed via runtime config), not as process.env.
    const gateway = createGateway({
      apiKey: runtimeConfig.aiGatewayApiKey || undefined,
    });

    const result = streamText({
      model: gateway(modelId),
      prompt,
      // Keep Gemini 3.x at its default of 1. At 2 the model often reasons
      // for minutes (15k+ tokens, ~$0.20 per poem) and can stream garbled
      // text instead of a poem.
      temperature: 1,
      maxRetries: 3,
      // AI Gateway switches to this model if the primary one fails.
      providerOptions: { gateway: { models: [FALLBACK_POEM_MODEL] } },
      // Stop paying for tokens when the visitor leaves during generation.
      abortSignal: clientDisconnectSignal(event),
      // Models send text in bursts; release it word by word instead.
      experimental_transform: smoothStream({ delayInMs: 15, chunking: 'word' }),
      onAbort() {
        consola.info('Client disconnected - stopped poem generation');
      },
      onEnd({ usage }) {
        consola.info('Poem generated successfully');
        consola.info(
          `Tokens: ${usage.inputTokens ?? 0} in, ${usage.outputTokens ?? 0} out `
          + `(${usage.outputTokenDetails.reasoningTokens ?? 0} reasoning). `
          + `Estimated cost: $${estimateCostUsd(usage, modelId).toFixed(6)}`,
        );
      },
    });

    return createUIMessageStreamResponse({
      // no-transform keeps Cloudflare from compressing the stream, even if a
      // Compression Rule on the zone would match it. Compression buffers.
      headers: { 'cache-control': 'no-cache, no-transform' },
      stream: createUIMessageStream({
        async execute({ writer }) {
          writer.merge(toUIMessageStream({ stream: result.stream }));

          // Sign the finished poem, so the visitor can share it as a link.
          // Without a secret the app still works, only without poem links.
          const secret = runtimeConfig.accessCookieSecret;
          if (!secret) return;
          try {
            const text = (await result.text).trim();
            if (!text) return;
            writer.write({
              type: 'data-share',
              data: await signPoemShare(
                text,
                validatedData.language === 'dutch' ? 'nl' : 'en',
                secret,
              ),
            });
          } catch {
            // The stream failed or the visitor left. The stream reports errors.
          }
        },
      }),
    });
  } catch (error: any) {
    // Pass through HTTP errors we raised on purpose (e.g. 429 rate limit),
    // so the client can show the upgrade offer instead of a generic error.
    if (isError(error)) {
      throw error;
    }

    // The message only: AI SDK errors can carry the whole prompt.
    consola.error('Error generating poem:', error?.message);

    // Handle validation errors
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: { errors: error.issues },
      });
    }

    // Handle API errors
    if (error.name === 'APIError') {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: `AI API Error: ${error.message}`,
      });
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate poem',
      data: { originalError: error.message },
    });
  }
});
