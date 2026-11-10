import { describe, expect, it } from 'vitest';
import { checkPoemEdit, editDistance, reSignEditedPoem, wordChange } from '../../server/utils/poemEdit';
import { signPoemShare, verifyPoemShare } from '../../server/utils/poemShare';
import { poemDigest } from '../../utils/poemLink';

const SECRET = 'test-secret-for-poem-edits';

const ORIGINAL = [
  'Sanne fietst elke dag naar haar werk,',
  'zo hard en zo snel, ze is echt heel sterk.',
  'De Sint zag haar gaan, langs dijk en langs sloot,',
  'en bracht haar een bel voor haar fiets, groot en rood.',
  '',
  'Want bellen dat moet, als je zo snel gaat,',
  'zodat iedereen weet dat Sanne eraan gaat.',
  'Dus pak nu je cadeau en fiets maar weer door,',
  'de Sint en zijn Pieten, die juichen ervoor!',
].join('\n');

describe('editDistance', () => {
  it('counts insertions, deletions and changes', () => {
    expect(editDistance([...'kitten'], [...'sitting'])).toBe(3);
    expect(editDistance([], ['a', 'b'])).toBe(2);
    expect(editDistance(['a'], ['a'])).toBe(0);
  });
});

describe('checkPoemEdit', () => {
  it('allows changing a word', () => {
    expect(checkPoemEdit(ORIGINAL, ORIGINAL.replace('groot en rood', 'glimmend en rood'))).toEqual({ ok: true });
  });

  it('allows fixing the name in the opening', () => {
    expect(checkPoemEdit(ORIGINAL, ORIGINAL.replace('Sanne fietst', 'Sophie fietst'))).toEqual({ ok: true });
  });

  it('allows changing a whole line in the body', () => {
    const edited = ORIGINAL.replace('Dus pak nu je cadeau en fiets maar weer door,', 'Dus trap maar flink door, de wind in je haar,');
    expect(wordChange(ORIGINAL, edited)).toBeLessThan(0.25);
    expect(checkPoemEdit(ORIGINAL, edited)).toEqual({ ok: true });
  });

  it('refuses a new opening, which the link preview shows', () => {
    const edited = ORIGINAL.replace(
      'Sanne fietst elke dag naar haar werk,\nzo hard en zo snel, ze is echt heel sterk.',
      'Koop nu goedkope horloges op een andere site,\nklik op de link, dan ben je je geld niet kwijt.',
    );
    expect(checkPoemEdit(ORIGINAL, edited)).toEqual({ ok: false, reason: 'too-different' });
  });

  it('refuses a different poem', () => {
    expect(checkPoemEdit(ORIGINAL, 'Een heel ander gedicht\nover iets anders.')).toEqual({ ok: false, reason: 'too-different' });
  });

  it('refuses an empty poem', () => {
    expect(checkPoemEdit(ORIGINAL, '  \n ')).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('reSignEditedPoem', () => {
  it('signs a small edit, and the new link verifies', async () => {
    const share = await signPoemShare(ORIGINAL, 'nl', SECRET);
    const text = ORIGINAL.replace('groot en rood', 'glimmend en rood');
    const result = await reSignEditedPoem({ share, original: ORIGINAL, text }, SECRET);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const verified = await verifyPoemShare({ ...result.share }, SECRET);
    expect(verified?.digest).toBe(await poemDigest(text));
    expect(verified?.language).toBe('nl');
  });

  it('refuses an original that does not match the signature', async () => {
    const share = await signPoemShare(ORIGINAL, 'nl', SECRET);
    // Someone claims their own poem is the original, to edit it from there.
    const fake = 'Mijn eigen tekst\nop sintgpt.com';
    expect(await reSignEditedPoem({ share, original: fake, text: fake }, SECRET)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses a signature made with another secret', async () => {
    const share = await signPoemShare(ORIGINAL, 'nl', 'another-secret');
    expect(await reSignEditedPoem({ share, original: ORIGINAL, text: ORIGINAL }, SECRET)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses a large edit', async () => {
    const share = await signPoemShare(ORIGINAL, 'nl', SECRET);
    const result = await reSignEditedPoem({ share, original: ORIGINAL, text: 'Iets heel anders.' }, SECRET);
    expect(result).toEqual({ ok: false, reason: 'too-different' });
  });
});
