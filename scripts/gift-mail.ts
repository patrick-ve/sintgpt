// The gift mail to last season's buyers. Plan and steps: docs/buyer-gift-mail.md.
//
//   npx tsx scripts/gift-mail.ts list [export.csv] [--from 2025-09-01] [--to 2026-01-31]
//   npx tsx scripts/gift-mail.ts codes
//   npx tsx scripts/gift-mail.ts preview <dir>
//   npx tsx scripts/gift-mail.ts test <your address> [--text-only]
//   npx tsx scripts/gift-mail.ts send
//
// Everything with addresses or codes stays in .cache/gift-mail/ (git-ignored).
// The script prints counts and file names only: never an address or a code.
// Sending needs CLOUDFLARE_EMAIL_TOKEN (a token that may send with Cloudflare
// Email Service), from the environment or .env.mail.

import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  assignCodes,
  mergeRecipients,
  parseCsv,
  renderGiftMail,
  secretValue,
  selectBuyers,
  SENDER,
  type Recipient,
  type RecipientFile,
} from './giftMail';

const ROOT = resolve(import.meta.dirname, '..');
const DIR = join(ROOT, '.cache', 'gift-mail');
const RECIPIENTS = join(DIR, 'recipients.json');
const SECRET = join(DIR, 'secret.txt');
const ENV_FILE = join(ROOT, '.env.mail');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

/** The SintGPT Cloudflare account (as in scripts/analyticsSql.ts). Not a secret. */
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '8b2893f2640b94617462d93951ec6c4c';
const PAUSE_MS = 2000;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function option(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1]! : fallback;
}

function readFile(): RecipientFile {
  return existsSync(RECIPIENTS) ? JSON.parse(readFileSync(RECIPIENTS, 'utf8')) as RecipientFile : { recipients: [] };
}

function writeFile(file: RecipientFile): void {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(RECIPIENTS, `${JSON.stringify(file, null, 2)}\n`, { mode: 0o600 });
}

function list(args: string[]): void {
  const csv = resolve(args.find(arg => !arg.startsWith('--') && !/^\d{4}-/.test(arg)) ?? join(DIR, 'dodo-export.csv'));
  if (!existsSync(csv)) fail(`No export at ${csv}. Export last season's payments from Dodo as CSV to that file.`);
  const from = new Date(option(args, '--from', '2025-09-01'));
  const to = new Date(`${option(args, '--to', '2026-01-31')}T23:59:59Z`);
  const { emails, skipped } = selectBuyers(parseCsv(readFileSync(csv, 'utf8')), from, to);
  const before = readFile();
  const after = mergeRecipients(before, emails);
  writeFile(after);
  console.log(`Buyers found: ${emails.length}. New in the list: ${after.recipients.length - before.recipients.length}. List: ${after.recipients.length}.`);
  console.log(`Skipped rows: ${Object.entries(skipped).map(([reason, count]) => `${reason} ${count}`).join(', ')}.`);
  console.log(`Written to ${RECIPIENTS}`);
}

function codes(): void {
  const file = assignCodes(readFile(), () => randomBytes(16).toString('hex'));
  if (!file.recipients.length) fail('No recipients yet. Run `list` first.');
  writeFile(file);
  writeFileSync(SECRET, secretValue(file), { mode: 0o600 });
  console.log(`Codes: ${file.recipients.length} recipients plus 1 test code.`);
  console.log(`Secret value written to ${SECRET} (${readFileSync(SECRET, 'utf8').length} characters).`);
  console.log('Set it with: npx wrangler secret put NUXT_GIFT_CODES_SEASON --name sintgpt < .cache/gift-mail/secret.txt');
}

function preview(args: string[]): void {
  const dir = resolve(args[0] ?? fail('Give a directory for the preview.'));
  mkdirSync(dir, { recursive: true });
  const mail = renderGiftMail('voorbeeldcode0123456789abcdef01');
  writeFileSync(join(dir, 'gift-mail.html'), mail.html);
  writeFileSync(join(dir, 'gift-mail.txt'), `Onderwerp: ${mail.subject}\n\n${mail.text}\n`);
  console.log(`Preview written to ${join(dir, 'gift-mail.html')} and gift-mail.txt`);
}

