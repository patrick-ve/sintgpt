import { describe, expect, it } from 'vitest';
import { EXAMPLE_POEMS } from '../../utils/examplePoems';
import nl from '../../locales/nl';
import en from '../../locales/en';

// /voorbeelden shows `examples.headings.<id>` as the h2, the index link and the
// JSON-LD name. A missing key shows the raw key on the live page.
describe('example poem headings', () => {
  for (const [lang, locale] of [['nl', nl], ['en', en]] as const) {
    it(`has a ${lang} heading for every example poem`, () => {
      const headings = locale.examples.headings as Record<string, string>;
      for (const { id } of EXAMPLE_POEMS) {
        expect(headings[id], id).toBeTruthy();
      }
    });
  }
});
