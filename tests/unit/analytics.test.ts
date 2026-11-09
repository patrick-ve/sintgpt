import type { H3Event } from 'h3';
import { describe, expect, it, vi } from 'vitest';
import { analyticsPath } from '../../composables/useAnalytics';
import {
  analyticsDataPoint,
  ClientEventSchema,
  formFacts,
  trackServerEvent,
} from '../../server/utils/analytics';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../../utils/analyticsEvents';

function cloudflareEvent(env: Record<string, unknown>, headers: Record<string, string> = {}) {
  return { context: { cloudflare: { env } }, headers: new Headers(headers) } as unknown as H3Event;
}

describe('analyticsDataPoint', () => {
  it('puts every field in its fixed column', () => {
    expect(analyticsDataPoint('Generate poem', {
      path: '/',
      locale: 'nl',
      country: 'NL',
      style: 'roast',
      rhymeScheme: 'AABB',
      language: 'dutch',
      plan: 'paid',
      detail: 'google/gemini-3.7-flash',
      lines: 12,
      inputTokens: 900,
      outputTokens: 400,
      costUsd: 0.0021,
      value: 3,
      source: 'newsletter',
      medium: 'email',
      campaign: 'pakjesavond',
      facts: 'long',
      present: 'secret',
      writtenBy: 'yes',
      audience: 'no',
      firstTextSeconds: 2.4,
      totalSeconds: 18.1,
    })).toEqual({
      indexes: ['Generate poem'],
      blobs: [
        'Generate poem', '/', 'nl', 'NL', 'roast', 'AABB', 'dutch', 'paid', 'google/gemini-3.7-flash',
        'newsletter', 'email', 'pakjesavond', 'long', 'secret', 'yes', 'no',
      ],
      doubles: [12, 900, 400, 0.0021, 3, 2.4, 18.1],
    });
  });

  it('fills empty columns, so later columns never shift', () => {
    const point = analyticsDataPoint('Save as PDF', { detail: 'x' });
    expect(point.blobs).toHaveLength(16);
    expect(point.blobs[8]).toBe('x');
    expect(point.doubles).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('keeps blobs short and numbers finite', () => {
    const point = analyticsDataPoint('Page view', { path: `/${'a'.repeat(500)}`, value: Number.NaN });
    expect(point.blobs[1]).toHaveLength(200);
    expect(point.doubles[4]).toBe(0);
  });
});

describe('trackServerEvent', () => {
  it('writes the event with the visitor country, never the IP', () => {
    const writeDataPoint = vi.fn();
    const event = cloudflareEvent(
      { ANALYTICS: { writeDataPoint } },
      { 'cf-ipcountry': 'BE', 'cf-connecting-ip': '203.0.113.9' },
    );
    trackServerEvent(event, 'Rate limited', { detail: 'limit', plan: 'free' });
    expect(writeDataPoint).toHaveBeenCalledOnce();
    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs[0]).toBe('Rate limited');
    expect(point.blobs[3]).toBe('BE');
    expect(JSON.stringify(point)).not.toContain('203.0.113.9');
  });

  it('does nothing without the binding, and never throws', () => {
    expect(() => trackServerEvent(cloudflareEvent({}), 'Proceed to payment')).not.toThrow();
    const broken = cloudflareEvent({ ANALYTICS: { writeDataPoint: () => { throw new Error('down'); } } });
    expect(() => trackServerEvent(broken, 'Proceed to payment')).not.toThrow();
  });

  it('ignores a country header that is not a country code', () => {
    const writeDataPoint = vi.fn();
    trackServerEvent(cloudflareEvent({ ANALYTICS: { writeDataPoint } }, { 'cf-ipcountry': '<script>' }), 'Proceed to payment');
    expect(writeDataPoint.mock.calls[0]![0].blobs[3]).toBe('');
  });
});

describe('formFacts', () => {
  it('says how much of the form was used, never what was typed', () => {
    expect(formFacts({})).toEqual({ facts: 'empty', present: 'none', writtenBy: 'no', audience: 'no' });
    const used = formFacts({
      funFacts: 'Houdt van paarden. '.repeat(10),
      present: 'sokken',
      revealPresent: false,
      writtenBy: 'zijn zus',
      writtenForAudience: '  ',
    });
    expect(used).toEqual({ facts: 'long', present: 'secret', writtenBy: 'yes', audience: 'no' });
    expect(JSON.stringify(used)).not.toMatch(/paarden|sokken|zus/);
    expect(formFacts({ funFacts: 'Houdt van paarden', present: 'sokken' })).toMatchObject({ facts: 'short', present: 'named' });
  });
});

describe('ClientEventSchema', () => {
  it('accepts campaign tags and refuses tags with free text', () => {
    expect(ClientEventSchema.safeParse({ name: 'Page view', source: 'newsletter', medium: 'email', campaign: 'sint-2026' }).success).toBe(true);
    expect(ClientEventSchema.safeParse({ name: 'Page view', source: 'Mail van Sanne' }).success).toBe(false);
  });

  it('accepts a known event with short values', () => {
    expect(ClientEventSchema.safeParse({ name: 'Draw lootjes', path: '/lootjes', locale: 'nl', value: 6 }).success).toBe(true);
    expect(ClientEventSchema.safeParse({ name: 'Page view', path: '/', detail: 'www.google.com' }).success).toBe(true);
  });

  it.each([
    ['an unknown name', { name: 'Buy now' }],
    ['a server-only event', { name: 'Generate poem' }],
    ['free text in detail', { name: 'Show example', detail: '<b>Sanne</b>' }],
    ['a long detail', { name: 'Show example', detail: 'a'.repeat(61) }],
    ['a query in the path', { name: 'Page view', path: '/?payment_id=pay_123' }],
    ['a negative value', { name: 'Draw lootjes', value: -1 }],
    ['another language', { name: 'Page view', locale: 'de' }],
  ])('refuses %s', (_label, body) => {
    expect(ClientEventSchema.safeParse(body).success).toBe(false);
  });

  it('keeps server and browser event names apart', () => {
    const overlap = SERVER_EVENTS.filter(name => (CLIENT_EVENTS as readonly string[]).includes(name));
    expect(overlap).toEqual([]);
  });
});

describe('analyticsPath', () => {
  it('never keeps the ID of a short poem link', () => {
    expect(analyticsPath('/g/Ab3dE5gH7j')).toBe('/g/:id');
    expect(analyticsPath('/lootjes')).toBe('/lootjes');
  });
});
