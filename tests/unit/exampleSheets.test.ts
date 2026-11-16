import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_POEMS } from '../../utils/examplePoems';
import { EXAMPLE_SHEET_DESIGNS, EXAMPLE_SHEET_WIDTHS, exampleSheetImage } from '../../utils/exampleSheets';
import { isExtraPdfDesign } from '../../utils/pdfDesigns';

// /voorbeelden shows each example poem as a picture of its PDF. A missing
// design or picture breaks the page; an extra design would show a design
// that only Hele familie gets without saying so.
describe('example sheets on /voorbeelden', () => {
  it('gives every example poem a design every visitor gets', () => {
    expect(Object.keys(EXAMPLE_SHEET_DESIGNS).sort()).toEqual(EXAMPLE_POEMS.map(example => example.id).sort());
    for (const [id, design] of Object.entries(EXAMPLE_SHEET_DESIGNS)) {
      expect(isExtraPdfDesign(design), id).toBe(false);
    }
  });

  it('has a picture in every width', () => {
    for (const { id } of EXAMPLE_POEMS) {
      for (const width of EXAMPLE_SHEET_WIDTHS) {
        expect(existsSync(`public${exampleSheetImage(id, width)}`), `${id} ${width}`).toBe(true);
      }
    }
  });
});
