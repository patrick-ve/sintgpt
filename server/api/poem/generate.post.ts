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
import { hasUnlimitedAccess } from '../../utils/paymentCookie';
import { signPoemShare } from '../../utils/poemShare';
import {
  buildPrompt,
  DEFAULT_POEM_MODEL,
  FALLBACK_POEM_MODEL,
  estimateCostUsd,
  PoemRequestSchema,
} from '../../utils/poem';

// Rate limiting storage
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Debounce storage - tracks last request time per IP
const debounceMap = new Map<string, number>();
const DEBOUNCE_MS = 10_000; // 10 seconds between requests

export default defineEventHandler(async (event) => {
  // Get API keys from runtime config inside handler
  const runtimeConfig = useRuntimeConfig(event);

  try {
    // Check for unlimited access cookie
    const hasUnlimited = await hasUnlimitedAccess(event);

    // On Cloudflare, cf-connecting-ip is set by the edge and cannot be
    // spoofed. The first X-Forwarded-For entry is client-controlled.
    const ip =
      getHeader(event, 'cf-connecting-ip')
      || getRequestIP(event, { xForwardedFor: true })
      || 'unknown';
    const now = Date.now();

    // Rate limiting check (skip in development or if user has unlimited access)
    if (!import.meta.dev && !hasUnlimited) {
      // Debounce check - reject if request came too quickly after previous one
      const lastRequestTime = debounceMap.get(ip);
      if (lastRequestTime && now - lastRequestTime < DEBOUNCE_MS) {
        const waitSeconds = Math.ceil(
          (DEBOUNCE_MS - (now - lastRequestTime)) / 1000
        );
        consola.warn(
          `Debounce triggered for IP: ${ip} - must wait ${waitSeconds}s`
        );
        throw createError({
          statusCode: 429,
          statusMessage: `Please wait ${waitSeconds} seconds before generating another poem.`,
        });
      }

      // Rate limit check
      const rateLimitData = rateLimitMap.get(ip);

      // If no data or reset time has passed, initialize/reset the counter
      if (!rateLimitData || now >= rateLimitData.resetTime) {
        rateLimitMap.set(ip, {
          count: 1, // Start at 1 (this request counts)
          resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        consola.info(
          `Rate limit initialized for IP ${ip}: 1/${RATE_LIMIT_MAX_REQUESTS} requests used`
        );
      } else if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
        // Rate limit exceeded
        const timeRemaining = rateLimitData.resetTime - now;
        const hoursRemaining = Math.ceil(
          timeRemaining / (60 * 60 * 1000)
        );

        consola.warn(
          `Rate limit exceeded for IP: ${ip} (${rateLimitData.count}/${RATE_LIMIT_MAX_REQUESTS} requests)`
        );

        throw createError({
          statusCode: 429,
          statusMessage: `You have reached the maximum of ${RATE_LIMIT_MAX_REQUESTS} free poems per 24 hours. Upgrade to unlimited access for just €6,99 (incl. VAT)!`,
        });
      } else {
        // Increment counter BEFORE generation starts (fixes race condition)
        rateLimitMap.set(ip, {
          count: rateLimitData.count + 1,
          resetTime: rateLimitData.resetTime,
        });
        consola.info(
          `Rate limit for IP ${ip}: ${rateLimitData.count + 1}/${RATE_LIMIT_MAX_REQUESTS} requests used`
        );
      }

      // Update debounce timestamp
      debounceMap.set(ip, now);
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
      // Never log what visitors type: names and details are personal.
    });

    // Build the prompt
    const prompt = buildPrompt(validatedData);

    const modelId = runtimeConfig.aiGatewayModel || DEFAULT_POEM_MODEL;
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
          + `Estimated cost: $${estimateCostUsd(usage).toFixed(6)}`,
        );

        if (hasUnlimited) {
          consola.info(
            'User has unlimited access via cookie - skipping rate limit'
          );
        }
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
