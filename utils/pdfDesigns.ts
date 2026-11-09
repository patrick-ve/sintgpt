// The looks a visitor can choose for the poem PDF. This file has no pdf-lib
// import, so the page can show the choice without loading the PDF code.
// Backgrounds come from scripts/build-pdf-paper.ts (perkament) and
// scripts/build-pdf-designs.ts (the others); previews from
// scripts/build-pdf-previews.ts.

export const PDF_DESIGN_IDS = ['perkament', 'pakjesavond', 'cadeaupapier', 'schoolschrift'] as const;
export type PdfDesignId = (typeof PDF_DESIGN_IDS)[number];

export const DEFAULT_PDF_DESIGN: PdfDesignId = 'perkament';

export interface PdfColor { r: number; g: number; b: number }

export interface PdfTextSize { fontSize: number; lineHeight: number }

export interface PdfDesign {
  id: PdfDesignId;
  /** Full-page background, A4 at 595 x 842 points. */
  background: string;
  /** Small picture of the design with a poem on it, for the choice. */
  preview: string;
  textFont: string;
  /**
   * For fonts pdf-lib cannot subset or lay out (Caveat): it drops most letters
   * when subsetting and spaces the contextual alternates wrongly. Such a font is
   * embedded whole, without alternates.
   */
  plainFont?: boolean;
  /** A drop cap in this font starts the poem; null for no drop cap. */
  capFont: string | null;
  ink: PdfColor;
  accent: PdfColor;
  /** The writing area, in points from each page edge. */
  area: { left: number; right: number; top: number; bottom: number };
  align: 'left' | 'center';
  /** Largest first. Longer poems step down until they fit one page. */
  sizes: PdfTextSize[];
  /** Notebook lines under every row of text, drawn at the row height. */
  rules?: { color: PdfColor; left: number; right: number };
}

const hex = (value: string): PdfColor => ({
  r: Number.parseInt(value.slice(1, 3), 16) / 255,
  g: Number.parseInt(value.slice(3, 5), 16) / 255,
  b: Number.parseInt(value.slice(5, 7), 16) / 255,
});

// The same ratios as PaperScroll.vue.
const SERIF_SIZES: PdfTextSize[] = [
  { fontSize: 15, lineHeight: 30 },
  { fontSize: 14, lineHeight: 26 },
  { fontSize: 13, lineHeight: 22 },
  { fontSize: 12.5, lineHeight: 19 },
];

export const PDF_DESIGNS: Record<PdfDesignId, PdfDesign> = {
  perkament: {
    id: 'perkament',
    background: '/pdf/paper.jpg',
    preview: '/pdf/previews/perkament.jpg',
    textFont: '/pdf/alegreya-400.ttf',
    capFont: '/pdf/texturina-700.ttf',
    ink: hex('#2d1810'),
    accent: hex('#8b1538'),
    area: { left: 80, right: 80, top: 104, bottom: 100 },
    align: 'left',
    sizes: SERIF_SIZES,
  },
  pakjesavond: {
    id: 'pakjesavond',
    background: '/pdf/pakjesavond.jpg',
    preview: '/pdf/previews/pakjesavond.jpg',
    textFont: '/pdf/alegreya-400.ttf',
    capFont: '/pdf/texturina-700.ttf',
    ink: hex('#f4ecd6'),
    accent: hex('#e8c25f'),
    area: { left: 88, right: 88, top: 132, bottom: 214 },
    align: 'left',
    sizes: SERIF_SIZES,
  },
  cadeaupapier: {
    id: 'cadeaupapier',
    background: '/pdf/cadeaupapier.jpg',
    preview: '/pdf/previews/cadeaupapier.jpg',
    textFont: '/pdf/alegreya-400.ttf',
    capFont: null,
    ink: hex('#4a1018'),
    accent: hex('#b51f2e'),
    area: { left: 96, right: 96, top: 158, bottom: 104 },
    align: 'center',
    sizes: SERIF_SIZES,
  },
  schoolschrift: {
    id: 'schoolschrift',
    background: '/pdf/schoolschrift.jpg',
    preview: '/pdf/previews/schoolschrift.jpg',
    textFont: '/pdf/caveat-500.ttf',
    plainFont: true,
    capFont: null,
    ink: hex('#1f3a8a'),
    accent: hex('#1f3a8a'),
    area: { left: 96, right: 48, top: 96, bottom: 56 },
    align: 'left',
    // Caveat is small for its size, so it needs larger numbers to read the same.
    sizes: [
      { fontSize: 21, lineHeight: 30 },
      { fontSize: 19, lineHeight: 26 },
      { fontSize: 17.5, lineHeight: 23 },
      { fontSize: 16, lineHeight: 20 },
    ],
    rules: { color: hex('#9dc1e4'), left: 46, right: 0 },
  },
};

export function isPdfDesignId(value: unknown): value is PdfDesignId {
  return typeof value === 'string' && (PDF_DESIGN_IDS as readonly string[]).includes(value);
}
