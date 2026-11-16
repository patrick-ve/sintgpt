import { consola } from 'consola';
import { sendTelegram } from '../utils/alerts';
import { trackServerEvent } from '../utils/analytics';
import {
  CONTACT_RATE_LIMIT,
  ContactRequestSchema,
  contactMessage,
  contactTrap,
  verifyTurnstile,
} from '../utils/contact';
import { paidAccess } from '../utils/paymentCookie';
import { checkPoemRateLimit, rateLimitIp } from '../utils/poemRateLimit';

/**
 * The contact form: checks the message for bots and sends it to the site
 * owner on Telegram. Nothing is stored. Answers carry `data.reason`:
 * `unavailable` (the page shows the e-mail address), `invalid`, `captcha`
 * (try again), and the rate limit's `debounce` or `limit`.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { turnstileSecretKey, telegramBotToken, telegramChatId } = config;
  if (!turnstileSecretKey || !telegramBotToken || !telegramChatId) {
    throw createError({ statusCode: 503, statusMessage: 'Contact form unavailable', data: { reason: 'unavailable' } });
  }

  const parsed = ContactRequestSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request data', data: { reason: 'invalid' } });
  }
  const request = parsed.data;
  const locale = request.locale;

  // A bot gets the same answer as a person, so it does not learn what failed.
  const trap = contactTrap(request);
  if (trap) {
    trackServerEvent(event, 'Contact refused', { detail: trap, locale });
    return { ok: true };
  }

  const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || undefined;

  let human: boolean;
  try {
    human = await verifyTurnstile(turnstileSecretKey, request.turnstile, ip);
  } catch (error: any) {
    consola.error('Turnstile check failed:', error?.message);
    trackServerEvent(event, 'Contact failed', { detail: 'turnstile', locale });
    throw createError({ statusCode: 503, statusMessage: 'Contact form unavailable', data: { reason: 'unavailable' } });
  }
  if (!human) {
    trackServerEvent(event, 'Contact refused', { detail: 'captcha', locale });
    throw createError({ statusCode: 403, statusMessage: 'Captcha failed', data: { reason: 'captcha' } });
  }

  // Counted after Turnstile, so bots cannot use up a person's messages.
  if (!import.meta.dev) {
    const verdict = await checkPoemRateLimit(
      event,
      { kind: 'ip', id: `contact:${rateLimitIp(ip ?? 'unknown')}` },
      CONTACT_RATE_LIMIT,
    );
    if (!verdict.ok) {
      trackServerEvent(event, 'Rate limited', { detail: `contact ${verdict.reason}`, locale });
      setResponseHeader(event, 'retry-after', verdict.retryAfterSeconds);
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many messages',
        data: { reason: verdict.reason, retryAfterSeconds: verdict.retryAfterSeconds },
      });
    }
  }

  const access = await paidAccess(event);
  try {
    await sendTelegram({ telegramBotToken, telegramChatId }, contactMessage(request, { tier: access?.tier ?? null }));
  } catch (error: any) {
    consola.error('Contact message not sent:', error?.message);
    trackServerEvent(event, 'Contact failed', { detail: 'telegram', locale, tier: access?.tier });
    throw createError({ statusCode: 502, statusMessage: 'Contact form unavailable', data: { reason: 'unavailable' } });
  }

  trackServerEvent(event, 'Contact sent', {
    detail: request.topic,
    locale,
    plan: access ? 'paid' : 'free',
    tier: access?.tier,
  });
  return { ok: true };
});
