import type { H3Event } from 'h3';
import { consola } from 'consola';
import { z } from 'zod';
import {
  CLIENT_EVENTS,
  DETAIL_MAX_LENGTH,
  DETAIL_PATTERN,
  PATH_MAX_LENGTH,
  CAMPAIGN_PATTERN,
  type AnalyticsEventName,
} from '../../utils/analyticsEvents';
import type { TierId } from '../../utils/pricingTiers';

/**
 * Events go to Workers Analytics Engine (binding `ANALYTICS`, dataset
 * `sintgpt_events`). Columns are positional, so the order below is the
 * contract for every query (scripts/analytics-report.ts, CLAUDE.md):
 *
 *   index1  event name (also the sampling key)
 *   blob1   event name      blob4  country          blob7  poem language
 *   blob2   path            blob5  poem style       blob8  plan: free | paid
 *   blob3   site language   blob6  rhyme scheme     blob9  detail
 *   blob10  utm_source      blob13 fun facts: empty | short | long
 *   blob11  utm_medium      blob14 present: none | named | secret
 *   blob12  utm_campaign    blob15 written by: yes | no   blob16 audience: yes | no
 *   blob17  tier: drie | gezin | familie, empty for free visitors
 *   double1 poem lines      double3 output tokens   double5 value
 *   double2 input tokens    double4 estimated cost in USD
 *   double6 seconds to the first text               double7 seconds in total
 *
 * Only ever append columns: existing queries depend on these positions.
 * Never put names, poem text, payment IDs or IP addresses in an event.
 */
export interface AnalyticsFields {
  path?: string;
  locale?: string;
  country?: string;
  style?: string;
  rhymeScheme?: string;
  language?: string;
  plan?: 'free' | 'paid';
  detail?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  facts?: 'empty' | 'short' | 'long';
  present?: 'none' | 'named' | 'secret';
  writtenBy?: 'yes' | 'no';
  audience?: 'yes' | 'no';
  tier?: TierId;
  lines?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  value?: number;
  firstTextSeconds?: number;
  totalSeconds?: number;
}

export interface AnalyticsDataPoint {
  indexes: string[];
  blobs: string[];
  doubles: number[];
}

interface AnalyticsBinding {
  writeDataPoint(point: AnalyticsDataPoint): void;
}

const BLOB_MAX = 200;

const number = (value: number | undefined) => (Number.isFinite(value) ? value! : 0);

/** The row for one event, with every column in its fixed place. */
export function analyticsDataPoint(name: AnalyticsEventName, fields: AnalyticsFields = {}): AnalyticsDataPoint {
  const blobs = [
    name,
    fields.path,
    fields.locale,
    fields.country,
    fields.style,
    fields.rhymeScheme,
    fields.language,
    fields.plan,
    fields.detail,
    fields.source,
    fields.medium,
    fields.campaign,
    fields.facts,
    fields.present,
    fields.writtenBy,
    fields.audience,
    fields.tier,
  ].map(value => (value ?? '').slice(0, BLOB_MAX));
  return {
    indexes: [name],
    blobs,
    doubles: [
      fields.lines,
      fields.inputTokens,
      fields.outputTokens,
      fields.costUsd,
      fields.value,
      fields.firstTextSeconds,
      fields.totalSeconds,
    ].map(number),
  };
}

function binding(event: H3Event): AnalyticsBinding | undefined {
  const { cloudflare } = event.context as { cloudflare?: { env?: { ANALYTICS?: AnalyticsBinding } } };
  return cloudflare?.env?.ANALYTICS;
}

/** Cloudflare's two-letter country code; never the IP address itself. */
export function requestCountry(event: H3Event): string {
  const country = (event as { headers?: Headers }).headers?.get('cf-ipcountry') ?? '';
  return /^[A-Z]{2}$/.test(country) ? country : '';
}

/**
 * Writes one event. Never throws and never waits: analytics must not break or
 * slow down a request. Without the binding (Node build, tests) it does nothing.
 */
export function trackServerEvent(event: H3Event, name: AnalyticsEventName, fields: AnalyticsFields = {}): void {
  const analytics = binding(event);
  if (!analytics) return;
  try {
    analytics.writeDataPoint(analyticsDataPoint(name, { country: requestCountry(event), ...fields }));
  } catch (error: any) {
    consola.warn('Analytics event not written:', error?.message);
  }
}

/** What the browser may send. Anything else is refused, so nobody can fill the dataset with free text. */
export const ClientEventSchema = z.object({
  name: z.enum(CLIENT_EVENTS),
  path: z.string().max(PATH_MAX_LENGTH).regex(/^\/[^\s?#]*$/).optional(),
  locale: z.enum(['nl', 'en']).optional(),
  detail: z.string().max(DETAIL_MAX_LENGTH).regex(DETAIL_PATTERN).optional(),
  value: z.number().finite().min(0).max(10_000).optional(),
  source: z.string().regex(CAMPAIGN_PATTERN).optional(),
  medium: z.string().regex(CAMPAIGN_PATTERN).optional(),
  campaign: z.string().regex(CAMPAIGN_PATTERN).optional(),
});

/** How much of the form was used, in coarse steps: never the text itself. */
export function formFacts(request: {
  funFacts?: string;
  present?: string;
  revealPresent?: boolean;
  writtenBy?: string;
  writtenForAudience?: string;
}): Pick<AnalyticsFields, 'facts' | 'present' | 'writtenBy' | 'audience'> {
  const facts = request.funFacts?.trim() ?? '';
  return {
    facts: !facts ? 'empty' : facts.length < 100 ? 'short' : 'long',
    present: !request.present?.trim() ? 'none' : request.revealPresent === false ? 'secret' : 'named',
    writtenBy: request.writtenBy?.trim() ? 'yes' : 'no',
    audience: request.writtenForAudience?.trim() ? 'yes' : 'no',
  };
}
