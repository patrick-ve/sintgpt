import { describe, expect, it } from 'vitest';
import {
  buildPrompt,
  DEFAULT_POEM_MODEL,
  estimateCostUsd,
  PoemRequestSchema,
} from '../../server/utils/poem';

const validRequest = {
  name: 'Sanne',
  style: 'funny',
  rhymeScheme: 'AABB',
  lines: 12,
  language: 'dutch',
} as const;

describe('PoemRequestSchema', () => {
  it('accepts a minimal valid request and defaults revealPresent', () => {
    const parsed = PoemRequestSchema.parse(validRequest);
    expect(parsed.revealPresent).toBe(true);
  });

  it.each([
    ['empty name', { name: '' }],
    ['unknown style', { style: 'rap' }],
    ['unknown rhyme scheme', { rhymeScheme: 'AAAA' }],
    ['too few lines', { lines: 7 }],
    ['too many lines', { lines: 51 }],
    ['fractional lines', { lines: 10.5 }],
    ['unknown language', { language: 'german' }],
  ])('rejects %s', (_label, override) => {
    const result = PoemRequestSchema.safeParse({ ...validRequest, ...override });
    expect(result.success).toBe(false);
  });
});

describe('buildPrompt', () => {
  it('includes the style, rhyme scheme, length and recipient', () => {
    const prompt = buildPrompt(PoemRequestSchema.parse(validRequest));
    expect(prompt).toContain('<recipient_name>Sanne</recipient_name>');
    expect(prompt).toContain('grappig, speels en luchtig');
    expect(prompt).toContain('AABB rijmschema');
    expect(prompt).toContain('precies 12 regels');
    expect(prompt).toContain('Schrijf het gedicht in het Nederlands.');
  });

  it('asks for English when requested', () => {
    const prompt = buildPrompt(
      PoemRequestSchema.parse({ ...validRequest, language: 'english' }),
    );
    expect(prompt).toContain('Schrijf het gedicht in het Engels.');
  });

  it('names a revealed present', () => {
    const prompt = buildPrompt(
      PoemRequestSchema.parse({ ...validRequest, present: 'sokken' }),
    );
    expect(prompt).toContain('<present>sokken</present>');
    expect(prompt).not.toContain('present_mystery');
  });

  it('hides a mystery present', () => {
    const prompt = buildPrompt(
      PoemRequestSchema.parse({
        ...validRequest,
        present: 'sokken',
        revealPresent: false,
      }),
    );
    expect(prompt).toContain('<present_mystery>sokken</present_mystery>');
    expect(prompt).toContain('mag NIET letterlijk in het gedicht');
  });

  it('adds writer and audience instructions only when given', () => {
    const plain = buildPrompt(PoemRequestSchema.parse(validRequest));
    expect(plain).not.toContain('SCHRIJFPERSPECTIEF');
    expect(plain).not.toContain('DOELGROEP');

    const full = buildPrompt(
      PoemRequestSchema.parse({
        ...validRequest,
        writtenBy: 'een 8-jarige',
        writtenForAudience: 'kantoorfeest',
      }),
    );
    expect(full).toContain('SCHRIJFPERSPECTIEF');
    expect(full).toContain('<written_for_audience>kantoorfeest</written_for_audience>');
  });
});

describe('model and cost', () => {
  it('uses Gemini 3.7 Flash through AI Gateway', () => {
    expect(DEFAULT_POEM_MODEL).toBe('google/gemini-3.7-flash');
  });

  it('estimates cost from input and output tokens', () => {
    // 1M input at $0.75 + 1M output at $3.75
    expect(estimateCostUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 })).toBe(4.5);
    expect(estimateCostUsd({})).toBe(0);
  });
});
