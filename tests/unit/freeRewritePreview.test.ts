import { describe, expect, it } from 'vitest';
import { freeRewriteEnabled, qualifiesForFreeRewrite } from '../../server/utils/freeRewrite';
import { PREVIEW_ID_PATTERN, newPreviewId, previewEnabled, previewTeaser } from '../../server/utils/poemPreview';
import { signPoemShare } from '../../server/utils/poemShare';
import { apiLimiter } from '../../server/utils/apiGuard';
import { applyRateLimit, FREE_REWRITE_LIMIT, POEM_PREVIEW_LIMIT } from '../../server/utils/rateLimit';

const SECRET = 'test-secret-0123456789abcdef';
const POEM = 'Lieve Anna,\n\nJe fietst elke dag weer naar je werk,\nJe benen zijn daardoor heel sterk.\nMaar zondag lig je lang in bed,\nDan is de fiets niet meer zo pret.\n\nDus krijg je nu een warme jas,\nVoor elke rit, dat komt van pas.\n\nVan Sint & Piet';

describe('free rewrite', () => {
  it('is on unless the switch says off', () => {
    expect(freeRewriteEnabled('')).toBe(true);
    expect(freeRewriteEnabled(undefined)).toBe(true);
    expect(freeRewriteEnabled(' OFF ')).toBe(false);
  });

  it('needs a wish and a poem SintGPT signed', async () => {
    const previousShare = await signPoemShare(POEM, 'nl', SECRET);
    const body = { regenerate: true, rewriteHint: 'korter', previousPoem: POEM, previousShare };
    expect(await qualifiesForFreeRewrite(body, SECRET)).toBe(true);
    expect(await qualifiesForFreeRewrite({ ...body, rewriteHint: '  ' }, SECRET)).toBe(false);
    expect(await qualifiesForFreeRewrite({ ...body, regenerate: false }, SECRET)).toBe(false);
    expect(await qualifiesForFreeRewrite({ ...body, previousShare: undefined }, SECRET)).toBe(false);
    expect(await qualifiesForFreeRewrite(body, '')).toBe(false);
    expect(await qualifiesForFreeRewrite(null, SECRET)).toBe(false);
  });

  it('accepts a poem in a style with its own Sint photo, with or without `st` (the request schema drops it)', async () => {
    const previousShare = await signPoemShare(POEM, 'nl', SECRET, 'roast');
    const body = { regenerate: true, rewriteHint: 'korter', previousPoem: POEM, previousShare };
    expect(await qualifiesForFreeRewrite(body, SECRET)).toBe(true);
    const { st: _st, ...withoutStyle } = previousShare;
    expect(await qualifiesForFreeRewrite({ ...body, previousShare: withoutStyle }, SECRET)).toBe(true);
  });

  it('refuses text that is not the signed poem, or a signature with another secret', async () => {
    const previousShare = await signPoemShare(POEM, 'nl', SECRET);
    const body = { regenerate: true, rewriteHint: 'korter', previousPoem: `${POEM}\nEen eigen regel`, previousShare };
    expect(await qualifiesForFreeRewrite(body, SECRET)).toBe(false);
    const forged = await signPoemShare(POEM, 'nl', 'another-secret-0123456789');
    expect(await qualifiesForFreeRewrite({ ...body, previousPoem: POEM, previousShare: forged }, SECRET)).toBe(false);
  });

  it('allows one per connection per day', () => {
    const now = 1_000_000;
    const first = applyRateLimit(undefined, now, FREE_REWRITE_LIMIT);
    expect(first.verdict.ok).toBe(true);
    const second = applyRateLimit(first.entry, now + 60_000, FREE_REWRITE_LIMIT);
    expect(second.verdict).toMatchObject({ ok: false, reason: 'limit' });
  });
});

describe('poem preview', () => {
  it('is on unless the switch says off', () => {
    expect(previewEnabled('')).toBe(true);
    expect(previewEnabled('off')).toBe(false);
  });

  it('makes unguessable IDs of the expected form', () => {
    const ids = new Set(Array.from({ length: 50 }, newPreviewId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(PREVIEW_ID_PATTERN);
  });

  it('shows the greeting and the first stanza, never more than half of the poem', () => {
    const { shown, hidden } = previewTeaser(POEM);
    expect(shown).toEqual(['Lieve Anna,', '', 'Je fietst elke dag weer naar je werk,', 'Je benen zijn daardoor heel sterk.', 'Maar zondag lig je lang in bed,']);
    // 6 lines of the poem itself: at most 3 show.
    expect(shown.filter(line => line && !line.startsWith('Lieve')).length).toBe(3);
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden).toContain(0);
    // Only lengths: no text of the rest.
    expect(hidden.every(value => typeof value === 'number')).toBe(true);
  });

  it('stops at the end of the first stanza', () => {
    const poem = 'Regel een,\nRegel twee.\n\nRegel drie,\nRegel vier.\n\nRegel vijf,\nRegel zes.\n\nRegel zeven,\nRegel acht.';
    expect(previewTeaser(poem).shown).toEqual(['Regel een,', 'Regel twee.']);
  });

  it('allows two previews per connection per day', () => {
    const now = 2_000_000;
    let entry = applyRateLimit(undefined, now, POEM_PREVIEW_LIMIT).entry;
    const second = applyRateLimit(entry, now + 20_000, POEM_PREVIEW_LIMIT);
    expect(second.verdict.ok).toBe(true);
    entry = second.entry;
    expect(applyRateLimit(entry, now + 40_000, POEM_PREVIEW_LIMIT).verdict).toMatchObject({ ok: false, reason: 'limit' });
  });

  it('limits unlock attempts like payment claims', () => {
    expect(apiLimiter('POST', '/api/poem/unlock')).toBe('PAYMENT_BURST');
  });
});
