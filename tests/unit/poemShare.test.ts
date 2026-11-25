import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  decodePoem,
  decodeText,
  encodePoem,
  encodeText,
  extractOpening,
  poemDigest,
  shownOpening,
} from '../../utils/poemLink';
import { framePoem, poemFrame } from '../../utils/poemFrame';
import { parseStreamLine } from '../../utils/poemStream';
import { shareImageCacheUrl, signPoemShare, verifyPoemShare } from '../../server/utils/poemShare';
import {
  createShortLink,
  readShortLink,
  SHORT_LINK_TTL_SECONDS,
  type ShortLinkStore,
} from '../../server/utils/poemShortLink';
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

  it('skips the greeting above the poem, so the preview shows two poem lines', () => {
    const framed = framePoem(POEM, poemFrame('Thom', 'dutch'));
    expect(extractOpening(framed)).toBe('Sint zag oma Truus, zo lief en zo fijn,\nzij bakt elke zondag, heel klein.');
    expect(extractOpening(framePoem(POEM, poemFrame('Thom', 'english')))).toBe(extractOpening(POEM));
  });

  it('keeps a first line that only starts like a greeting', () => {
    expect(extractOpening('Lieve Thom, wat ben je toch fijn,\nje fietst naar school in de regen.'))
      .toBe('Lieve Thom, wat ben je toch fijn,\nje fietst naar school in de regen.');
  });
});

