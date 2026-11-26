import { consola } from 'consola';
import {
  createGateway,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  toUIMessageStream,
} from 'ai';
import { formFacts, trackServerEvent } from '../../utils/analytics';
import { clientDisconnectSignal } from '../../utils/clientDisconnect';
import { paidAccess } from '../../utils/paymentCookie';
import { checkPoemRateLimit, rateLimitIp, releasePoemCount, type RateLimitSubject } from '../../utils/poemRateLimit';
import { EMPTY_POEM_ERRORS } from '../../../utils/poemStream';
import { freeRewriteEnabled, qualifiesForFreeRewrite } from '../../utils/freeRewrite';
import { signPoemShare } from '../../utils/poemShare';
import { paymentsAvailable } from '../../utils/paymentsStatus';
import { BUYER_RATE_LIMIT, creditsRule, FREE_REWRITE_LIMIT, freeRateLimit, poemAttempt } from '../../utils/rateLimit';
import { TIERS } from '../../../utils/pricingTiers';
import { framePoem, framePoemStream, poemFrame } from '../../../utils/poemFrame';
import {
  buildPrompt,
  FALLBACK_POEM_MODEL,
  estimateCostUsd,
  POEM_MODEL,
  poemProviderOptions,
  PoemRequestSchema,
  withPoemLength,
} from '../../utils/poem';

