import { describe, expect, it } from 'vitest';
import {
  assignCodes,
  exportColumns,
  giftUrl,
  mergeRecipients,
  parseCsv,
  renderGiftMail,
  secretValue,
  selectBuyers,
} from '../../scripts/giftMail';

const FROM = new Date('2025-09-01');
const TO = new Date('2026-01-31T23:59:59Z');
const POEM = { text: 'Lieve koper,\n\nDe Sint zegt dank, met rijm en al,\nvoor elk gedicht en elk geval.\n\nVan Sint & Piet', link: 'https://sintgpt.com/g/Ab12Cd34Ef' };

describe('gift mail: Dodo export', () => {
  it('reads quoted CSV fields, a BOM and CRLF', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\r\n')).toEqual([['a', 'b'], ['x, y', 'he said "hi"']]);
  });

  it('finds the columns by name, and names the headers when one is missing', () => {
    expect(exportColumns(['Payment ID', 'Status', 'Customer Email', 'Created At', 'Refund Status', 'Refunded Amount'])).toMatchObject({ email: 2, status: 1, date: 3, refund: [5] });
    expect(() => exportColumns(['Payment ID', 'Amount'])).toThrow('Headers: Payment ID | Amount');
  });

  it('keeps paid buyers of the season once, without refunds', () => {
    const rows = parseCsv([
      'Status,Customer Email,Created At,Refunded Amount',
      'succeeded,Anna@Example.nl,2025-12-01T10:00:00Z,0',
      'succeeded,anna@example.nl,2025-12-03T10:00:00Z,',
      'failed,bert@example.nl,2025-12-01T10:00:00Z,',
      'succeeded,carla@example.nl,2025-12-02T10:00:00Z,6.99',
      'succeeded,dirk@example.nl,2026-11-12T10:00:00Z,',
      'succeeded,not-an-address,2025-12-02T10:00:00Z,',
    ].join('\n'));
    expect(selectBuyers(rows, FROM, TO)).toEqual({
      emails: ['anna@example.nl'],
      skipped: { notPaid: 1, outsideSeason: 1, refunded: 1, badAddress: 1, duplicate: 1 },
    });
  });
});

describe('gift mail: codes', () => {
  let next = 0;
  const newCode = () => `code-${++next}-0123456789abcdef`;

  it('adds recipients once and keeps their codes and send state', () => {
    const file = assignCodes({ recipients: [] }, newCode);
    const first = assignCodes(mergeRecipients(file, ['a@example.nl']), newCode);
    first.recipients[0]!.sentAt = '2026-11-20T10:00:00Z';
    const again = assignCodes(mergeRecipients(first, ['a@example.nl', 'b@example.nl']), newCode);
    expect(again.recipients).toHaveLength(2);
    expect(again.recipients[0]).toEqual(first.recipients[0]);
    expect(again.testCode).toBe(file.testCode);
    expect(secretValue(again).split(',')).toEqual([again.testCode, again.recipients[0]!.code, again.recipients[1]!.code]);
  });
});

describe('gift mail: the mail', () => {
  it('refuses to render without the thank-you poem', () => {
    expect(() => renderGiftMail('code0123456789abcdef', { text: '', link: '' })).toThrow('THANK_YOU_POEM');
  });

  it('holds the poem, the gift link, the end date and an opt-out', () => {
    const mail = renderGiftMail('code0123456789abcdef', POEM);
    const url = giftUrl('code0123456789abcdef');
    expect(url).toBe('https://sintgpt.com/?cadeau=code0123456789abcdef&utm_source=email&utm_medium=email&utm_campaign=kopers-2025');
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain('voor elk gedicht en elk geval.');
      expect(body).toContain(POEM.link);
      expect(body).toContain('5 december');
      expect(body).toContain('afmelden');
    }
    expect(mail.text).toContain(url);
    expect(mail.html).toContain(url.replace(/&/g, '&amp;'));
    expect(mail.headers['List-Unsubscribe']).toBe('<mailto:patrick@sintgpt.com?subject=afmelden>');
  });

  it('escapes the poem in the HTML', () => {
    const mail = renderGiftMail('code0123456789abcdef', { ...POEM, text: 'Sint <3 & Piet' });
    expect(mail.html).toContain('Sint &lt;3 &amp; Piet');
  });
});
