// Builds an HTML dashboard from the Workers Analytics Engine dataset and opens it.
//
//   CLOUDFLARE_ANALYTICS_TOKEN=... npx tsx scripts/analytics-dashboard.ts [today|yesterday|<days>] [--no-open]
//
// Days are Dutch calendar days (Europe/Amsterdam), so "today" starts at midnight
// in the Netherlands. The page goes to reports/ (git-ignored) and holds counts
// only, never the token. Columns follow server/utils/analytics.ts; counts are
// weighted with _sample_interval.

import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../utils/analyticsEvents';
import { DATASET, analyticsCredentials, analyticsQuery, type Row } from './analyticsSql';

const TZ = 'Europe/Amsterdam';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MAX_DAYS = 92;

// ---------------------------------------------------------------- time

interface WallTime { year: number; month: number; day: number; hour: number; minute: number; second: number }

const wallFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function wall(date: Date): WallTime {
  const parts = Object.fromEntries(wallFormat.formatToParts(date).map(p => [p.type, Number(p.value)]));
  return { year: parts.year!, month: parts.month!, day: parts.day!, hour: parts.hour!, minute: parts.minute!, second: parts.second! };
}

/** Midnight in the Netherlands on the Dutch date of `date`. */
function dutchMidnight(date: Date): Date {
  const w = wall(date);
  const offset = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(date.getTime() / 1000) * 1000;
  return new Date(Date.UTC(w.year, w.month - 1, w.day) - offset);
}

const dutchDateKey = (date: Date) => {
  const w = wall(date);
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
};
const sqlTime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');
const parseSqlTime = (value: unknown) => {
  const text = String(value);
  return new Date(/Z|[+-]\d\d:?\d\d$/.test(text) ? text : `${text.replace(' ', 'T')}Z`);
};

export interface Period {
  slug: string;
  title: string;
  from: Date;
  /** Null when the period runs until now. */
  to: Date | null;
  hourly: boolean;
}

export function parsePeriod(arg: string, now: Date): Period {
  const todayStart = dutchMidnight(now);
  if (arg === 'today') {
    return { slug: 'today', title: 'Today', from: todayStart, to: null, hourly: true };
  }
  if (arg === 'yesterday') {
    const from = dutchMidnight(new Date(todayStart.getTime() - HOUR));
    return { slug: 'yesterday', title: 'Yesterday', from, to: todayStart, hourly: true };
  }
  const days = Number(arg);
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw new Error(`Use "today", "yesterday" or a whole number of days from 1 to ${MAX_DAYS} (data is kept for 3 months).`);
  }
  const from = dutchMidnight(new Date(now.getTime() - (days - 1) * DAY));
  return {
    slug: `${days}-days`,
    title: days === 1 ? 'Today' : `Last ${days} days`,
    from, to: null, hourly: days === 1,
  };
}

// ---------------------------------------------------------------- data

const POEM_EVENTS = `blob1 IN ('Generate poem', 'Regenerate poem')`;

/** The steps from a visit to a payment, in order. */
const FUNNEL = [
  { event: 'Page view', name: 'Page views', short: 'Views', hint: 'browser' },
  { event: 'Form started', name: 'Started the form', short: 'Form', hint: 'browser' },
  { event: 'Generate poem', name: 'Got a new poem', short: 'Poems', hint: 'server' },
  { event: 'Show payment modal', name: 'Saw the payment window', short: 'Pay window', hint: 'browser' },
  { event: 'Proceed to payment', name: 'Went to checkout', short: 'Checkout', hint: 'server' },
  { event: 'Payment verified', name: 'Paid', short: 'Paid', hint: 'server' },
] as const;

