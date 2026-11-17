// The gift mail to last season's buyers (docs/buyer-gift-mail.md): reading the
// Dodo export, choosing the recipients and writing the mail. No network and no
// files here; scripts/gift-mail.ts does that.

/** The thank-you poem, written on the live site and shared as a short link. */
export const THANK_YOU_POEM = {
  /** The poem as SintGPT wrote it on 17 Nov 2026, with the greeting and the signature. */
  text: [
    "Lieve dichters van vorig jaar,",
    "",
    "Eerst leken jullie echt een groot talent,",
    "Als meesterdichters plotseling bekend.",
    "Maar eerlijk zeggen hoor, de Sint weet wel,",
    "Het was een handig digitaal model.",
    "",
    "De Rijmpiet was er stiekem reuzeblij,",
    "Want dankzij jullie had hij even vrij.",
    "Geen uren meer getob met pen en inkt,",
    "Terwijl de tijd voor Pakjesavond slinkt.",
    "",
    "Dus dit jaar weer geen boeken op de schoot,",
    "De hulp van buitenaf is immers groot.",
    "De pennen blijven rustig in de la,",
    "Je typt wat in en roept al snel: voilà!",
    "",
    "SintGPT is gratis dit seizoen,",
    "Tot Pakjesavond hoef je niets te doen.",
    "Deel het gedicht maar uit met groot gebaar,",
    "Als meesterdichters van het vorig jaar!",
    "",
    "Van Sint & Piet",
  ].join('\n'),
  /** https://sintgpt.com/g/<id> */
  link: 'https://sintgpt.com/g/AqQuyZ15Tx',
};

export const SENDER = { address: 'patrick@sintgpt.com', name: 'Patrick van SintGPT' };
export const SUBJECT = 'Een cadeautje van de Sint: dit jaar SintGPT gratis';
export const CAMPAIGN = 'kopers-2025';

/** One row per recipient in .cache/gift-mail/recipients.json. */
export interface Recipient {
  email: string;
  code?: string;
  sentAt?: string;
  outcome?: 'delivered' | 'queued' | 'bounced' | 'suppressed';
}

export interface RecipientFile {
  /** A code for the owner's test mail, also in the secret. */
  testCode?: string;
  recipients: Recipient[];
}

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks in quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^﻿/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some(cell => cell !== '')) rows.push(row);
  return rows;
}

const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i;

export interface ExportColumns {
  email: number;
  status: number;
  date: number;
  /** Optional: a refund or dispute column; a row with a value there is skipped. */
  refund: number[];
}

/** Finds the columns by their names, whatever order Dodo uses. Throws with the headers it saw. */
export function exportColumns(headers: string[]): ExportColumns {
  const find = (pattern: RegExp, prefer?: RegExp) => {
    const matches = headers.map((header, index) => ({ header, index })).filter(({ header }) => pattern.test(header));
    return (prefer && matches.find(({ header }) => prefer.test(header)))?.index ?? matches[0]?.index ?? -1;
  };
  const columns = {
    email: find(/e-?mail/i, /customer/i),
    status: find(/status/i, /^status$/i),
    date: find(/created|date/i, /created/i),
    refund: headers.flatMap((header, index) => (/refund|dispute|chargeback/i.test(header) && !/status/i.test(header) ? [index] : [])),
  };
  if (columns.email < 0 || columns.status < 0 || columns.date < 0) {
    throw new Error(`Columns not found. Headers: ${headers.join(' | ')}`);
  }
  return columns;
}

const PAID = /^(succeeded|success|successful|paid|completed)$/i;

/** True when a refund or dispute cell holds anything other than empty or zero. */
function hasValue(cell: string | undefined): boolean {
  const value = (cell ?? '').trim().toLowerCase();
  return value !== '' && !['0', '0.00', 'false', 'no', 'none', 'null', '-'].includes(value);
}

/**
 * One address per buyer: paid between `from` and `to`, not refunded or
 * disputed. Addresses are lower case. Also says how many rows it skipped.
 */
export function selectBuyers(rows: string[][], from: Date, to: Date): { emails: string[]; skipped: Record<string, number> } {
  const [headers = [], ...data] = rows;
  const columns = exportColumns(headers);
  const skipped = { notPaid: 0, outsideSeason: 0, refunded: 0, badAddress: 0, duplicate: 0 };
  const emails = new Set<string>();
  for (const row of data) {
    if (!PAID.test((row[columns.status] ?? '').trim())) { skipped.notPaid++; continue; }
    const date = new Date((row[columns.date] ?? '').trim());
    if (Number.isNaN(date.getTime()) || date < from || date > to) { skipped.outsideSeason++; continue; }
    if (columns.refund.some(index => hasValue(row[index]))) { skipped.refunded++; continue; }
    const email = (row[columns.email] ?? '').trim().toLowerCase();
    if (!EMAIL.test(email)) { skipped.badAddress++; continue; }
    if (emails.has(email)) { skipped.duplicate++; continue; }
    emails.add(email);
  }
  return { emails: [...emails], skipped };
}

