import { describe, expect, it } from 'vitest';
import {
  decodePoem,
  decodeText,
  encodePoem,
  encodeText,
  extractOpening,
  poemDigest,
} from '../../utils/poemLink';
import { parseStreamLine } from '../../utils/poemStream';
import { shareImageCacheUrl, signPoemShare, verifyPoemShare } from '../../server/utils/poemShare';
import { canonicalRedirect } from '../../server/utils/canonicalHost';
import {
  buildShareSvg,
  escapeXml,
  layoutOpening,
  stripEmoji,
} from '../../server/utils/shareImageSvg';
import { PoemRequestSchema } from '../../server/utils/poem';

const SECRET = 'test-secret';
const POEM = 'Sint zag oma Truus, zo lief en zo fijn,\nzij bakt elke zondag, heel klein.\n\nHaar taart is een feest,\nvoor mens en voor beest.';

describe('extractOpening', () => {
  it('takes the first two lines and skips empty ones', () => {
    expect(extractOpening('\n  Regel een \n\nRegel twee\nRegel drie')).toBe('Regel een\nRegel twee');
  });

  it('caps the length', () => {
    expect(extractOpening('x'.repeat(500)).length).toBe(180);
  });
});

describe('poem in the link', () => {
  it('survives the round trip, including Dutch characters and emoji', async () => {
    const poem = `${POEM}\nCafé, coördinatie, reünie 🎁`;
    expect(await decodePoem(await encodePoem(poem))).toBe(poem);
  });

  it('keeps a 50-line poem short enough for a link', async () => {
    const line = 'De Sint brengt pakjes aan de deur vanavond,\n';
    expect((await encodePoem(line.repeat(50))).length).toBeLessThan(2000);
  });

  it.each(['', 'd', 'x123', 'dnot-valid!!', 'p%%%'])('returns null for the invalid value %j', async (value) => {
    expect(await decodePoem(value)).toBeNull();
  });

  it('refuses a decompression bomb', async () => {
    const bomb = await encodePoem('a'.repeat(5_000_000)).catch(() => null);
    if (bomb) expect(await decodePoem(bomb)).toBeNull();
  });

  it('encodes text as URL-safe', () => {
    const encoded = encodeText('wél? rijmt! ~>>>');
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeText(encoded)).toBe('wél? rijmt! ~>>>');
  });
});