export function dashboardQueries(period: Period): Record<string, string> {
  const where = `timestamp >= toDateTime('${sqlTime(period.from)}')`
    + (period.to ? ` AND timestamp < toDateTime('${sqlTime(period.to)}')` : '');
  const from = `FROM ${DATASET} WHERE ${where}`;
  const n = 'SUM(_sample_interval) AS n';
  return {
    events: `SELECT blob1 AS event, ${n} ${from} GROUP BY event ORDER BY n DESC`,
    details: `SELECT blob1 AS event, blob9 AS detail, ${n} ${from} AND blob9 != '' GROUP BY event, detail ORDER BY n DESC LIMIT 1000`,
    timeline: `SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour, blob1 AS event, ${n} ${from}
      AND blob1 IN (${[...new Set(['Page view', 'Generate poem', 'Regenerate poem', ...FUNNEL.map(step => step.event)])].map(e => `'${e}'`).join(', ')})
      GROUP BY hour, event`,
    poems: `SELECT blob1 AS event, blob5 AS style, blob6 AS rhyme, blob7 AS language, blob8 AS plan,
      blob13 AS facts, blob14 AS present, blob15 AS written_by, blob16 AS audience, ${n},
      SUM(_sample_interval * double1) AS lines, SUM(_sample_interval * double4) AS cost,
      SUM(_sample_interval * double6) AS first_s, SUM(_sample_interval * double7) AS total_s
      ${from} AND ${POEM_EVENTS}
      GROUP BY event, style, rhyme, language, plan, facts, present, written_by, audience`,
    pages: `SELECT blob2 AS path, ${n} ${from} AND blob1 = 'Page view' GROUP BY path ORDER BY n DESC LIMIT 30`,
    countries: `SELECT blob4 AS country, ${n} ${from} AND blob1 = 'Page view' GROUP BY country ORDER BY n DESC LIMIT 30`,
    locales: `SELECT blob3 AS locale, ${n} ${from} AND blob1 = 'Page view' GROUP BY locale ORDER BY n DESC`,
    campaigns: `SELECT blob10 AS source, blob11 AS medium, blob12 AS campaign, ${n} ${from}
      AND blob1 = 'Page view' AND blob10 != '' GROUP BY source, medium, campaign ORDER BY n DESC LIMIT 30`,
    values: `SELECT blob1 AS event, double5 AS value, ${n} ${from}
      AND blob1 IN ('Poem ready', 'Draw lootjes') GROUP BY event, value ORDER BY value LIMIT 200`,
    money: `SELECT blob9 AS type, ${n}, SUM(_sample_interval * double5) AS amount ${from}
      AND blob1 = 'Payment webhook' GROUP BY type`,
    aborted: `SELECT blob9 AS detail, ${n}, SUM(_sample_interval * double7) AS seconds ${from}
      AND blob1 = 'Poem aborted' GROUP BY detail`,
  };
}

export type Results = Record<string, Row[] | { error: string }>;

async function fetchResults(queries: Record<string, string>): Promise<Results> {
  const entries = await Promise.all(Object.entries(queries).map(async ([key, sql]) => {
    try {
      return [key, await analyticsQuery(sql)] as const;
    } catch (error) {
      return [key, { error: (error as Error).message }] as const;
    }
  }));
  return Object.fromEntries(entries);
}

// ---------------------------------------------------------------- render helpers

const esc = (value: unknown) => String(value).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
));
const num = (value: unknown) => Number(value) || 0;
const int = (value: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value);
const dec = (value: number, digits = 1) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const eur = (value: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
const usd = (value: number, digits = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '');

interface Bar { label: string; n: number; note?: string }

function sumBy(rows: Row[], key: string): Bar[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = String(row[key] ?? '') || '(none)';
    totals.set(label, (totals.get(label) ?? 0) + num(row.n));
  }
  return [...totals].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}

function card(title: string, body: string, note = ''): string {
  return `<section class="card"><h3>${esc(title)}</h3>${body}${note ? `<p class="note">${esc(note)}</p>` : ''}</section>`;
}

/** Horizontal bars, one hue, each value printed beside its label. */
function barList(bars: Bar[], options: { total?: number; empty?: string } = {}): string {
  const rows = bars.filter(bar => bar.n > 0);
  if (!rows.length) return `<p class="empty">${esc(options.empty ?? 'No data yet.')}</p>`;
  const max = Math.max(...rows.map(bar => bar.n));
  const total = options.total ?? rows.reduce((sum, bar) => sum + bar.n, 0);
  return `<ul class="bars">${rows.map(bar => `
    <li>
      <span class="label">${esc(bar.label)}</span>
      <span class="value">${int(bar.n)}<small>${esc(bar.note ?? share(bar.n, total))}</small></span>
      <span class="track"><span class="fill" style="width:${((bar.n / max) * 100).toFixed(2)}%"></span></span>
    </li>`).join('')}</ul>`;
}

