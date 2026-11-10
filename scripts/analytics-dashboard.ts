// Builds the analytics dashboard from the Workers Analytics Engine dataset and opens it.
//
//   npm run analytics -- [today|yesterday|24h|7d|30d|all|<days>] [--no-open]
//
// One query fetches the events of the last weeks, added up per hour and per
// combination of columns. The page embeds those counts and does the rest in the
// browser: period picker, comparison with the period before, the main chart,
// breakdowns and the country filter. So switching periods needs no new query.
//
// The page goes to reports/ (git-ignored). It holds counts only, never the
// token. Columns follow server/utils/analytics.ts; counts are weighted with
// _sample_interval. The browser code and styles are in scripts/dashboard/.

import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../utils/analyticsEvents';
import { DATASET, analyticsCredentials, analyticsQuery, type Row } from './analyticsSql';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Analytics Engine keeps data for 3 months. */
const MAX_DAYS = 92;
/** Enough for "Last 30 days" with the 30 days before it. */
const DEFAULT_WINDOW_DAYS = 62;

const PRESETS = ['today', 'yesterday', '24h', '7d', '30d', 'all'] as const;

/** The period the page opens with, and how many days of data it needs. */
export function parseArgs(args: string[]): { period: string; windowDays: number } {
  const arg = args.find(value => !value.startsWith('--')) ?? '7d';
  if ((PRESETS as readonly string[]).includes(arg)) return { period: arg, windowDays: DEFAULT_WINDOW_DAYS };
  const days = Number(arg.replace(/d$/, ''));
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new Error(`Use ${PRESETS.join(', ')} or a whole number of days from 1 to ${MAX_DAYS} (data is kept for 3 months).`);
  }
  return { period: `${days}d`, windowDays: Math.min(MAX_DAYS, Math.max(DEFAULT_WINDOW_DAYS, 2 * days)) };
}

/** Text columns, in the order of server/utils/analytics.ts. */
const DIMENSIONS = {
  e: 'blob1', path: 'blob2', locale: 'blob3', country: 'blob4', style: 'blob5', rhyme: 'blob6',
  lang: 'blob7', plan: 'blob8', detail: 'blob9', src: 'blob10', med: 'blob11', camp: 'blob12',
  facts: 'blob13', present: 'blob14', wby: 'blob15', aud: 'blob16', tier: 'blob17',
} as const;

/** Sums, weighted with the sample interval. */
const MEASURES = {
  n: '_sample_interval',
  lines: '_sample_interval * double1',
  cost: '_sample_interval * double4',
  amount: '_sample_interval * double5',
  first: '_sample_interval * double6',
  total: '_sample_interval * double7',
} as const;

export function factsQuery(from: Date): string {
  const dims = Object.entries(DIMENSIONS).map(([alias, column]) => `${column} AS ${alias}`);
  const sums = Object.entries(MEASURES).map(([alias, expr]) => `SUM(${expr}) AS ${alias}`);
  // double5 is a count for these two events (poems on the device, people in a
  // draw), so it is a column to group by. For webhooks it is an amount: a sum.
  const value = `if(blob1 IN ('Poem ready', 'Draw lootjes'), double5, 0.0) AS v`;
  return `SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS h, ${dims.join(', ')}, ${value}, ${sums.join(', ')}
    FROM ${DATASET} WHERE timestamp >= toDateTime('${from.toISOString().slice(0, 19).replace('T', ' ')}')
    GROUP BY h, ${Object.keys(DIMENSIONS).join(', ')}, v
    ORDER BY h LIMIT 500000`;
}

export interface DashboardData {
  generatedAt: number;
  /** Start of hour 0, in ms. */
  start: number;
  dims: Record<string, string[]>;
  /** One array per column; text columns hold an index into `dims`. */
  cols: Record<string, number[]>;
  rows: number;
  error?: string;
}

const parseHour = (value: unknown) => {
  const text = String(value);
  return Date.parse(/Z|[+-]\d\d:?\d\d$/.test(text) ? text : `${text.replace(' ', 'T')}Z`);
};

/** Column-wise, with each text value stored once, so the page stays small. */
export function encode(rows: Row[], start: number, generatedAt: number): DashboardData {
  const dims: Record<string, string[]> = {};
  const lookup: Record<string, Map<string, number>> = {};
  const cols: Record<string, number[]> = { h: [], v: [] };
  for (const key of Object.keys(DIMENSIONS)) {
    dims[key] = [];
    lookup[key] = new Map();
    cols[key] = [];
  }
  for (const key of Object.keys(MEASURES)) cols[key] = [];

  for (const row of rows) {
    cols.h!.push(Math.round((parseHour(row.h) - start) / HOUR));
    cols.v!.push(Number(row.v) || 0);
    for (const key of Object.keys(DIMENSIONS)) {
      const text = String(row[key] ?? '');
      let index = lookup[key]!.get(text);
      if (index === undefined) {
        index = dims[key]!.push(text) - 1;
        lookup[key]!.set(text, index);
      }
      cols[key]!.push(index);
    }
    for (const key of Object.keys(MEASURES)) cols[key]!.push(Math.round((Number(row[key]) || 0) * 1e6) / 1e6);
  }
  return { generatedAt, start, dims, cols, rows: rows.length };
}

const ASSETS = resolve(import.meta.dirname, 'dashboard');

export function renderDashboard(data: DashboardData, period: string): string {
  const css = readFileSync(resolve(ASSETS, 'app.css'), 'utf8');
  const js = readFileSync(resolve(ASSETS, 'app.js'), 'utf8');
  // Inside a script element, "<" must not start "</script>".
  const events = [...new Set([...SERVER_EVENTS, ...CLIENT_EVENTS])];
  const json = JSON.stringify({ ...data, period, events }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light dark">
<title>SintGPT analytics</title>
<style>${css}</style>
</head>
<body>
<div id="app" aria-busy="true"><p class="boot">Loading…</p></div>
<script id="data" type="application/json">${json}</script>
<script>${js}</script>
</body>
</html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  let options: ReturnType<typeof parseArgs>;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
  analyticsCredentials();

  const now = Date.now();
  // Whole hours, so hour 0 lines up with the hours the query returns.
  const start = Math.floor((now - options.windowDays * DAY) / HOUR) * HOUR;
  let data: DashboardData;
  try {
    data = encode(await analyticsQuery(factsQuery(new Date(start))), start, now);
  } catch (error) {
    console.error(`The query failed: ${(error as Error).message}`);
    data = { ...encode([], start, now), error: (error as Error).message };
  }

  const dir = resolve(import.meta.dirname, '..', 'reports');
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, 'analytics.html');
  writeFileSync(file, renderDashboard(data, options.period));
  console.log(`Dashboard: ${file} (${data.rows} rows, ${options.windowDays} days)`);
  if (!args.includes('--no-open') && process.platform === 'darwin') execFile('open', [file]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
