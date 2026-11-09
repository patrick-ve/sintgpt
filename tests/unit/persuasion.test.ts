import { describe, expect, it } from 'vitest';
import { EXAMPLE_POEMS } from '../../utils/examplePoems';
import {
  clearFormDraft,
  FORM_DRAFT_KEY,
  FORM_DRAFT_TTL_MS,
  saveFormDraft,
  takeFormDraft,
} from '../../utils/formDraft';
import { checkNames, cryptoRandomInt, drawLootjes, parseNames } from '../../utils/lootjes';
import { pakjesavondCountdown } from '../../utils/pakjesavond';
import { PoemRequestSchema } from '../../server/utils/poem';

describe('pakjesavondCountdown', () => {
  it('counts Dutch calendar days to 5 December', () => {
    expect(pakjesavondCountdown(new Date('2026-11-09T12:00:00+01:00'))).toEqual({ days: 26, hurry: false });
  });

  it('uses the Dutch date, not the server date', () => {
    // 23:30 UTC on 1 December is already 2 December in the Netherlands.
    expect(pakjesavondCountdown(new Date('2026-12-01T23:30:00Z'))?.days).toBe(3);
  });

  it('adds the hurry hint from three days before', () => {
    expect(pakjesavondCountdown(new Date('2026-12-01T12:00:00+01:00'))).toEqual({ days: 4, hurry: false });
    expect(pakjesavondCountdown(new Date('2026-12-02T12:00:00+01:00'))).toEqual({ days: 3, hurry: true });
    expect(pakjesavondCountdown(new Date('2026-12-05T20:00:00+01:00'))).toEqual({ days: 0, hurry: true });
  });

  it('shows nothing after pakjesavond or long before it', () => {
    expect(pakjesavondCountdown(new Date('2026-12-06T09:00:00+01:00'))).toBeNull();
    expect(pakjesavondCountdown(new Date('2026-07-01T09:00:00+02:00'))).toBeNull();
  });
});

describe('lootjes', () => {
  it('reads one name per line and ignores empty lines and spaces', () => {
    expect(parseNames('  Sanne \n\nOpa   Kees\n Daan')).toEqual(['Sanne', 'Opa Kees', 'Daan']);
  });

  it('asks for at least three different names', () => {
    expect(checkNames(['Sanne', 'Daan'])).toBe('tooFew');
    expect(checkNames(['Sanne', 'Daan', 'sanne'])).toBe('duplicate');
    expect(checkNames(['Sanne', 'Daan', 'Kees'])).toBeNull();
    expect(checkNames(Array.from({ length: 51 }, (_, i) => `P${i}`))).toBe('tooMany');
  });

  it('gives everyone exactly one lootje of someone else, in one circle', () => {
    const names = ['Sanne', 'Daan', 'Kees', 'Els', 'Mark', 'Lotte'];
    for (let run = 0; run < 200; run++) {
      const draw = drawLootjes(names);
      expect(Object.keys(draw).sort()).toEqual([...names].sort());
      expect(Object.values(draw).sort()).toEqual([...names].sort());
      for (const [giver, receiver] of Object.entries(draw)) expect(receiver).not.toBe(giver);

      // Following the lootjes from one person visits everyone once.
      const visited = new Set<string>();
      let current = names[0]!;
      while (!visited.has(current)) {
        visited.add(current);
        current = draw[current]!;
      }
      expect(visited.size).toBe(names.length);
    }
  });

  it('keeps every random number in range', () => {
    for (let i = 0; i < 1000; i++) {
      const value = cryptoRandomInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });
});

describe('form draft', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
      data,
    };
  };

  it('gives the form back once', () => {
    const storage = memory();
    saveFormDraft(storage, { name: 'Sanne', lines: 12 }, 1000);
    expect(takeFormDraft(storage, 2000)).toEqual({ name: 'Sanne', lines: 12 });
    expect(takeFormDraft(storage, 2000)).toBeNull();
  });

  it('drops a draft older than two hours', () => {
    const storage = memory();
    saveFormDraft(storage, { name: 'Sanne' }, 0);
    expect(takeFormDraft(storage, FORM_DRAFT_TTL_MS + 1)).toBeNull();
    expect(storage.data.has(FORM_DRAFT_KEY)).toBe(false);
  });

  it('ignores a broken draft and blocked storage', () => {
    const storage = memory();
    storage.setItem(FORM_DRAFT_KEY, '{not json');
    expect(takeFormDraft(storage)).toBeNull();

    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(() => saveFormDraft(blocked, { name: 'x' })).not.toThrow();
    expect(takeFormDraft(blocked)).toBeNull();
    expect(() => clearFormDraft(blocked)).not.toThrow();
  });
});

describe('example poems', () => {
  it('shows every style and only valid requests', () => {
    const styles = new Set(EXAMPLE_POEMS.map(example => example.request.style));
    expect([...styles].sort()).toEqual(['classic', 'funny', 'ironic', 'old-fashioned', 'roast', 'spicy']);
    for (const example of EXAMPLE_POEMS) {
      expect(PoemRequestSchema.safeParse(example.request).success, example.id).toBe(true);
      expect(example.poem.split('\n').filter(Boolean).length, example.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('has unique ids', () => {
    expect(new Set(EXAMPLE_POEMS.map(example => example.id)).size).toBe(EXAMPLE_POEMS.length);
  });
});