interface Bucket { key: string; axis: string; tip: string }

/** Vertical bars over time, one series, with a hover tip and a table view. */
function columns(buckets: Bucket[], values: Map<string, number>, unit: string): string {
  const max = Math.max(0, ...buckets.map(b => values.get(b.key) ?? 0));
  const every = Math.max(1, Math.ceil(buckets.length / 8));
  const total = buckets.reduce((sum, b) => sum + (values.get(b.key) ?? 0), 0);
  const cols = buckets.map((b) => {
    const n = values.get(b.key) ?? 0;
    const tip = `${b.tip} · ${int(n)} ${unit}`;
    const height = max ? (n / max) * 100 : 0;
    return `<div class="col" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}">${n ? `<span class="bar" style="height:${height.toFixed(2)}%"></span>` : ''}</div>`;
  }).join('');
  const axis = buckets.map((b, i) => `<span>${i % every === 0 ? esc(b.axis) : ''}</span>`).join('');
  const table = buckets.map(b => `<tr><td>${esc(b.tip)}</td><td>${int(values.get(b.key) ?? 0)}</td></tr>`).join('');
  return `
    <p class="total">${int(total)} <small>${esc(unit)} in total</small></p>
    <div class="plot">
      <span class="ymax">${max ? int(max) : ''}</span>
      <div class="cols" style="--n:${buckets.length}">${cols}</div>
      <div class="xaxis" style="--n:${buckets.length}" aria-hidden="true">${axis}</div>
    </div>
    <details><summary>Table</summary><table><tbody>${table}</tbody></table></details>`;
}

function buckets(period: Period, now: Date): Bucket[] {
  const end = (period.to ?? now).getTime();
  const hourLabel = (date: Date) => `${String(wall(date).hour).padStart(2, '0')}:00`;
  if (period.hourly) {
    const list: Bucket[] = [];
    for (let t = period.from.getTime(); t < end; t += HOUR) {
      const start = new Date(t);
      list.push({ key: sqlTime(start), axis: hourLabel(start), tip: `${hourLabel(start)}–${hourLabel(new Date(t + HOUR))}` });
    }
    return list;
  }
  const keys = new Set<string>();
  for (let t = period.from.getTime(); t < end; t += HOUR) keys.add(dutchDateKey(new Date(t)));
  keys.add(dutchDateKey(new Date(end - 1)));
  return [...keys].map((key) => {
    const date = new Date(`${key}T12:00:00Z`);
    return {
      key,
      axis: date.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }),
      tip: date.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });
}

// ---------------------------------------------------------------- funnel

interface FunnelStep { name: string; hint: string; n: number }

const rate = (part: number, whole: number) => (whole > 0 ? part / whole : null);
const percent = (value: number | null) => {
  if (value === null) return '–';
  const digits = value > 0 && value < 0.1 ? 1 : 0;
  return `${(value * 100).toFixed(digits)}%`;
};

const DROP_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10 1 3h10z" fill="currentColor"/></svg>';