/** Adds new recipients, keeps the ones already there (with their codes and send state). */
export function mergeRecipients(file: RecipientFile, emails: string[]): RecipientFile {
  const known = new Set(file.recipients.map(recipient => recipient.email));
  return { ...file, recipients: [...file.recipients, ...emails.filter(email => !known.has(email)).map(email => ({ email }))] };
}

/** Gives every recipient without a code a new one, and the file a test code. */
export function assignCodes(file: RecipientFile, newCode: () => string): RecipientFile {
  return {
    testCode: file.testCode ?? newCode(),
    recipients: file.recipients.map(recipient => (recipient.code ? recipient : { ...recipient, code: newCode() })),
  };
}

/** The value for NUXT_GIFT_CODES_SEASON: every code, comma-separated. */
export function secretValue(file: RecipientFile): string {
  return [file.testCode, ...file.recipients.map(recipient => recipient.code)].filter(Boolean).join(',');
}

export function giftUrl(code: string): string {
  const params = new URLSearchParams({ cadeau: code, utm_source: 'email', utm_medium: 'email', utm_campaign: CAMPAIGN });
  return `https://sintgpt.com/?${params}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const FEATURES = [
  'zoveel gedichten als je wilt (tot 100 per dag), in alle stijlen',
  'een gedicht herschrijven met jouw wensen',
  '6 PDF-ontwerpen om je gedicht te printen',
  'surprise-ideeën bij elk gedicht',
];

export interface GiftMail {
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
}

/** The mail for one gift code. Throws while the thank-you poem is missing. */
export function renderGiftMail(code: string, poem = THANK_YOU_POEM): GiftMail {
  if (!poem.text.trim() || !/^https:\/\/sintgpt\.com\/g\/[A-Za-z0-9]+$/.test(poem.link)) {
    throw new Error('THANK_YOU_POEM in scripts/giftMail.ts is not filled in yet.');
  }
  const url = giftUrl(code);
  const stanzas = poem.text.trim().split(/\n\s*\n/);

  const text = [
    'Hoi,',
    '',
    'Vorig jaar schreef je je sinterklaasgedichten met SintGPT. Dank je wel daarvoor. De Sint schreef er zelf een gedicht over:',
    '',
    poem.text.trim(),
    '',
    `Op een mooi perkament: ${poem.link}`,
    '',
    'En daarom krijg je dit jaar Hele familie van ons cadeau, tot en met pakjesavond 5 december:',
    '',
    ...FEATURES.map(feature => `- ${feature}`),
    '',
    'Open deze link om het te gebruiken. Hij werkt in 3 browsers, bijvoorbeeld op je telefoon en je laptop:',
    url,
    '',
    'Je betaalt niets en er loopt niets door.',
    '',
    'Hartelijke groet,',
    'Patrick van SintGPT',
    '',
    '--',
    'Je krijgt deze mail eenmalig, omdat je vorig jaar SintGPT kocht. Wil je geen mail meer van ons? Antwoord met "afmelden".',
  ].join('\n');

  const paragraph = (inner: string) => `<p style="margin:0 0 16px">${inner}</p>`;
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(SUBJECT)}</title></head>
<body style="margin:0;padding:0;background:#f6efe2">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#2b1d14">
${paragraph('Hoi,')}
${paragraph('Vorig jaar schreef je je sinterklaasgedichten met SintGPT. Dank je wel daarvoor. De Sint schreef er zelf een gedicht over:')}
<div style="background:#fffaf0;border:1px solid #e3cfa8;border-radius:8px;padding:20px 22px;margin:0 0 12px;font-style:italic">
${stanzas.map(stanza => `<p style="margin:0 0 14px">${stanza.split('\n').map(line => escapeHtml(line.trim())).join('<br>')}</p>`).join('\n')}
</div>
${paragraph(`<a href="${escapeHtml(poem.link)}" style="color:#9b1c1c">Bekijk het gedicht op perkament</a>`)}
${paragraph('En daarom krijg je dit jaar <strong>Hele familie</strong> van ons cadeau, tot en met pakjesavond 5 december:')}
<ul style="margin:0 0 16px;padding-left:22px">
${FEATURES.map(feature => `<li>${escapeHtml(feature)}</li>`).join('\n')}
</ul>
<p style="margin:0 0 8px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#9b1c1c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold">Open mijn cadeau</a></p>
<p style="margin:0 0 16px;font-size:14px;color:#6b5a4a">De link werkt in 3 browsers, bijvoorbeeld op je telefoon en je laptop.</p>
${paragraph('Je betaalt niets en er loopt niets door.')}
${paragraph('Hartelijke groet,<br>Patrick van SintGPT')}
<p style="margin:24px 0 0;font-size:13px;color:#6b5a4a">Je krijgt deze mail eenmalig, omdat je vorig jaar SintGPT kocht. Wil je geen mail meer van ons? Antwoord met &quot;afmelden&quot;.</p>
</div>
</body></html>`;

  return {
    subject: SUBJECT,
    text,
    html,
    headers: { 'List-Unsubscribe': `<mailto:${SENDER.address}?subject=afmelden>` },
  };
}
