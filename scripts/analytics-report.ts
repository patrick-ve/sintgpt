// Prints a short report from the Workers Analytics Engine dataset.
//
//   CLOUDFLARE_ANALYTICS_TOKEN=... npx tsx scripts/analytics-report.ts [today|yesterday|<days>]
//
// `today` and `yesterday` are Dutch calendar days and add the same day a week
// earlier, for comparison, and a timeline of the notable events. A number is
// that many times 24 hours back from now.
//
// The token needs only "Account Analytics Read". Column names follow the
// order in server/utils/analytics.ts. Counts are weighted with
// _sample_interval, because Analytics Engine can sample busy datasets.

import { ALERT_ERROR_EVENTS, ALERT_MONEY_EVENTS } from '../server/utils/alerts';
import { DATASET, analyticsCredentials, analyticsQuery as query } from './analyticsSql';
import { dutchDayStart, dutchTime, sqlTimestamp } from './dutchDay';

analyticsCredentials();

const arg = process.argv[2] ?? '7';
const now = new Date();
let title: string;
let since: string;
let weekBefore: string | null = null;

if (arg === 'today' || arg === 'yesterday') {
  const daysAgo = arg === 'today' ? 0 : 1;
  const from = dutchDayStart(now, daysAgo);
  const to = arg === 'today' ? now : dutchDayStart(now, 0);
  const between = (start: Date, end: Date) =>
    `timestamp >= toDateTime('${sqlTimestamp(start)}') AND timestamp < toDateTime('${sqlTimestamp(end)}')`;
  since = between(from, to);
  // The same hours a week earlier, so a weekday is compared with the same weekday.
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  weekBefore = between(new Date(from.getTime() - WEEK), new Date(to.getTime() - WEEK));
  const day = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'full' }).format(from);
  title = `${arg} (${day}, 00:00 to ${arg === 'today' ? dutchTime(now) : '24:00'} Dutch time)`;
} else {
  const days = Number.parseInt(arg, 10);
  if (!Number.isInteger(days) || days < 1 || days > 92) {
    console.error('Use today, yesterday or a whole number of days from 1 to 92 (data is kept for 3 months).');
    process.exit(1);
  }
  since = `timestamp > NOW() - INTERVAL '${days}' DAY`;
  title = `last ${days} day(s)`;
}

const sqlList = (values: readonly string[]) => values.map(value => `'${value}'`).join(', ');

/** Events worth a line of their own in a one-day timeline. */
const TIMELINE_EVENTS = [
  ...ALERT_ERROR_EVENTS,
  ...ALERT_MONEY_EVENTS,
  'Generate poem', 'Regenerate poem', 'Poem aborted', 'Rate limited', 'No poems left', 'Form refused',
  'Show payment modal', 'Close payment modal', 'Proceed to payment', 'Payment returned', 'Payment verified',
  'Payment succeeded', 'Access restored', 'Restore failed', 'Poem retry', 'Rate poem', 'Edit poem',
  'Contact sent', 'Contact refused', 'Contact failed', 'Surprise ideas',
];