/** Centred bars per step, with how many went on between the steps. */
function funnelChart(steps: FunnelStep[]): string {
  const max = Math.max(1, ...steps.map(step => step.n));
  const first = steps[0]!.n;
  // The step where the smallest share went on, among steps people reached.
  let worst = -1;
  let worstRate = 1;
  steps.forEach((step, i) => {
    if (i === 0) return;
    const r = rate(step.n, steps[i - 1]!.n);
    if (r !== null && r < worstRate) {
      worst = i;
      worstRate = r;
    }
  });

  const items = steps.map((step, i) => {
    const prev = i > 0 ? steps[i - 1]!.n : null;
    let drop = '';
    if (prev !== null) {
      const r = rate(step.n, prev);
      const text = r === null
        ? 'Nobody reached the step before'
        : r > 1
          ? `${percent(r)} of the step before (counted in a different place, see note)`
          : `${percent(r)} went on · ${int(prev - step.n)} stopped`;
      const flag = i === worst ? `<span class="flag">${DROP_ICON}Biggest drop</span>` : '';
      drop = `<li class="drop${i === worst ? ' worst' : ''}"><span>↓ ${esc(text)}</span>${flag}</li>`;
    }
    const width = (step.n / max) * 100;
    return `${drop}
      <li class="step">
        <div class="step-head">
          <span class="step-name">${i + 1}. ${esc(step.name)} <small>${esc(step.hint)}</small></span>
          <span class="step-count">${int(step.n)}<small>${i === 0 ? '' : esc(percent(rate(step.n, first)))}</small></span>
        </div>
        <div class="step-bar" role="img" aria-label="${esc(`${step.name}: ${int(step.n)}`)}">${step.n ? `<span style="width:${width.toFixed(2)}%"></span>` : ''}</div>
      </li>`;
  }).join('');
  return `<ol class="funnel">${items}</ol>`;
}

function funnelRates(pairs: [string, number, number][]): string {
  return `<div class="rates">${pairs.map(([label, part, whole]) => `
    <div class="rate"><span class="label">${esc(label)}</span><span class="value">${esc(percent(rate(part, whole)))}</span><span class="note">${int(part)} of ${int(whole)}</span></div>`).join('')}</div>`;
}

