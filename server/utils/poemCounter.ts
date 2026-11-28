// The poem counter in the hero: "De Sint schreef dit seizoen al 236 gedichten,
// 21 vandaag". Real numbers only (CLAUDE.md, Social proof): it counts the
// poems the server wrote, read from Workers Analytics Engine, the same events
// the analytics report counts. The owner's own poems (sintgpt-intern cookie)
// write no events, so they are not in it.
//
// A poem is a new poem, a rewrite or a poem written before payment (the
// owner's choice on 28 Nov 2026: with previews). The season starts on
// 1 September of the year of the next pakjesavond; Analytics Engine keeps
// events for 3 months, which covers September to early December.

import { pakjesavondEnd } from '../../utils/pricingTiers';
import { dutchDayStart, sqlTimestamp } from '../../utils/dutchDay';

export const COUNTED_EVENTS = ['Generate poem', 'Regenerate poem', 'Poem preview'] as const;

/** Seconds a count is reused before Analytics Engine is asked again. */
export const POEM_COUNT_TTL_SECONDS = 300;

const ACCOUNT_ID = '8b2893f2640b94617462d93951ec6c4c';
const DATASET = 'sintgpt_events';

export interface PoemCount {
  season: number;
  today: number;
}

/** 1 September of the year of the next pakjesavond, 00:00 UTC. */
export function seasonStart(now: Date): Date {
  return new Date(Date.UTC(pakjesavondEnd(now).getUTCFullYear(), 8, 1));
}

/** One query for both numbers. Counts are weighted with `_sample_interval`. */
export function poemCountQuery(now: Date): string {
  const events = COUNTED_EVENTS.map(name => `'${name}'`).join(', ');
  const today = sqlTimestamp(dutchDayStart(now));
  return `SELECT SUM(_sample_interval) AS season, `
    + `SUM(IF(timestamp >= toDateTime('${today}'), _sample_interval, 0)) AS today `
    + `FROM ${DATASET} `
    + `WHERE timestamp >= toDateTime('${sqlTimestamp(seasonStart(now))}') AND blob1 IN (${events}) `
    + `FORMAT JSON`;
}

/** Reads both counts. Throws when Analytics Engine does not answer. */
export async function fetchPoemCount(token: string, now = new Date(), fetcher: typeof fetch = fetch): Promise<PoemCount> {
  const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: poemCountQuery(now),
  });
  if (!res.ok) throw new Error(`Analytics Engine query failed: ${res.status}`);
  const { data } = (await res.json()) as { data: Array<{ season?: number | string; today?: number | string }> };
  const row = data[0] ?? {};
  return { season: Math.round(Number(row.season) || 0), today: Math.round(Number(row.today) || 0) };
}
