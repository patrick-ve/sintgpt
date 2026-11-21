import { consola } from 'consola';
import { createGateway, generateText } from 'ai';
import { formFacts, trackServerEvent } from '../../utils/analytics';
import { clientDisconnectSignal } from '../../utils/clientDisconnect';
import { paidAccess } from '../../utils/paymentCookie';
import { paymentsAvailable } from '../../utils/paymentsStatus';
import { checkPoemRateLimit, rateLimitIp } from '../../utils/poemRateLimit';
import { POEM_PREVIEW_LIMIT } from '../../utils/rateLimit';
import {
  newPreviewId,
  PREVIEW_TTL_SECONDS,
  previewEnabled,
  previewKey,
  previewStore,
  previewTeaser,
  type StoredPreview,
} from '../../utils/poemPreview';
import {
  buildPrompt,
  DEFAULT_POEM_MODEL,
  estimateCostUsd,
  poemProviderOptions,
  PoemRequestSchema,
  withPoemLength,
} from '../../utils/poem';
import { framePoem, poemFrame } from '../../../utils/poemFrame';

/**
 * "Write first, then pay" (server/utils/poemPreview.ts): writes the poem of a
 * free visitor without poems left, keeps it in KV and returns only its start.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const store = previewStore(event);

  // Without KV (the Node build) or the secret, the page opens the payment window as before.
  if (!previewEnabled(config.poemPreview) || !store || !config.accessCookieSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Previews are off', data: { reason: 'unavailable' } });
  }
  if (await paidAccess(event)) {
    throw createError({ statusCode: 409, statusMessage: 'Buyers write poems directly', data: { reason: 'paid' } });
  }
  if (!(await paymentsAvailable(event))) {
    throw createError({ statusCode: 409, statusMessage: 'Payments are not available', data: { reason: 'payments' } });
  }

  const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  if (!import.meta.dev) {
    const verdict = await checkPoemRateLimit(event, { kind: 'preview', id: rateLimitIp(ip) }, POEM_PREVIEW_LIMIT);
    if (!verdict.ok) {
      consola.warn(`Preview limit: ${verdict.reason}`);
      trackServerEvent(event, 'Rate limited', { detail: `preview:${verdict.reason}`, plan: 'free' });
      setResponseHeader(event, 'retry-after', verdict.retryAfterSeconds);
      throw createError({
        statusCode: 429,
        statusMessage: 'No more previews for now',
        data: { reason: verdict.reason, retryAfterSeconds: verdict.retryAfterSeconds },
      });
    }
  }

  const parsed = PoemRequestSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    trackServerEvent(event, 'Poem generation failed', { detail: 'invalid preview' });
    throw createError({ statusCode: 400, statusMessage: 'Invalid request data' });
  }
  // A new poem only: no rewrite, no wish, no previous poem.
  const input = { ...withPoemLength(parsed.data), regenerate: false, rewriteHint: undefined, previousPoem: undefined, previousShare: undefined };

  const fields = {
    style: input.style,
    rhymeScheme: input.rhymeScheme,
    language: input.language,
    lines: input.lines,
    plan: 'free' as const,
    ...formFacts(input),
  };
  const modelId = config.aiGatewayModel || DEFAULT_POEM_MODEL;
  const startedAt = Date.now();

  try {
    const result = await generateText({
      model: createGateway({ apiKey: config.aiGatewayApiKey || undefined })(modelId),
      prompt: buildPrompt(input),
      // Same settings as a poem: see generate.post.ts.
      temperature: 1,
      maxRetries: 3,
      providerOptions: poemProviderOptions(modelId),
      abortSignal: clientDisconnectSignal(event),
    });
    const text = result.text.trim();
    if (!text) throw new Error('Empty poem');
    const poem = input.greeting ? framePoem(text, poemFrame(input.name, input.language)) : text;

    const id = newPreviewId();
    const stored: StoredPreview = {
      poem,
      style: input.style,
      rhymeScheme: input.rhymeScheme,
      language: input.language,
      lines: input.lines,
      createdAt: Date.now(),
    };
    await store.put(previewKey(id), JSON.stringify(stored), { expirationTtl: PREVIEW_TTL_SECONDS });

    trackServerEvent(event, 'Poem preview', {
      ...fields,
      detail: modelId,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      costUsd: estimateCostUsd(result.usage, modelId),
      totalSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
    });
    return { id, ...previewTeaser(poem), expiresAt: Date.now() + PREVIEW_TTL_SECONDS * 1000 };
  } catch (error: any) {
    // The message only: AI SDK errors can carry the whole prompt.
    consola.error('Preview failed:', error?.message);
    trackServerEvent(event, 'Poem generation failed', { ...fields, detail: `preview:${error?.name ?? 'error'}` });
    throw createError({ statusCode: 502, statusMessage: 'The poem service is not available' });
  }
});
