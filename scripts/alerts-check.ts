// Runs the alert check of the Cron Trigger locally (server/utils/alerts.ts).
//
//   npx tsx scripts/alerts-check.ts [minutes-ago] [--send]
//
// Without --send it prints the message for the 10-minute window that ended
// <minutes-ago> minutes ago (default: the window the next cron run checks).
// With --send it also sends it to Telegram, or a test message when the window
// is empty. Reads CLOUDFLARE_ANALYTICS_TOKEN, TELEGRAM_BOT_TOKEN and
// TELEGRAM_CHAT_ID from the environment or .env.analytics.
import { analyticsCredentials, analyticsQuery } from './analyticsSql';
import { alertMessage, alertQuery, alertWindow, sendTelegram, type AlertRow } from '../server/utils/alerts';

const args = process.argv.slice(2);
const send = args.includes('--send');
const minutesAgo = Number(args.find(arg => !arg.startsWith('--')) ?? 0);

analyticsCredentials();
const window = alertWindow(Date.now() - minutesAgo * 60_000);
const rows = await analyticsQuery(alertQuery(window).replace(/\s*FORMAT JSON$/, '')) as unknown as AlertRow[];
const text = alertMessage(rows, window);
console.log(text ?? `Nothing to report for ${new Date(window.from * 1000).toISOString()} .. ${new Date(window.to * 1000).toISOString()}.`);

if (send) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  if (!telegramBotToken || !telegramChatId) {
    console.error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, for example in .env.analytics.');
    process.exit(1);
  }
  await sendTelegram({ telegramBotToken, telegramChatId }, text ?? 'SintGPT: test message. Alerts reach this chat.');
  console.log('Sent.');
}