const QUERIES: Record<string, string> = {
  'Events': `
    SELECT blob1 AS event, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${since}
    GROUP BY event ORDER BY count DESC`,
  'Poems per day': `
    SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day,
      SUM(_sample_interval) AS poems,
      SUM(_sample_interval * if(blob8 = 'paid', 1, 0)) AS paid,
      round(SUM(_sample_interval * double4), 4) AS cost_usd
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Generate poem', 'Regenerate poem')
    GROUP BY day ORDER BY day`,
  'Poems by style': `
    SELECT blob5 AS style, blob7 AS language, SUM(_sample_interval) AS poems
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Generate poem', 'Regenerate poem')
    GROUP BY style, language ORDER BY poems DESC`,
  'Funnel': `
    SELECT blob1 AS step, SUM(_sample_interval) AS count
    FROM ${DATASET}
    WHERE ${since} AND blob1 IN ('Page view', 'Form started', 'Form refused', 'No poems left', 'Generate poem',
      'Poem ready', 'Show payment modal', 'Close payment modal', 'Proceed to payment',
      'Payment returned', 'Payment verified', 'Continue after payment', 'Payments unavailable')
    GROUP BY step ORDER BY count DESC`,
  'Payment window: why it opened and how it closed': `
    SELECT blob1 AS event, blob9 AS detail, SUM(_sample_interval) AS count
    FROM ${DATASET}
    WHERE ${since} AND blob1 IN ('Show payment modal', 'Close payment modal', 'Payment returned',
      'Payment verified', 'Restore failed', 'Rate limited')
    GROUP BY event, detail ORDER BY event, count DESC`,
  'Revenue from webhooks': `
    SELECT blob9 AS type, SUM(_sample_interval) AS count, round(SUM(_sample_interval * double5), 2) AS amount
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Payment webhook'
    GROUP BY type ORDER BY count DESC`,
  'Where writers come from': `
    SELECT blob1 AS event, blob9 AS source, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Scroll to poem form', 'Go to poem form', 'Shared poem to form')
    GROUP BY event, source ORDER BY count DESC`,
  'Campaigns': `
    SELECT blob10 AS source, blob11 AS medium, blob12 AS campaign, SUM(_sample_interval) AS visits
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Page view' AND blob10 != ''
    GROUP BY source, medium, campaign ORDER BY visits DESC LIMIT 20`,
  'Writing speed and aborts': `
    SELECT blob1 AS event, SUM(_sample_interval) AS count,
      round(SUM(_sample_interval * double6) / SUM(_sample_interval), 1) AS avg_first_text_s,
      round(SUM(_sample_interval * double7) / SUM(_sample_interval), 1) AS avg_total_s
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Generate poem', 'Regenerate poem', 'Poem aborted')
    GROUP BY event`,
  'Form use per poem': `
    SELECT blob13 AS fun_facts, blob14 AS present, blob15 AS written_by, blob16 AS audience,
      SUM(_sample_interval) AS poems
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Generate poem', 'Regenerate poem')
    GROUP BY fun_facts, present, written_by, audience ORDER BY poems DESC LIMIT 20`,
  'Poems per device (Poem ready)': `
    SELECT double5 AS poem_number, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Poem ready'
    GROUP BY poem_number ORDER BY poem_number LIMIT 20`,
  'Pages': `
    SELECT blob2 AS path, SUM(_sample_interval) AS views
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Page view'
    GROUP BY path ORDER BY views DESC LIMIT 20`,
  'Referrers': `
    SELECT blob9 AS referrer, SUM(_sample_interval) AS visits
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Page view' AND blob9 != ''
    GROUP BY referrer ORDER BY visits DESC LIMIT 20`,
  'Countries': `
    SELECT blob4 AS country, SUM(_sample_interval) AS views
    FROM ${DATASET} WHERE ${since} AND blob1 = 'Page view'
    GROUP BY country ORDER BY views DESC LIMIT 10`,
  'Problems': `
    SELECT blob1 AS event, blob9 AS detail, blob2 AS path, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${since} AND blob1 IN (${sqlList([...ALERT_ERROR_EVENTS, 'Poem retry', 'Contact refused'])})
    GROUP BY event, detail, path ORDER BY count DESC LIMIT 30`,
  'Contact form': `
    SELECT blob1 AS event, blob9 AS detail, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${since} AND blob1 IN ('Contact', 'Contact sent', 'Contact refused', 'Contact failed')
    GROUP BY event, detail ORDER BY count DESC`,
};

if (weekBefore) {
  QUERIES['Same hours a week earlier'] = `
    SELECT blob1 AS event, SUM(_sample_interval) AS count
    FROM ${DATASET} WHERE ${weekBefore}
    GROUP BY event ORDER BY count DESC`;
  QUERIES['Timeline (UTC; Dutch time is +1 in winter, +2 in summer)'] = `
    SELECT timestamp, blob1 AS event, blob9 AS detail, blob17 AS tier, double5 AS value, blob4 AS country
    FROM ${DATASET} WHERE ${since} AND blob1 IN (${sqlList(TIMELINE_EVENTS)})
    ORDER BY timestamp LIMIT 300`;
}

console.log(`SintGPT, ${title}`);
for (const [title, sql] of Object.entries(QUERIES)) {
  console.log(`\n${title}`);
  try {
    const rows = await query(sql);
    if (rows.length) console.table(rows);
    else console.log('  (no data)');
  } catch (error) {
    console.log(`  failed: ${(error as Error).message}`);
  }
}
