// Alerts to Telegram. Every 10 minutes a Cron Trigger (server/plugins/alerts.ts)
// asks Workers Analytics Engine for error and payment events in a closed
// window, and sends one message when it finds any. Analytics Engine holds no
// personal data, so neither does the message: event names, fixed details,
// tiers and counts.
//
// The Workers Free plan has no Tail Workers, so this reads the events that the
// app already writes instead of the Worker's own trace.

/** Something went wrong: on the server, in the browser, or at Dodo. */
export const ALERT_ERROR_EVENTS = [
  'Server error',
  'Client error',
  'Poem generation failed',
  'Surprise ideas failed',
  'Payments unavailable',
  'Poem stream failed',
  'PDF failed',
] as const;

/** Money and access, worth knowing as it happens. */
export const ALERT_MONEY_EVENTS = ['Payment webhook', 'Gift claimed'] as const;

/** A webhook that only says a payment is on its way; payment.succeeded follows. */
const QUIET_WEBHOOKS = ['payment.processing'];

/** Minutes per check; keep in line with ALERT_CRON. */
export const ALERT_WINDOW_MINUTES = 10;
export const ALERT_CRON = '*/10 * * * *';
/** Analytics Engine needs a moment to make a write queryable. */
export const ALERT_LAG_MINUTES = 5;

export const ALERT_ACCOUNT_ID = '8b2893f2640b94617462d93951ec6c4c';
const DATASET = 'sintgpt_events';

export interface AlertWindow {
  /** Unix seconds, inclusive. */
  from: number;
  /** Unix seconds, exclusive. */
  to: number;
}

/**
 * The window a check at `now` covers: the last full 10 minutes that ended at
 * least ALERT_LAG_MINUTES ago. Checks every 10 minutes cover every minute
 * once, also when a run starts a few seconds late.
 */
export function alertWindow(now: number, minutes = ALERT_WINDOW_MINUTES, lag = ALERT_LAG_MINUTES): AlertWindow {
  const step = minutes * 60;
  const to = Math.floor((now / 1000 - lag * 60) / step) * step;
  return { from: to - step, to };
}

const sqlList = (items: readonly string[]) => items.map(item => `'${item}'`).join(', ');

export function alertQuery({ from, to }: AlertWindow): string {
  return `SELECT blob1 AS event, blob9 AS detail, blob17 AS tier,
  SUM(_sample_interval) AS n, SUM(_sample_interval * double5) AS amount
FROM ${DATASET}
WHERE timestamp >= toDateTime(${Math.floor(from)}) AND timestamp < toDateTime(${Math.floor(to)})
  AND (blob1 IN (${sqlList(ALERT_ERROR_EVENTS)})
    OR (blob1 IN (${sqlList(ALERT_MONEY_EVENTS)}) AND blob9 NOT IN (${sqlList(QUIET_WEBHOOKS)})))
GROUP BY event, detail, tier
ORDER BY n DESC
FORMAT JSON`;
}

export interface AlertRow {
  event: string;
  detail: string;
  tier: string;
  n: number | string;
  amount: number | string;
}

const time = (seconds: number) =>
  new Date(seconds * 1000).toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });

const logsUrl = `https://dash.cloudflare.com/${ALERT_ACCOUNT_ID}/workers/services/view/sintgpt/production/observability/logs`;

/** The Telegram message for these rows, or null when there is nothing to say. */
export function alertMessage(rows: AlertRow[], window: AlertWindow): string | null {
  if (!rows.length) return null;
  const errors = rows.filter(row => (ALERT_ERROR_EVENTS as readonly string[]).includes(row.event));
  const money = rows.filter(row => !errors.includes(row));
  const line = (icon: string, row: AlertRow) => {
    const count = Number(row.n);
    const amount = Number(row.amount);
    return [
      icon,
      row.event,
      row.detail && `· ${row.detail}`,
      row.tier && `(${row.tier})`,
      amount > 0 && `€${(amount / Math.max(count, 1)).toFixed(2)}`,
      count > 1 && `×${count}`,
    ].filter(Boolean).join(' ');
  };
  const lines = [
    `SintGPT ${time(window.from)}–${time(window.to)}`,
    ...errors.map(row => line('❌', row)),
    ...money.map(row => line(/refund|dispute|failed|cancel/i.test(row.detail) ? '⚠️' : '💶', row)),
  ];
  if (errors.length) lines.push('', `Logs: ${logsUrl}`);
  return lines.join('\n');
}

export interface AlertConfig {
  analyticsToken?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

/** Reads the window from Analytics Engine and sends a message if needed. */
export async function checkAlerts(config: AlertConfig, now = Date.now(), fetcher: typeof fetch = fetch): Promise<string | null> {
  const { analyticsToken, telegramBotToken, telegramChatId } = config;
  if (!analyticsToken || !telegramBotToken || !telegramChatId) return null;

  const window = alertWindow(now);
  const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${ALERT_ACCOUNT_ID}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${analyticsToken}` },
    body: alertQuery(window),
  });
  if (!res.ok) throw new Error(`Analytics Engine query failed: ${res.status}`);
  const { data } = (await res.json()) as { data: AlertRow[] };

  const text = alertMessage(data, window);
  if (!text) return null;
  await sendTelegram({ telegramBotToken, telegramChatId }, text, fetcher);
  return text;
}

export async function sendTelegram(
  { telegramBotToken, telegramChatId }: Required<Pick<AlertConfig, 'telegramBotToken' | 'telegramChatId'>>,
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const res = await fetcher(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: telegramChatId, text, disable_web_page_preview: true }),
  });
  // Never the URL in the error: it holds the bot token.
  if (!res.ok) throw new Error(`Telegram refused the message: ${res.status}`);
}
