import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_POEMS } from '../../utils/examplePoems';
import { PDF_DESIGN_IDS, isExtraPdfDesign } from '../../utils/pdfDesigns';
import { PDF_SHOWCASE, pdfShowcaseImage } from '../../utils/pdfShowcase';

describe('PDF design carousel', () => {
  it('shows every design without a tier once, and no extra design', () => {
    expect(PDF_SHOWCASE.map(item => item.design).sort())
      .toEqual(PDF_DESIGN_IDS.filter(id => !isExtraPdfDesign(id)).sort());
  });

  it('puts a different AABB example poem on each design', () => {
    expect(new Set(PDF_SHOWCASE.map(item => item.exampleId)).size).toBe(PDF_SHOWCASE.length);
    for (const { exampleId } of PDF_SHOWCASE) {
      const example = EXAMPLE_POEMS.find(item => item.id === exampleId);
      expect(example, exampleId).toBeDefined();
      expect(example!.request.rhymeScheme, exampleId).toBe('AABB');
    }
  });

  it('has a picture for every design', () => {
    for (const { design } of PDF_SHOWCASE) {
      expect(existsSync(`public${pdfShowcaseImage(design)}`), design).toBe(true);
    }
  });
});