/** Each step per hour or day, for the hours or days with any activity. */
function funnelTable(buckets: Bucket[], perStep: Map<string, number>[], shorts: string[]): string {
  const rows = buckets
    .map(b => ({ b, values: perStep.map(map => map.get(b.key) ?? 0) }))
    .filter(row => row.values.some(Boolean));
  if (!rows.length) return '<p class="empty">No funnel events in this period.</p>';
  const head = shorts.map(short => `<th class="num">${esc(short)}</th>`).join('');
  const body = rows.map(({ b, values }) => `<tr><td class="when">${esc(b.tip)}</td>${values.map(v => `<td class="num">${v ? int(v) : '<span class="zero">0</span>'}</td>`).join('')}<td class="num">${esc(percent(rate(values.at(-1)!, values[0]!)))}</td></tr>`).join('');
  return `<div class="table-scroll"><table><thead><tr><th></th>${head}<th class="num">Views → paid</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

// ---------------------------------------------------------------- page

export function renderDashboard(period: Period, results: Results, now: Date): string {
  const errors = Object.entries(results).filter(([, value]) => !Array.isArray(value)) as [string, { error: string }][];
  const rows = (key: string): Row[] => (Array.isArray(results[key]) ? results[key] as Row[] : []);

  const counts = new Map(rows('events').map(row => [String(row.event), num(row.n)]));
  const count = (event: string) => counts.get(event) ?? 0;
  const details = (event: string, prefix = ''): Bar[] => rows('details')
    .filter(row => row.event === event)
    .map(row => ({ label: `${prefix}${String(row.detail)}`, n: num(row.n) }));
  const eventBars = (events: string[]): Bar[] => events.map(event => ({ label: event, n: count(event) }));

  // Poems: one row per combination of form choices; add up per column.
  const poems = rows('poems');
  const poemTotal = poems.reduce((sum, row) => sum + num(row.n), 0);
  const poemSum = (key: string) => poems.reduce((sum, row) => sum + num(row[key]), 0);
  const cost = poemSum('cost');
  const paidPoems = poems.filter(row => row.plan === 'paid').reduce((sum, row) => sum + num(row.n), 0);
  const rewrites = count('Regenerate poem');

  const money = rows('money');
  const moneyOf = (type: string) => money.filter(row => row.type === type);
  const revenue = moneyOf('payment.succeeded').reduce((sum, row) => sum + num(row.amount), 0);
  const refunds = moneyOf('refund.succeeded').reduce((sum, row) => sum + num(row.n), 0);

  const pageViews = count('Page view');

  // Time series in Dutch hours or Dutch days.
  const series = (events: string[]) => {
    const map = new Map<string, number>();
    for (const row of rows('timeline')) {
      if (!events.includes(String(row.event))) continue;
      const start = parseSqlTime(row.hour);
      const key = period.hourly ? sqlTime(start) : dutchDateKey(start);
      map.set(key, (map.get(key) ?? 0) + num(row.n));
    }
    return map;
  };
  const timeBuckets = buckets(period, now);

  const tiles: [string, string, string][] = [
    ['Page views', int(pageViews), 'Browser events; ad blockers can hide some'],
    ['Poems written', int(poemTotal), rewrites ? `${int(rewrites)} of them rewrites` : 'Counted by the server'],
    ['Paid poems', int(paidPoems), poemTotal ? `${share(paidPoems, poemTotal)} of all poems` : ''],
    ['Checkouts started', int(count('Proceed to payment')), `${int(count('Show payment modal'))} payment windows shown`],
    ['Payments verified', int(count('Payment verified')), refunds ? `${int(refunds)} refunds` : 'Checked with Dodo'],
    ['Revenue', eur(revenue), 'payment.succeeded webhooks'],
    ['AI cost', usd(cost), poemTotal ? `${usd(cost / poemTotal, 4)} per poem (estimate)` : 'Estimate'],
    ['Seconds to first text', poemTotal ? dec(poemSum('first_s') / poemTotal) : '–', poemTotal ? `${dec(poemSum('total_s') / poemTotal)} s for the whole poem` : ''],
  ];

  const funnelSteps: FunnelStep[] = FUNNEL.map(step => ({ name: step.name, hint: step.hint, n: count(step.event) }));
  const [views, formStarts, newPoems, payWindows, checkouts, paid] = funnelSteps.map(step => step.n) as [number, number, number, number, number, number];

  const abortedRows = rows('aborted');
  const aborted: Bar[] = abortedRows.map(row => ({
    label: `Poem aborted: ${String(row.detail) || 'unknown'}`,
    n: num(row.n),
    note: num(row.n) ? `after ${dec(num(row.seconds) / num(row.n))} s` : '',
  }));

  const valueBars = (event: string, label: (value: number) => string): Bar[] => rows('values')
    .filter(row => row.event === event)
    .map(row => ({ label: label(num(row.value)), n: num(row.n) }));

  const allEvents = [...SERVER_EVENTS, ...CLIENT_EVENTS];
  const eventTable = [...counts].sort((a, b) => b[1] - a[1]).map(([event, n]) => {
    const top = details(event).slice(0, 4).map(bar => `${bar.label} (${int(bar.n)})`).join(', ');
    return `<tr><td>${esc(event)}</td><td class="num">${int(n)}</td><td>${esc(top)}</td></tr>`;
  }).join('');
  const silent = allEvents.filter(event => !counts.has(event));

  const cards = [
    card('Pages', barList(rows('pages').map(row => ({ label: String(row.path), n: num(row.n) })), { total: pageViews })),
    card('Referrers', barList(details('Page view')), 'Referring domain of the first page view in a visit.'),
    card('Countries', barList(sumBy(rows('countries'), 'country'), { total: pageViews })),
    card('Site language', barList(sumBy(rows('locales'), 'locale'), { total: pageViews })),
    card('Campaigns', barList(rows('campaigns').map(row => ({ label: [row.source, row.medium, row.campaign].filter(Boolean).join(' / '), n: num(row.n) })))),
    card('Ways to the form', barList([
      ...details('Go to poem form', 'link: '),
      ...details('Scroll to poem form', 'scroll: '),
      { label: 'from a shared poem', n: count('Shared poem to form') },
    ])),
    card('Poem style', barList(sumBy(poems, 'style'), { total: poemTotal })),
    card('Poem language', barList(sumBy(poems, 'language'), { total: poemTotal })),
    card('Rhyme scheme', barList(sumBy(poems, 'rhyme'), { total: poemTotal })),
    card('Plan', barList(sumBy(poems, 'plan'), { total: poemTotal }), poemTotal ? `${dec(poemSum('lines') / poemTotal)} lines per poem on average.` : ''),
    card('Fun facts', barList(sumBy(poems, 'facts'), { total: poemTotal })),
    card('Present', barList(sumBy(poems, 'present'), { total: poemTotal })),
    card('Written by filled in', barList(sumBy(poems, 'written_by'), { total: poemTotal })),
    card('Audience filled in', barList(sumBy(poems, 'audience'), { total: poemTotal })),
    card('Payment window opened by', barList(details('Show payment modal'))),
    card('Payment window closed by', barList(details('Close payment modal'))),
    card('Payment results', barList([
      { label: 'Payment succeeded (browser)', n: count('Payment succeeded') },
      { label: 'Payment verified (server)', n: count('Payment verified') },
      ...details('Payment verified', 'verified via: '),
      ...details('Payment returned', 'returned: '),
      { label: 'Continue after payment', n: count('Continue after payment') },
      { label: 'Access restored', n: count('Access restored') },
      ...details('Restore failed', 'restore failed: '),
      ...details('Payments unavailable', 'payments unavailable: '),
    ], { total: 0 })),
    card('Payment webhooks', barList(money.map(row => ({ label: String(row.type), n: num(row.n), note: eur(num(row.amount)) })))),
    card('Sharing and saving', barList(eventBars(['Copy share link', 'Copy to clipboard', 'Save as PDF', 'Shared via WhatsApp', 'Shared via Email', 'Shared via Facebook', 'Open shared poem']))),
    card('Poems per device', barList(valueBars('Poem ready', value => `poem no. ${value}`)), 'From "Poem ready": how many poems the history held after this one.'),
    card('Other actions', barList([
      ...eventBars(['Open history', 'Open poem from history', 'Delete poem', 'Clear history', 'Play video', 'Scroll to FAQ', 'Contact']),
      ...details('Switch language', 'language: '),
      ...details('Show example', 'example: '),
    ])),
    card('Lootjes', barList(valueBars('Draw lootjes', value => `${value} people`)), 'Draws per group size.'),
    card('Problems', barList([
      ...details('Rate limited', 'rate limited: '),
      ...aborted,
      ...details('Poem generation failed', 'generation failed: '),
      ...details('Poem stream failed', 'stream failed: '),
      ...eventBars(['PDF failed', 'Copy failed']),
      ...details('Form refused', 'form refused: '),
    ], { total: 0, empty: 'No problems.' })),
  ].join('');

  const range = `${period.from.toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' })} – ${(period.to ?? now).toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' })}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>SintGPT analytics</title>
