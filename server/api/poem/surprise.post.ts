import { consola } from 'consola';
import { createGateway, generateText, Output } from 'ai';
import { trackServerEvent } from '../../utils/analytics';
import { paidAccess } from '../../utils/paymentCookie';
import { checkPoemRateLimit } from '../../utils/poemRateLimit';
import { DEFAULT_POEM_MODEL, estimateCostUsd } from '../../utils/poem';
import { BUYER_RATE_LIMIT } from '../../utils/rateLimit';
import { buildSurprisePrompt, SurpriseIdeasSchema, SurpriseRequestSchema, trimIdeas } from '../../utils/surprise';
import { TIERS } from '../../../utils/pricingTiers';

/**
 * Three surprise ideas for the recipient of the poem on screen. Part of the
 * Hele familie tier; it counts towards the buyer's daily cap like a poem.
 */
export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);
  const access = await paidAccess(event);
  if (!access || !TIERS[access.tier].surpriseIdeas) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Surprise ideas are part of Hele familie',
      data: { reason: 'tier' },
    });
  }

  if (!import.meta.dev) {
    const verdict = await checkPoemRateLimit(event, { kind: 'buyer', id: access.paymentId }, BUYER_RATE_LIMIT);
    if (!verdict.ok) {
      const reason = verdict.reason === 'limit' ? 'fair-use' : verdict.reason;
      trackServerEvent(event, 'Rate limited', { detail: `surprise ${reason}`, plan: 'paid', tier: access.tier });
      setResponseHeader(event, 'retry-after', verdict.retryAfterSeconds);
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests',
        data: { reason, retryAfterSeconds: verdict.retryAfterSeconds },
      });
    }
  }

  const parsed = SurpriseRequestSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request data' });
  }

  const startedAt = Date.now();
  try {
    const gateway = createGateway({ apiKey: runtimeConfig.aiGatewayApiKey || undefined });
    const result = await generateText({
      model: gateway(DEFAULT_POEM_MODEL),
      prompt: buildSurprisePrompt(parsed.data),
      output: Output.object({ schema: SurpriseIdeasSchema }),
      temperature: 1,
      maxRetries: 2,
      // Ideas need little thought; keep the wait short.
      providerOptions: { google: { thinkingConfig: { thinkingLevel: 'low' } } },
    });
    trackServerEvent(event, 'Surprise ideas', {
      language: parsed.data.language,
      plan: 'paid',
      tier: access.tier,
      detail: DEFAULT_POEM_MODEL,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      costUsd: estimateCostUsd(result.usage, DEFAULT_POEM_MODEL),
      totalSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
    });
    return trimIdeas(result.output);
  } catch (error: any) {
    // The message only: AI SDK errors can carry the whole prompt.
    consola.error('Surprise ideas failed:', error?.message);
    trackServerEvent(event, 'Surprise ideas failed', { plan: 'paid', tier: access.tier, detail: String(error?.name ?? 'error').slice(0, 60) });
    throw createError({ statusCode: 502, statusMessage: 'Could not think of surprises' });
  }
});
