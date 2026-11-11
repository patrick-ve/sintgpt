// The carousel of PDF designs on the home page (components/PdfShowcase.vue).
// It shows the designs every visitor gets, not the extra designs of Hele
// familie, and never names a tier. Each design shows a different example
// poem from utils/examplePoems.ts, all in rhyme scheme AABB. The pictures are page 1 of a real PDF, built by
// scripts/build-pdf-showcase.ts (`npm run build:pdf-showcase`).
import type { PdfDesignId } from './pdfDesigns';

export interface PdfShowcaseItem {
  design: PdfDesignId;
  /** An id in EXAMPLE_POEMS. */
  exampleId: string;
}

export const PDF_SHOWCASE: PdfShowcaseItem[] = [
  { design: 'perkament', exampleId: 'tante-els' },
  { design: 'pakjesavond', exampleId: 'opa-kees' },
  { design: 'cadeaupapier', exampleId: 'mark' },
  { design: 'schoolschrift', exampleId: 'daan' },
];

/** Picture size in pixels (A4 ratio); the page shows it at about half. */
export const PDF_SHOWCASE_WIDTH = 560;
export const PDF_SHOWCASE_HEIGHT = Math.round((PDF_SHOWCASE_WIDTH * 842) / 595);

export const pdfShowcaseImage = (design: PdfDesignId) => `/pdf/showcase/${design}.webp`;