describe('shownOpening', () => {
  it('drops the greeting of links signed before the opening skipped it', () => {
    expect(shownOpening('Lieve Thom,\nSint zag Thom met zijn gitaar')).toBe('Sint zag Thom met zijn gitaar');
  });

  it('leaves other openings alone', () => {
    expect(shownOpening('Regel een\nRegel twee')).toBe('Regel een\nRegel twee');
    expect(shownOpening('Lieve Thom,')).toBe('Lieve Thom,');
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
      style: null,
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

  it.each(['ironic', 'old-fashioned', 'spicy', 'roast'] as const)('signs the style %s, which has its own Sint photo', async (style) => {
    const share = await signPoemShare(POEM, 'nl', SECRET, style);
    expect(share.st).toMatch(new RegExp(`^${style}\\.[A-Za-z0-9_-]{16}$`));
    expect((await verifyPoemShare({ ...share }, SECRET))?.style).toBe(style);
  });

  it.each(['funny', 'classic', undefined, null, 'unknown'])('leaves the style %s out: it has the usual photo', async (style) => {
    const share = await signPoemShare(POEM, 'nl', SECRET, style);
    expect(share).not.toHaveProperty('st');
    expect(share).toEqual(await signPoemShare(POEM, 'nl', SECRET));
  });

  it('keeps the link of a poem the same with a style: only `st` is added', async () => {
    const { st, ...rest } = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    expect(st).toBeTruthy();
    expect(rest).toEqual(await signPoemShare(POEM, 'nl', SECRET));
  });

  it('shows the usual photo for a link without its style, as a page from before the styles makes it', async () => {
    const { st: _st, ...rest } = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    expect((await verifyPoemShare({ ...rest }, SECRET))?.style).toBeNull();
  });

  it('does not accept a style it did not sign', async () => {
    const roast = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    const tag = roast.st!.split('.')[1]!;
    const otherPoem = await signPoemShare(`${POEM}\nEn nog een regel.`, 'nl', SECRET, 'roast');
    for (const st of [
      `spicy.${tag}`,
      'roast',
      'roast.',
      `roast.${tag}x`,
      `funny.${tag}`,
      `.${tag}`,
      otherPoem.st,
      `roast.${'A'.repeat(60)}`,
      42,
      ['roast', tag],
    ]) {
      // The link itself stays valid; only the photo is the usual one.
      expect(await verifyPoemShare({ ...roast, st }, SECRET)).toMatchObject({ language: 'nl', style: null });
    }
    expect((await verifyPoemShare({ ...roast }, 'other'))).toBeNull();
  });

  it('puts the style in the link the visitor shares, and only then', async () => {
    const roast = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    const link = new URL(await buildShareUrl('https://sintgpt.com', roast, POEM));
    expect(link.searchParams.get('st')).toBe(roast.st);
    expect((await verifyPoemShare(Object.fromEntries(link.searchParams), SECRET))?.style).toBe('roast');

    const usual = new URL(await buildShareUrl('https://sintgpt.com', await signPoemShare(POEM, 'nl', SECRET, 'funny'), POEM));
    expect([...usual.searchParams.keys()]).toEqual(['s', 'l', 'd', 'sig']);
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
    expect(buildShareSvg('A', 'en', '')).toContain('Read the rest of this poem');
    expect(buildShareSvg('A', 'nl', '')).toContain('Lees dit gedicht verder');
  });
});

describe('canonicalRedirect', () => {
  const live = (path: string, extra: Partial<Parameters<typeof canonicalRedirect>[0]> = {}) =>
    canonicalRedirect({ host: 'sintgpt.com', path, protocol: 'https', ...extra });

  it('sends www to the main address and keeps the path and query', () => {
    expect(canonicalRedirect({ host: 'www.sintgpt.com', path: '/blog?a=1', protocol: 'https' })).toBe('https://sintgpt.com/blog?a=1');
    expect(canonicalRedirect({ host: 'www.sintgpt.com', path: '/', protocol: 'http' })).toBe('https://sintgpt.com/');
  });

  it('sends http to https on the live site', () => {
    expect(live('/blog?x=1', { protocol: 'http' })).toBe('https://sintgpt.com/blog?x=1');
    expect(live('/', { protocol: 'http' })).toBe('https://sintgpt.com/');
  });

  it('removes a trailing slash and lowercases page paths', () => {
    expect(live('/blog/')).toBe('https://sintgpt.com/blog');
    expect(live('/BLOG')).toBe('https://sintgpt.com/blog');
    expect(live('/Voorbeelden/?a=B')).toBe('https://sintgpt.com/voorbeelden?a=B');
    expect(live('/blog/Sinterklaas-Tradities/')).toBe('https://sintgpt.com/blog/sinterklaas-tradities');
  });

  it('keeps the case of short-link IDs and other paths', () => {
    expect(live('/g/AbC_dEf-12')).toBeNull();
    expect(live('/g/AbC_dEf-12/')).toBe('https://sintgpt.com/g/AbC_dEf-12');
    expect(live('/_nuxt/BfSc3-lo.js')).toBeNull();
  });

  it('does not redirect a POST for the path rules', () => {
    expect(live('/api/events/', { method: 'POST' })).toBeNull();
  });

  it.each([
    ['sintgpt.com', 'https'],
    ['localhost:3000', 'http'],
    ['sintgpt.patrick.workers.dev', 'https'],
  ])('leaves %s over %s alone', (host, protocol) => {
    expect(canonicalRedirect({ host, path: '/', protocol })).toBeNull();
    expect(canonicalRedirect({ host, path: '/blog', protocol })).toBeNull();
  });

  it('fixes the path on localhost without changing the protocol', () => {
    expect(canonicalRedirect({ host: 'localhost:3000', path: '/blog/', protocol: 'http' })).toBe('http://localhost:3000/blog');
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

  it('accepts a limerick of 5 lines, and the 50 lines older pages sent for one', () => {
    expect(PoemRequestSchema.safeParse({ ...base, rhymeScheme: 'Limerick', lines: 5 }).success).toBe(true);
    expect(PoemRequestSchema.safeParse({ ...base, rhymeScheme: 'Limerick', lines: 50 }).success).toBe(true);
  });
});

describe('shareImageCacheUrl', () => {
  const link = 'https://sintgpt.com/gedicht/preview.png?s=abc&l=nl&d=def&sig=ghi';
  const canonical = `${link}&v=2`;

  it('keeps only the signed values and the image version', () => {
    const url = new URL(`${link}&x=1&utm_source=whatsapp&v=9`);
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

  it('adds only a verified style, so a made-up `st` cannot force a new render', () => {
    const url = new URL(`${link}&st=roast.made-up-tag`);
    // Not verified: the same key as the link without a style.
    expect(shareImageCacheUrl(url)).toBe(canonical);
    expect(shareImageCacheUrl(url, null)).toBe(canonical);
    expect(shareImageCacheUrl(url, 'roast')).toBe(`${link}&st=roast&v=2`);
    expect(shareImageCacheUrl(url, 'roast')).not.toBe(shareImageCacheUrl(url, 'spicy'));
  });
});

describe('short poem links', () => {
  function fakeStore() {
    const values = new Map<string, string>();
    const puts: { key: string; ttl: number }[] = [];
    const store: ShortLinkStore = {
      get: async key => values.get(key) ?? null,
      put: async (key, value, { expirationTtl }) => {
        values.set(key, value);
        puts.push({ key, ttl: expirationTtl });
      },
    };
    return { store, puts, values };
  }

  it('stores a signed poem and reads it back', async () => {
    const { store, puts } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET);
    const id = await createShortLink(store, share, POEM, SECRET);

    expect(id).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(puts[0]!.ttl).toBe(SHORT_LINK_TTL_SECONDS);
    const stored = await readShortLink(store, id!, SECRET);
    expect(stored?.poem).toBe(POEM);
    expect(stored?.language).toBe('nl');
    expect(stored?.share).toEqual(share);
  });

  it('keeps the style of the poem, for the photo in the share image', async () => {
    const { store } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    const id = await createShortLink(store, share, POEM, SECRET);
    const stored = await readShortLink(store, id!, SECRET);
    expect(stored?.share).toEqual(share);
    expect(stored?.style).toBe('roast');
    // The same poem without a style is the same link.
    expect(await createShortLink(store, await signPoemShare(POEM, 'nl', SECRET), POEM, SECRET)).toBe(id);
  });

  it('does not store a style it did not sign', async () => {
    const { store, values } = fakeStore();
    const share = { ...(await signPoemShare(POEM, 'nl', SECRET)), st: 'roast.made-up-tag' };
    const id = await createShortLink(store, share, POEM, SECRET);
    expect(id).toBeTruthy();
    expect([...values.values()][0]).not.toContain('made-up-tag');
    expect((await readShortLink(store, id!, SECRET))?.style).toBeNull();
  });

  it('gives the same poem the same link, and writes it once', async () => {
    const { store, puts } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET);
    const first = await createShortLink(store, share, POEM, SECRET);
    const second = await createShortLink(store, share, POEM, SECRET);

    expect(second).toBe(first);
    expect(puts).toHaveLength(1);
  });

  it('gives different poems different links', async () => {
    const { store } = fakeStore();
    const other = `${POEM}\nEn nog een regel.`;
    const first = await createShortLink(store, await signPoemShare(POEM, 'nl', SECRET), POEM, SECRET);
    const second = await createShortLink(store, await signPoemShare(other, 'nl', SECRET), other, SECRET);
    expect(second).not.toBe(first);
  });

  it('refuses other text under a valid signature', async () => {
    const { store, puts } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET);
    expect(await createShortLink(store, share, 'Koop nu goedkope pillen', SECRET)).toBeNull();
    expect(puts).toHaveLength(0);
  });

  it('refuses a forged signature', async () => {
    const { store, puts } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', 'another-secret');
    expect(await createShortLink(store, share, POEM, SECRET)).toBeNull();
    expect(puts).toHaveLength(0);
  });

  it.each([
    ['not text', 42],
    ['too long', 'x'.repeat(16 * 1024 + 1)],
  ])('refuses a poem that is %s', async (_label, poem) => {
    const { store } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET);
    expect(await createShortLink(store, share, poem, SECRET)).toBeNull();
  });

  it('does not read unknown or malformed IDs', async () => {
    const { store } = fakeStore();
    expect(await readShortLink(store, 'abcdefghij', SECRET)).toBeNull();
    expect(await readShortLink(store, '../secret', SECRET)).toBeNull();
  });

  it('stops serving links when the secret changes', async () => {
    const { store } = fakeStore();
    const share = await signPoemShare(POEM, 'nl', SECRET);
    const id = await createShortLink(store, share, POEM, SECRET);
    expect(await readShortLink(store, id!, 'new-secret')).toBeNull();
  });
});
