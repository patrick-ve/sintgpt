// Prints a short report from the Workers Analytics Engine dataset.
//
//   CLOUDFLARE_ANALYTICS_TOKEN=... npx tsx scripts/analytics-report.ts [days]
//
// The token needs only "Account Analytics Read". Column names follow the
// order in server/utils/analytics.ts. Counts are weighted with
// _sample_interval, because Analytics Engine can sample busy datasets.

import { DATASET, analyticsCredentials, analyticsQuery as query } from './analyticsSql';

analyticsCredentials();

const days = Number.parseInt(process.argv[2] ?? '7', 10);
if (!Number.isInteger(days) || days < 1 || days > 92) {
  console.error('Days must be a whole number from 1 to 92 (data is kept for 3 months).');
  process.exit(1);
}
const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;

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
    WHERE ${since} AND blob1 IN ('Page view', 'Form started', 'Form refused', 'Generate poem',
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
};

console.log(`SintGPT, last ${days} day(s)`);
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