describe('signed share data', () => {
  it('verifies data it signed and returns the opening', async () => {
    const share = await signPoemShare(POEM, 'nl', SECRET);
    expect(await verifyPoemShare({ ...share }, SECRET)).toEqual({
      opening: extractOpening(POEM),
      language: 'nl',
      digest: await poemDigest(POEM),
    });
  });

  it.each([
    ['another opening', { s: encodeText('Lelijke tekst') }],
    ['another language', { l: 'en' }],
    ['another digest', { d: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    ['a broken signature', { sig: 'AAAA' }],
    ['no signature', { sig: undefined }],
    ['an invalid language', { l: 'de' }],
    ['illegal characters', { s: '<script>' }],
    ['an oversized opening', { s: 'a'.repeat(401) }],
  ])('rejects %s', async (_name, change) => {
    const share = await signPoemShare(POEM, 'nl', SECRET);
    expect(await verifyPoemShare({ ...share, ...change }, SECRET)).toBeNull();
  });

  it('rejects data signed with another secret, or without any secret', async () => {
    const share = await signPoemShare(POEM, 'nl', 'other');
    expect(await verifyPoemShare({ ...share }, SECRET)).toBeNull();
    expect(await verifyPoemShare({ ...share }, '')).toBeNull();
  });

  it('gets the same digest for the trimmed poem on both sides', async () => {
    expect(await poemDigest(`\n${POEM}\n `)).toBe(await poemDigest(POEM));
  });

  it('is read from the stream', () => {
    const share = { s: 'a', l: 'nl', d: 'b', sig: 'c' };
    const line = `data: ${JSON.stringify({ type: 'data-share', data: share })}`;
    expect(parseStreamLine(line)).toEqual({ type: 'share', share });
  });
});

describe('share image', () => {
  it('escapes text, so a poem cannot change the image markup', () => {
    expect(escapeXml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;');
    const svg = buildShareSvg('Regel <script>alert(1)</script>', 'nl', 'data:image/jpeg;base64,AA');
    expect(svg).not.toContain('<script>');
  });

  it('removes emoji, which the fonts cannot draw', () => {
    expect(stripEmoji('Sint 🎁 komt ✨ eraan')).toBe('Sint komt eraan');
  });

  it('uses large type for short lines and smaller type for long ones', () => {
    const short = layoutOpening('Lieve oma\nDe Sint is er');
    const long = layoutOpening(`${'lange regel '.repeat(7)}\n${'nog een regel '.repeat(6)}`);
    expect(short.fontSize).toBeGreaterThan(long.fontSize);
    expect(long.rows.length).toBeLessThanOrEqual(5);
  });

  it('keeps the text clear of the button', () => {
    const { rows, fontSize } = layoutOpening(
      'Lieve Oma Truus, al tweeëntachtig jaar op deze aard,\nMaar elke zondag bak je nog de allerbeste appeltaart!',
    );
    expect(rows.length * fontSize * 1.28).toBeLessThanOrEqual(320);
  });

  it('never runs out of the image', () => {
    const { rows, fontSize } = layoutOpening('x'.repeat(180));
    const maxChars = Math.floor(690 / (fontSize * 0.46));
    for (const row of rows) expect(row.length).toBeLessThanOrEqual(maxChars);
  });

  it('uses the language of the poem for its call to action', () => {
    expect(buildShareSvg('A', 'en', '')).toContain('Make your own poem');
    expect(buildShareSvg('A', 'nl', '')).toContain('Maak je eigen gedicht');
  });
});

describe('canonicalRedirect', () => {
  it('sends www to the main address and keeps the path and query', () => {
    expect(canonicalRedirect('www.sintgpt.com', '/blog?a=1')).toBe('https://sintgpt.com/blog?a=1');
  });

  it.each(['sintgpt.com', 'localhost:3000', 'sintgpt.patrick.workers.dev'])('leaves %s alone', (host) => {
    expect(canonicalRedirect(host, '/')).toBeNull();
  });
});

describe('input limits', () => {
  const base = { name: 'Oma', style: 'funny', rhymeScheme: 'AABB', lines: 12, language: 'dutch' };

  it('accepts normal input', () => {
    expect(PoemRequestSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ['name', 101],
    ['present', 201],
    ['funFacts', 2001],
    ['writtenBy', 201],
    ['writtenForAudience', 201],
  ])('rejects a %s longer than the limit', (field, length) => {
    expect(PoemRequestSchema.safeParse({ ...base, [field]: 'x'.repeat(length) }).success).toBe(false);
  });

  it('accepts the 50 lines that the form offers for a limerick', () => {
    expect(PoemRequestSchema.safeParse({ ...base, rhymeScheme: 'Limerick', lines: 50 }).success).toBe(true);
  });
});

describe('shareImageCacheUrl', () => {
  const canonical = 'https://sintgpt.com/gedicht/preview.png?s=abc&l=nl&d=def&sig=ghi';

  it('keeps only the signed values', () => {
    const url = new URL(`${canonical}&x=1&utm_source=whatsapp`);
    expect(shareImageCacheUrl(url)).toBe(canonical);
  });

  it('gives one key whatever the parameter order', () => {
    const url = new URL('https://sintgpt.com/gedicht/preview.png?sig=ghi&d=def&l=nl&s=abc');
    expect(shareImageCacheUrl(url)).toBe(canonical);
  });

  it('gives different links different keys', () => {
    const other = new URL('https://sintgpt.com/gedicht/preview.png?s=xyz&l=nl&d=def&sig=ghi');
    expect(shareImageCacheUrl(other)).not.toBe(canonical);
  });
});