<style>
:root {
  color-scheme: light;
  --surface-0: #f4f3f0;
  --surface-1: #fcfcfb;
  --border: #e4e3de;
  --grid: #e4e3de;
  --axis: #b9b8b1;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #6b6a65;
  --series-1: #2a78d6;
  --track: #e8f0fb;
  --critical: #b42323;
  --focus: #0b0b0b;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --surface-0: #121211;
    --surface-1: #1a1a19;
    --border: #2e2e2b;
    --grid: #2e2e2b;
    --axis: #55554f;
    --text-primary: #f0efec;
    --text-secondary: #c3c2b7;
    --text-muted: #a3a29a;
    --series-1: #3987e5;
    --track: #1f2c3d;
    --critical: #f08080;
    --focus: #f0efec;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--surface-0);
  color: var(--text-primary);
  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
main { max-width: 1180px; margin: 0 auto; padding: 32px 16px 64px; }
header h1 { margin: 0; font-size: 1.75rem; line-height: 1.2; letter-spacing: -0.01em; }
header p { margin: 4px 0 0; color: var(--text-secondary); }
h2 { margin: 40px 0 12px; font-size: 1.125rem; line-height: 1.3; }
h3 { margin: 0 0 12px; font-size: 0.9375rem; line-height: 1.3; }
.errors { margin-top: 16px; padding: 12px 16px; border: 1px solid var(--critical); border-radius: 8px; color: var(--critical); }
.errors code { overflow-wrap: anywhere; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: 12px; margin-top: 24px; }
.tile, .card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px; padding: 16px; min-width: 0; }
.tile .label { color: var(--text-secondary); font-size: 0.875rem; }
.tile .value { display: block; margin-top: 4px; font-size: 1.75rem; font-weight: 600; line-height: 1.2; }
.tile .note { display: block; margin-top: 4px; color: var(--text-muted); font-size: 0.8125rem; }
.tile.hero .value { font-size: 3rem; }
.two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 12px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 12px; }
.total { margin: 0 0 8px; font-size: 1.5rem; font-weight: 600; }
.total small, .bars small { color: var(--text-muted); font-size: 0.8125rem; font-weight: 400; }
.plot { position: relative; padding-top: 18px; }
.ymax { position: absolute; top: 0; left: 0; color: var(--text-muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.cols {
  display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 2px; align-items: end;
  height: 160px; border-bottom: 1px solid var(--axis);
  background: linear-gradient(var(--grid), var(--grid)) top / 100% 1px no-repeat;
}
.col { height: 100%; display: flex; align-items: flex-end; outline-offset: 2px; }
.col:focus-visible { outline: 2px solid var(--focus); }
.bar { display: block; width: 100%; min-height: 2px; background: var(--series-1); border-radius: 4px 4px 0 0; }
@media (hover: hover) { .col:hover .bar { filter: brightness(1.15); } }
.xaxis { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 2px; margin-top: 4px; }
.xaxis span { color: var(--text-muted); font-size: 0.75rem; white-space: nowrap; overflow: visible; font-variant-numeric: tabular-nums; }
details { margin-top: 12px; }
summary { cursor: pointer; color: var(--text-secondary); font-size: 0.875rem; min-height: 24px; }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
td, th { text-align: start; padding: 6px 8px; border-bottom: 1px solid var(--border); vertical-align: top; overflow-wrap: anywhere; }
th { color: var(--text-secondary); font-weight: 600; }
td.num, td:nth-child(2) { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.bars li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; align-items: baseline; }
.bars .label { overflow-wrap: anywhere; }
.bars .value { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }
.bars .value small { margin-inline-start: 6px; }
.track { grid-column: 1 / -1; height: 6px; background: var(--track); border-radius: 0 4px 4px 0; }
.fill { display: block; height: 100%; min-width: 2px; background: var(--series-1); border-radius: 0 4px 4px 0; }
.wide { margin-top: 12px; }
.two { align-items: start; }
td.when { white-space: nowrap; overflow-wrap: normal; }
.funnel { list-style: none; margin: 0; padding: 0; }
.step-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.step-name { font-weight: 600; }
.step-name small, .step-count small { color: var(--text-muted); font-size: 0.75rem; font-weight: 400; }
.step-count { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.step-count small { margin-inline-start: 6px; font-size: 0.8125rem; }
.step-bar { display: flex; justify-content: center; height: 20px; margin-top: 4px; background: var(--track); border-radius: 4px; }
.step-bar span { display: block; height: 100%; min-width: 2px; background: var(--series-1); border-radius: 4px; }
.drop { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 6px 0 6px 10px; padding: 2px 0 2px 12px; border-inline-start: 2px solid var(--grid); color: var(--text-secondary); font-size: 0.875rem; }
.drop.worst { border-inline-start-color: var(--critical); color: var(--text-primary); }
.flag { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border: 1px solid var(--critical); border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
.flag svg { color: var(--critical); }
.rates { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr)); gap: 12px; }
.rate .label { display: block; color: var(--text-secondary); font-size: 0.8125rem; line-height: 1.3; }
.rate .value { display: block; margin-top: 2px; font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
.rate .note { display: block; color: var(--text-muted); font-size: 0.75rem; }
.table-scroll { overflow-x: auto; }
.table-scroll table { min-width: 460px; }
.num { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.zero { color: var(--text-muted); }
.empty, .note { margin: 0; color: var(--text-muted); font-size: 0.875rem; }
.note { margin-top: 12px; }
.silent { color: var(--text-muted); font-size: 0.875rem; }
footer { margin-top: 40px; color: var(--text-muted); font-size: 0.8125rem; }
footer p { margin: 4px 0; max-width: 75ch; }
#tip {
  position: fixed; z-index: 10; pointer-events: none; padding: 4px 8px; border-radius: 6px;
  background: var(--text-primary); color: var(--surface-1); font-size: 0.8125rem; white-space: nowrap;
}
</style>
</head>
<body>
<main>
<header>
  <h1>SintGPT analytics</h1>
  <p>${esc(period.title)} · ${esc(range)} (Dutch time)</p>
</header>
${errors.length ? `<div class="errors" role="alert"><strong>Some queries failed:</strong><ul>${errors.map(([key, value]) => `<li>${esc(key)}: <code>${esc(value.error)}</code></li>`).join('')}</ul></div>` : ''}

<div class="tiles">
${tiles.map(([label, value, note], i) => `<div class="tile${i === 1 ? ' hero' : ''}"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span>${note ? `<span class="note">${esc(note)}</span>` : ''}</div>`).join('\n')}
</div>

<h2>${period.hourly ? 'Per hour' : 'Per day'}</h2>
<div class="two">
  ${card('Page views', columns(timeBuckets, series(['Page view']), 'page views'))}
  ${card('Poems written', columns(timeBuckets, series(['Generate poem', 'Regenerate poem']), 'poems'))}
</div>

<h2>Funnel</h2>
<div class="two">
  ${card('From visit to payment', funnelChart(funnelSteps), 'The percentage beside a count is the share of page views. "browser" steps can be hidden by ad blockers; "server" steps are always counted. Page views are not people: one visitor can view several pages.')}
  ${card('Conversion', funnelRates([
      ['Form → poem', newPoems, formStarts],
      ['Poem → payment window', payWindows, newPoems],
      ['Payment window → checkout', checkouts, payWindows],
      ['Checkout → paid', paid, checkouts],
      ['Page views → paid', paid, views],
    ]), 'Each rate compares two steps that follow each other. A rate above 100% means the later step was counted more often, for example several poems from one form.')}
</div>
<div class="wide">
  ${card(period.hourly ? 'Funnel per hour' : 'Funnel per day', funnelTable(timeBuckets, FUNNEL.map(step => series([step.event])), FUNNEL.map(step => step.short)))}
</div>

<h2>Breakdowns</h2>
<div class="cards">${cards}</div>

<h2>All events</h2>
<section class="card">
  ${eventTable ? `<table><thead><tr><th>Event</th><th>Count</th><th>Top details</th></tr></thead><tbody>${eventTable}</tbody></table>` : '<p class="empty">No events in this period.</p>'}
  ${silent.length ? `<p class="silent">No data: ${esc(silent.join(', '))}.</p>` : ''}
</section>

<footer>
  <p>Built ${esc(now.toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }))} from Workers Analytics Engine (dataset ${DATASET}). Counts are weighted with the sample interval.</p>
  <p>There are no visitor IDs, so these are events, not people. Test visits (such as referrer "smoke-test") are included.</p>
</footer>
</main>
<div id="tip" role="tooltip" hidden></div>
<script>
const tip = document.getElementById('tip');
function show(target) {
  const el = target && target.closest ? target.closest('[data-tip]') : null;
  if (!el) { tip.hidden = true; return; }
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  const box = el.getBoundingClientRect();
  const width = tip.offsetWidth;
  const left = Math.min(Math.max(8, box.left + box.width / 2 - width / 2), window.innerWidth - width - 8);
  tip.style.left = left + 'px';
  tip.style.top = Math.max(8, box.top - tip.offsetHeight - 8) + 'px';
}
document.addEventListener('pointerover', event => show(event.target));
document.addEventListener('focusin', event => show(event.target));
document.addEventListener('focusout', () => { tip.hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') tip.hidden = true; });
window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const now = new Date();
  let period: Period;
  try {
    period = parsePeriod(args.find(arg => !arg.startsWith('--')) ?? 'today', now);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
  analyticsCredentials();

  const results = await fetchResults(dashboardQueries(period));
  const dir = resolve(import.meta.dirname, '..', 'reports');
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `analytics-${period.slug}.html`);
  writeFileSync(file, renderDashboard(period, results, now));

  const failed = Object.entries(results).filter(([, value]) => !Array.isArray(value));
  for (const [key, value] of failed) console.error(`Query "${key}" failed: ${(value as { error: string }).error}`);
  console.log(`Dashboard: ${file}`);
  if (!args.includes('--no-open') && process.platform === 'darwin') execFile('open', [file]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
