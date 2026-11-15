import { describe, expect, it, vi } from 'vitest';
import {
  ALERT_ERROR_EVENTS,
  ALERT_MONEY_EVENTS,
  alertMessage,
  alertQuery,
  alertWindow,
  checkAlerts,
} from '../../server/utils/alerts';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../../utils/analyticsEvents';
import { cleanDetail, errorDetail, routeDetail } from '../../utils/errorDetail';
import { DETAIL_PATTERN } from '../../utils/analyticsEvents';

const at = (iso: string) => Date.parse(iso);

describe('alert window', () => {
  it('covers the last full 10 minutes that ended at least 5 minutes ago', () => {
    const w = alertWindow(at('2026-11-15T10:20:03Z'));
    expect(new Date(w.from * 1000).toISOString()).toBe('2026-11-15T10:00:00.000Z');
    expect(new Date(w.to * 1000).toISOString()).toBe('2026-11-15T10:10:00.000Z');
  });

  it('leaves no gap and no overlap between runs every 10 minutes', () => {
    const runs = ['10:00:01', '10:10:04', '10:20:00', '10:30:59'].map(t => alertWindow(at(`2026-11-15T${t}Z`)));
    for (let i = 1; i < runs.length; i++) expect(runs[i]!.from).toBe(runs[i - 1]!.to);
  });
});

describe('alert query', () => {
  it('asks only for known events in the window', () => {
    const sql = alertQuery({ from: 100, to: 700 });
    expect(sql).toContain('toDateTime(100)');
    expect(sql).toContain('toDateTime(700)');
    for (const name of [...ALERT_ERROR_EVENTS, ...ALERT_MONEY_EVENTS]) {
      expect([...SERVER_EVENTS, ...CLIENT_EVENTS] as string[]).toContain(name);
      expect(sql).toContain(`'${name}'`);
    }
    expect(sql).toContain("'payment.processing'");
  });
});

describe('alert message', () => {
  const window = { from: at('2026-11-14T21:20:00Z') / 1000, to: at('2026-11-14T21:30:00Z') / 1000 };

  it('says nothing when nothing happened', () => {
    expect(alertMessage([], window)).toBeNull();
  });

  it('lists errors first, with counts and a link to the logs', () => {
    const text = alertMessage([
      { event: 'Payment webhook', detail: 'payment.succeeded', tier: '', n: '1', amount: 6.99 },
      { event: 'PDF failed', detail: 'pakjesavond', tier: 'familie', n: '3', amount: 0 },
    ], window)!;
    expect(text.split('\n')).toEqual([
      'SintGPT 22:20–22:30',
      '❌ PDF failed · pakjesavond (familie) ×3',
      '💶 Payment webhook · payment.succeeded €6.99',
      '',
      expect.stringMatching(/^Logs: https:\/\/dash\.cloudflare\.com\/.+\/observability\/logs$/),
    ]);
  });

  it('marks refunds and disputes as a warning and adds no log link for money alone', () => {
    const text = alertMessage([{ event: 'Payment webhook', detail: 'refund.succeeded', tier: '', n: 1, amount: 6.99 }], window)!;
    expect(text).toContain('⚠️ Payment webhook · refund.succeeded');
    expect(text).not.toContain('Logs:');
  });
});

describe('alert check', () => {
  it('does nothing without its secrets', async () => {
    const fetcher = vi.fn();
    expect(await checkAlerts({ analyticsToken: 'x' }, Date.now(), fetcher as never)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('queries Analytics Engine and sends one Telegram message', async () => {
    const fetcher = vi.fn(async (url: string) => new Response(
      url.includes('analytics_engine')
        ? JSON.stringify({ data: [{ event: 'Server error', detail: '500 /api/poem/generate', tier: '', n: '2', amount: 0 }] })
        : '{"ok":true}',
    ));
    const text = await checkAlerts(
      { analyticsToken: 'cf', telegramBotToken: 'bot', telegramChatId: '42' },
      at('2026-11-15T10:20:00Z'),
      fetcher as never,
    );
    expect(text).toContain('❌ Server error · 500 /api/poem/generate ×2');
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [url, init] = fetcher.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.telegram.org/botbot/sendMessage');
    expect(JSON.parse(init.body as string)).toMatchObject({ chat_id: '42', text });
  });

  it('never puts the bot token in an error', async () => {
    const fetcher = vi.fn(async (url: string) => url.includes('analytics_engine')
      ? new Response(JSON.stringify({ data: [{ event: 'PDF failed', detail: '', tier: '', n: 1, amount: 0 }] }))
      : new Response('no', { status: 401 }));
    await expect(checkAlerts({ analyticsToken: 'cf', telegramBotToken: 'secret-token', telegramChatId: '1' }, Date.now(), fetcher as never))
      .rejects.toThrow(/^Telegram refused the message: 401$/);
  });
});

describe('error detail', () => {
  it('keeps the error type and message, without quoted text', () => {
    const error = new SyntaxError('Unexpected token \'H\', "Hoi Daan, j"... is not valid JSON');
    expect(errorDetail(error)).toBe('SyntaxError: Unexpected token ... is not valid JSON');
  });

  it('shortens links and always fits the detail pattern', () => {
    const detail = errorDetail(new TypeError('Failed to fetch dynamically imported module: https://sintgpt.com/_nuxt/CWclMHw6.js (x) <y> {z}'));
    expect(detail.startsWith('TypeError: Failed to fetch dynamically imported module: url')).toBe(true);
    expect(detail.length).toBeLessThanOrEqual(60);
    expect(DETAIL_PATTERN.test(detail)).toBe(true);
    expect(DETAIL_PATTERN.test(cleanDetail('a\u0000b<script>"x"</script>'))).toBe(true);
  });

  it('describes values that are not errors', () => {
    expect(errorDetail('boom')).toBe('string: boom');
    expect(errorDetail(undefined)).toBe('undefined');
  });

  it('removes poem and payment IDs from routes', () => {
    expect(routeDetail('/g/N7Jkc_6K9d?x=1')).toBe('/g/:id');
    expect(routeDetail('/api/share/links/N7Jkc_6K9d')).toBe('/api/share/links/:id');
    expect(routeDetail('/api/poem/generate')).toBe('/api/poem/generate');
  });
});