export default defineEventHandler(async (event) => {
  // Get API keys from runtime config inside handler
  const runtimeConfig = useRuntimeConfig(event);

  try {
    // Buyers have a high daily cap per payment (Drie: 3 poems in total), free
    // visitors a low one per IP.
    const access = await paidAccess(event);
    const tier = access ? TIERS[access.tier] : null;

    // On Cloudflare, cf-connecting-ip is set by the edge and cannot be
    // spoofed. The first X-Forwarded-For entry is client-controlled.
    const ip =
      getHeader(event, 'cf-connecting-ip')
      || getRequestIP(event, { xForwardedFor: true })
      || 'unknown';

    // A rewrite uses the larger model. Drie does not include it; refused
    // before it counts as one of the three poems.
    if (tier && !tier.rewrites) {
      const peek = await readBody<{ regenerate?: unknown }>(event).catch(() => null);
      if (peek?.regenerate === true) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Rewrites are not part of this purchase',
          data: { reason: 'tier' },
        });
      }
    }

    // A free visitor's one free rewrite of a poem SintGPT wrote, with a wish:
    // its own counter (safeguards in freeRewrite.ts).
    const freeRewrite = !access
      && freeRewriteEnabled(runtimeConfig.freeRewrite)
      && await qualifiesForFreeRewrite(await readBody(event).catch(() => null), runtimeConfig.accessCookieSecret);

    // Gives the poem back when the model sends no text (set below once the
    // poem counted). Without an attempt ID nothing can be given back.
    let releasePoem = async (): Promise<boolean> => false;

    if (!import.meta.dev) {
      // Free visitors get the one poem the page offers, per connection, so a
      // private window (which resets the page's count) gets nothing extra.
      // While payments do not work, the page allows more and so does this.
      const rule = tier?.poems
        ? creditsRule(tier.poems, access!.expiresAt, Date.now())
        : access ? BUYER_RATE_LIMIT : freeRewrite ? FREE_REWRITE_LIMIT : freeRateLimit(await paymentsAvailable(event));
      // The same attempt again after a dropped connection does not count
      // (MAX_POEM_RETRIES in server/utils/rateLimit.ts).
      const attempt = poemAttempt(await readBody(event).catch(() => null));
      const subject: RateLimitSubject = access
        ? { kind: 'buyer', id: access.paymentId }
        : { kind: freeRewrite ? 'rewrite' : 'ip', id: rateLimitIp(ip) };
      const verdict = await checkPoemRateLimit(event, subject, rule, attempt);
      if (verdict.ok && verdict.retry) consola.info('Poem retry after a dropped connection: not counted');
      if (verdict.ok && attempt) releasePoem = () => releasePoemCount(event, subject, attempt.id);
      if (!verdict.ok) {
        // The client shows the payment window for `limit` (free poems) and
        // `credits` (the three Drie poems are used). A buyer who reaches the
        // daily cap gets `fair-use` and a message instead.
        // `rewrite`: the free rewrite of this connection is used.
        const reason = verdict.reason === 'limit' && tier
          ? (tier.poems ? 'credits' : 'fair-use')
          : verdict.reason === 'limit' && freeRewrite ? 'rewrite' : verdict.reason;
        // No IP in the log: the reason is enough to see abuse.
        consola.warn(`Rate limit: ${reason}`);
        trackServerEvent(event, 'Rate limited', { detail: reason, plan: access ? 'paid' : 'free', tier: access?.tier });
        setResponseHeader(event, 'retry-after', verdict.retryAfterSeconds);
        throw createError({
          statusCode: 429,
          statusMessage: {
            debounce: `Please wait ${verdict.retryAfterSeconds} seconds before generating another poem.`,
            limit: `This connection has used its ${rule.maxRequests === 1 ? 'free poem' : `${rule.maxRequests} free poems`} for the last 24 hours.`,
            credits: `You have written the ${tier?.poems} poems you bought.`,
            'fair-use': `You have made ${BUYER_RATE_LIMIT.maxRequests} poems in 24 hours. Please try again later.`,
            rewrite: 'This connection has used its free rewrite for the last 24 hours.',
          }[reason],
          data: { reason, retryAfterSeconds: verdict.retryAfterSeconds },
        });
      }
    }

    // Read and parse the request body
    const body = await readBody(event);

    // Validate the request data
    const validatedData = withPoemLength(PoemRequestSchema.parse(body));

    consola.info('Generating poem with parameters:', {
      style: validatedData.style,
      rhymeScheme: validatedData.rhymeScheme,
      lines: validatedData.lines,
      language: validatedData.language,
      regenerate: validatedData.regenerate ?? false,
      greeting: validatedData.greeting,
      // Never log what visitors type: names and details are personal.
    });

    // The poem settings for analytics: never the name or any other text typed.
    const poemFields = {
      style: validatedData.style,
      rhymeScheme: validatedData.rhymeScheme,
      language: validatedData.language,
      lines: validatedData.lines,
      plan: access ? 'paid' as const : 'free' as const,
      tier: access?.tier,
      ...formFacts(validatedData),
    };

    // Timings for analytics. On Workers the clock moves with I/O, which is
    // exactly what these measure: waiting on the gateway.
    const startedAt = Date.now();
    let firstTextAt: number | null = null;
    const seconds = (from: number, to = Date.now()) => Math.round((to - from) / 100) / 10;

    // Build the prompt
    const prompt = buildPrompt(validatedData);

    // Every poem uses the poem model. Only a new poem follows an override;
    // a rewrite (also the free one) never does.
    const modelId = validatedData.regenerate
      ? POEM_MODEL
      : runtimeConfig.aiGatewayModel || POEM_MODEL;
    consola.info(`Sending request to AI Gateway (${modelId})...`);

    // Pass the key explicitly: on Cloudflare Workers secrets arrive as
    // bindings (exposed via runtime config), not as process.env.
    const gateway = createGateway({
      apiKey: runtimeConfig.aiGatewayApiKey || undefined,
    });

    // The stream reported an error (onError), so an empty end is not reported twice.
    let streamFailed = false;
    const disconnect = clientDisconnectSignal(event);

    const result = streamText({
      model: gateway(modelId),
      prompt,
      // Keep Gemini 3.x at its default of 1. At 2 the model often reasons
      // for minutes (15k+ tokens, ~$0.20 per poem) and can stream garbled
      // text instead of a poem.
      temperature: 1,
      maxRetries: 3,
      // The fallback model (AI Gateway switches to it if the primary one
      // fails) and the thinking level: see poemProviderOptions.
      providerOptions: poemProviderOptions(modelId),
      // Stop paying for tokens when the visitor leaves during generation.
      abortSignal: disconnect,
      // Models send text in bursts; release it word by word instead.
      experimental_transform: smoothStream({ delayInMs: 15, chunking: 'word' }),
      onChunk({ chunk }) {
        if (firstTextAt === null && chunk.type === 'text-delta') firstTextAt = Date.now();
      },
      onAbort() {
        consola.info('Client disconnected - stopped poem generation');
        trackServerEvent(event, 'Poem aborted', {
          ...poemFields,
          detail: firstTextAt === null ? 'before text' : 'during text',
          totalSeconds: seconds(startedAt),
        });
      },
      onError({ error }) {
        streamFailed = true;
        // The message only: AI SDK errors can carry the whole prompt.
        consola.error('Poem stream failed:', (error as Error | undefined)?.message);
        trackServerEvent(event, 'Poem generation failed', {
          ...poemFields,
          detail: (error as Error | undefined)?.name ?? 'stream error',
        });
      },
      onEnd({ usage, text, finishReason, rawFinishReason }) {
        // No text at all (an empty answer, such as a safety block): not a
        // poem. It still cost input tokens. The finish reason says why.
        const empty = !text.trim();
        if (empty && streamFailed) return;
        if (empty) consola.warn(`Poem came back empty (${rawFinishReason ?? finishReason})`);
        else consola.info('Poem generated successfully');
        trackServerEvent(event, empty ? 'Poem generation failed' : validatedData.regenerate ? 'Regenerate poem' : 'Generate poem', {
          ...poemFields,
          detail: empty ? `empty:${rawFinishReason ?? finishReason}` : modelId,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          costUsd: estimateCostUsd(usage, modelId),
          firstTextSeconds: firstTextAt === null ? 0 : seconds(startedAt, firstTextAt),
          totalSeconds: seconds(startedAt),
        });
        consola.info(
          `Tokens: ${usage.inputTokens ?? 0} in, ${usage.outputTokens ?? 0} out `
          + `(${usage.outputTokenDetails.reasoningTokens ?? 0} reasoning). `
          + `Estimated cost: $${estimateCostUsd(usage, modelId).toFixed(6)}`,
        );
      },
    });

    // "Lieve <name>," above the poem and "Van Sint & Piet" below it, added
    // here so they are exact and outside the model's line count.
    const frame = validatedData.greeting
      ? poemFrame(validatedData.name, validatedData.language)
      : null;
    const poemStream = frame ? result.stream.pipeThrough(framePoemStream(frame)) : result.stream;

    return createUIMessageStreamResponse({
      // no-transform keeps Cloudflare from compressing the stream, even if a
      // Compression Rule on the zone would match it. Compression buffers.
      headers: { 'cache-control': 'no-cache, no-transform' },
      stream: createUIMessageStream({
        async execute({ writer }) {
          writer.merge(toUIMessageStream({ stream: poemStream }));

          let poemText: string;
          try {
            poemText = (await result.text).trim();
          } catch {
            // The stream failed (it reports the error itself) or the visitor
            // left. A failure before the first word gives the poem back.
            if (firstTextAt === null && !disconnect.aborted) await releasePoem();
            return;
          }

          // No text (an empty answer, such as a safety block): give the poem
          // back and tell the page, which would otherwise show nothing while
          // the free poem was used (25 Nov 2026).
          if (!poemText) {
            if (disconnect.aborted) return;
            const released = await releasePoem();
            writer.write({ type: 'error', errorText: released ? EMPTY_POEM_ERRORS.released : EMPTY_POEM_ERRORS.counted });
            return;
          }

          // Sign the finished poem, so the visitor can share it as a link.
          // Without a secret the app still works, only without poem links.
          const secret = runtimeConfig.accessCookieSecret;
          if (!secret) return;
          try {
            // The same text the page received: the frame is part of it.
            const text = frame ? framePoem(poemText, frame) : poemText;
            writer.write({
              type: 'data-share',
              data: await signPoemShare(
                text,
                validatedData.language === 'dutch' ? 'nl' : 'en',
                secret,
                validatedData.style,
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
    trackServerEvent(event, 'Poem generation failed', {
      detail: error?.name === 'ZodError' ? 'invalid request' : String(error?.name ?? 'error'),
    });

    // Handle validation errors
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: { errors: error.issues },
      });
    }

    // Never the provider's message in the answer: it can name models,
    // gateways or limits. Workers Logs has it (logged above).
    if (error.name === 'APIError') {
      throw createError({
        statusCode: error.status >= 400 && error.status < 600 ? error.status : 502,
        statusMessage: 'The poem service is not available',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate poem',
    });
  }
});
