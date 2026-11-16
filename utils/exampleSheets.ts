// /voorbeelden shows every example poem as page 1 of a real PDF, in one of the
// designs every visitor gets (not the extra designs of Hele familie, so the
// page names no tier). The pictures are built by scripts/build-pdf-showcase.ts
// (`npm run build:pdf-showcase`); run it after changing a poem, a design or
// this list.
import type { PdfDesignId } from './pdfDesigns';

export const EXAMPLE_SHEET_DESIGNS: Record<string, PdfDesignId> = {
  'opa-kees': 'pakjesavond',
  lotte: 'perkament',
  mark: 'cadeaupapier',
  'tante-els': 'perkament',
  daan: 'schoolschrift',
  jeroen: 'pakjesavond',
  'buurman-gerrit': 'perkament',
  sem: 'schoolschrift',
  emma: 'cadeaupapier',
};

/** Picture widths in pixels (A4 ratio). The page shows a sheet at most 560 px wide. */
export const EXAMPLE_SHEET_WIDTHS = [560, 1120] as const;
export const EXAMPLE_SHEET_WIDTH = EXAMPLE_SHEET_WIDTHS[0];
export const EXAMPLE_SHEET_HEIGHT = Math.round((EXAMPLE_SHEET_WIDTH * 842) / 595);

export const exampleSheetImage = (id: string, width: number) => `/pdf/examples/${id}-${width}.webp`;

export function exampleSheet(id: string) {
  const design = EXAMPLE_SHEET_DESIGNS[id];
  if (!design) throw new Error(`No PDF design for example ${id}`);
  return {
    design,
    src: exampleSheetImage(id, EXAMPLE_SHEET_WIDTH),
    srcset: EXAMPLE_SHEET_WIDTHS.map(width => `${exampleSheetImage(id, width)} ${width}w`).join(', '),
  };
}