type SendResult =
  | { ok: true; outcome: NonNullable<Recipient['outcome']> }
  | { ok: false; retry: boolean; status: number; error: string };

async function sendOne(to: string, code: string, textOnly = false): Promise<SendResult> {
  const token = process.env.CLOUDFLARE_EMAIL_TOKEN;
  if (!token) fail(`Set CLOUDFLARE_EMAIL_TOKEN in ${ENV_FILE}.`);
  const mail = renderGiftMail(code);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/email/sending/send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      to,
      from: SENDER,
      reply_to: SENDER.address,
      subject: mail.subject,
      text: mail.text,
      // --text-only: a spam-filter test without the HTML part.
      ...(textOnly ? {} : { html: mail.html }),
      headers: mail.headers,
    }),
  });
  const body = await res.json().catch(() => null) as {
    success?: boolean;
    errors?: { code?: number; message?: string }[];
    result?: { delivered?: string[]; queued?: string[]; permanent_bounces?: string[]; suppressed_recipients?: string[] };
  } | null;
  if (res.ok && body?.success) {
    const result = body.result ?? {};
    const outcome = result.delivered?.length ? 'delivered'
      : result.queued?.length ? 'queued'
        : result.suppressed_recipients?.length ? 'suppressed'
          : 'bounced';
    return { ok: true, outcome };
  }
  // The error has a code and a machine-readable message, never the address.
  const error = (body?.errors ?? []).map(item => `${item.code ?? '?'} ${item.message ?? ''}`.trim()).join('; ') || res.statusText;
  return { ok: false, retry: res.status === 429 || res.status >= 500, status: res.status, error };
}

async function sendWithRetry(to: string, code: string, textOnly = false): Promise<SendResult> {
  for (let attempt = 1; ; attempt++) {
    const result = await sendOne(to, code, textOnly);
    if (result.ok || !result.retry || attempt === 3) return result;
    console.log(`Got ${result.status} (${result.error}); waiting ${attempt * 30} s.`);
    await new Promise(done => setTimeout(done, attempt * 30_000));
  }
}

async function test(args: string[]): Promise<void> {
  const to = args.find(arg => !arg.startsWith('--')) ?? fail('Give your own address: npx tsx scripts/gift-mail.ts test <address>');
  const { testCode } = readFile();
  if (!testCode) fail('No test code yet. Run `codes` first, and set the secret.');
  const result = await sendWithRetry(to, testCode, args.includes('--text-only'));
  console.log(result.ok ? `Test mail: ${result.outcome}.` : `Test mail failed: ${result.status} ${result.error}`);
}

async function send(): Promise<void> {
  const file = readFile();
  const todo = file.recipients.filter(recipient => !recipient.sentAt);
  if (file.recipients.some(recipient => !recipient.code)) fail('Some recipients have no code. Run `codes` and set the secret again.');
  renderGiftMail('check0123456789abcdef'); // Fails early while the poem is missing.
  console.log(`To send: ${todo.length} of ${file.recipients.length}.`);
  const counts: Record<string, number> = {};
  for (const [index, recipient] of todo.entries()) {
    const result = await sendWithRetry(recipient.email, recipient.code!);
    if (!result.ok) {
      writeFile(file);
      fail(`Stopped at ${index + 1} of ${todo.length}: ${result.status} ${result.error}. Sent so far: ${JSON.stringify(counts)}. Run again to go on.`);
    }
    recipient.sentAt = new Date().toISOString();
    recipient.outcome = result.outcome;
    counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;
    writeFile(file);
    if (index < todo.length - 1) await new Promise(done => setTimeout(done, PAUSE_MS));
  }
  console.log(`Done: ${JSON.stringify(counts)}.`);
}

const [command, ...args] = process.argv.slice(2);
switch (command) {
  case 'list': list(args); break;
  case 'codes': codes(); break;
  case 'preview': preview(args); break;
  case 'test': await test(args); break;
  case 'send': await send(); break;
  default: fail('Use: list [export.csv] | codes | preview <dir> | test <address> | send');
}
