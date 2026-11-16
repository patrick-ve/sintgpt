// The contact form (pages/contact.vue, POST /api/contact). A message goes to
// the site owner on Telegram; nothing is stored. Spam protection, in order:
// a honeypot field and a minimum fill time (bots fail both, and get a fake
// "sent"), Cloudflare Turnstile (checked here, on the server), and a count of
// 5 messages a day per IP.
import { z } from 'zod';
import type { RateLimitRule } from './rateLimit';
import type { TierId } from '../../utils/pricingTiers';
import {
  CONTACT_LIMITS,
  CONTACT_MIN_SECONDS,
  CONTACT_TOPICS,
  TURNSTILE_ACTION,
  type ContactTopic,
} from '../../utils/contactForm';

export { CONTACT_LIMITS, CONTACT_MIN_SECONDS, TURNSTILE_ACTION };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Per IP. Enough for a question and a follow-up, too few to flood the owner's phone. */
export const CONTACT_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: DAY_MS,
  debounceMs: 10_000,
} as const satisfies RateLimitRule;

export const ContactRequestSchema = z.object({
  topic: z.enum(CONTACT_TOPICS),
  email: z.string().trim().max(CONTACT_LIMITS.email).pipe(z.email()),
  message: z.string().trim().min(CONTACT_LIMITS.messageMin).max(CONTACT_LIMITS.messageMax),
  locale: z.enum(['nl', 'en']),
  /** The page the visitor came from, as the browser saw it. */
  from: z.string().max(200).optional(),
  /** The honeypot: hidden from people, so it must stay empty. */
  website: z.string().max(500).optional(),
  /** Seconds between opening the page and sending. */
  elapsed: z.number().min(0).max(7 * 24 * 3600),
  turnstile: z.string().min(1).max(2048),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;

/** Why a message looks like a bot's, or null when it does not. */
export function contactTrap(request: Pick<ContactRequest, 'website' | 'elapsed'>): 'honeypot' | 'too fast' | null {
  if (request.website?.trim()) return 'honeypot';
  if (request.elapsed < CONTACT_MIN_SECONDS) return 'too fast';
  return null;
}

/** A path on this site, or nothing: the Telegram message must not carry visitor text here. */
export function contactFromPath(from: string | undefined): string {
  if (!from || !/^\/[a-z0-9/_-]*$/i.test(from)) return '';
  return from.replace(/^\/g\/[^/]+/, '/g/:id');
}

const TOPIC_LABELS: Record<ContactTopic, string> = {
  help: '🆘 Hulp',
  question: '❓ Vraag',
  complaint: '😠 Klacht',
};

export interface ContactFacts {
  tier: TierId | null;
}

/**
 * The Telegram message. Sent as plain text (no parse_mode), so the visitor's
 * text cannot add formatting or links that look like ours.
 */
export function contactMessage(request: ContactRequest, facts: ContactFacts): string {
  const from = contactFromPath(request.from);
  return [
    `${TOPIC_LABELS[request.topic]} via sintgpt.com/contact`,
    `Van: ${request.email}`,
    [`Tier: ${facts.tier ?? 'gratis'}`, `Taal: ${request.locale}`, from && `Pagina: ${from}`].filter(Boolean).join(' · '),
    '',
    request.message,
  ].join('\n');
}

export interface TurnstileResult {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
}

/**
 * Asks Cloudflare whether the Turnstile token is real, unused and made for
 * this form. Throws when Cloudflare cannot be reached.
 */
export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) throw new Error(`Turnstile answered ${res.status}`);
  const result = (await res.json()) as TurnstileResult;
  // The test keys answer without an action.
  return result.success === true && (!result.action || result.action === TURNSTILE_ACTION);
}
