import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { PDF_DESIGNS, PDF_DESIGN_IDS, type PdfDesignId } from '../../utils/pdfDesigns';
import { buildPoemPdf, layoutPoem, poemFrame, poemPdfFileName } from '../../utils/poemPdf';

const file = (publicPath: string) => readFileSync(`public${publicPath}`);
const assetsFor = (id: PdfDesignId) => {
  const design = PDF_DESIGNS[id];
  return {
    design,
    background: file(design.background),
    textFont: file(design.textFont),
    capFont: design.capFont ? file(design.capFont) : undefined,
  };
};
const assets = assetsFor('perkament');
const measure = (text: string, size: number) => text.length * size * 0.45;
const verse = 'Sint zag oma Truus\nzij bakt elke zondag\nHaar taart is een feest\nvoor mens en voor beest';

describe('layoutPoem', () => {
  it('keeps the first letter apart as a drop cap', () => {
    const { dropCap, pages } = layoutPoem(verse, measure, measure);
    expect(dropCap?.letter).toBe('S');
    expect(pages[0]![0]!.text).toBe('int zag oma Truus');
  });

  it('indents the two rows beside the drop cap only', () => {
    const { pages } = layoutPoem(verse, measure, measure);
    const rows = pages[0]!;
    expect(rows[0]!.indent).toBeGreaterThan(0);
    expect(rows[1]!.indent).toBe(rows[0]!.indent);
    expect(rows[2]!.indent).toBe(0);
  });

  it('uses no drop cap when the poem starts with punctuation', () => {
    const { dropCap, pages } = layoutPoem('"Sint" zei de Piet', measure, measure);
    expect(dropCap).toBeNull();
    expect(pages[0]![0]!.text).toBe('"Sint" zei de Piet');
  });

  it('lets a wrapped row hang under its verse line', () => {
    const line = 'woord '.repeat(40).trim();
    const { pages, fontSize } = layoutPoem(`A\nB\n${line}`, measure, measure);
    const rows = pages[0]!.slice(2);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0]!.indent).toBe(0);
    expect(rows[1]!.indent).toBeCloseTo(0.9 * fontSize);
  });

  it('breaks a word that is wider than the page', () => {
    const { pages } = layoutPoem(`A\nB\n${'x'.repeat(300)}`, measure, measure);
    const rows = pages[0]!.slice(2);
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.map(row => row.text).join('')).toBe('x'.repeat(300));
  });

  it('removes emoji, which the fonts do not have', () => {
    const { pages } = layoutPoem('Sint komt 🎁 eraan', measure, measure);
    expect(pages[0]![0]!.text).toBe('int komt eraan');
  });

  it('shrinks a longer poem to keep it on one page', () => {
    const short = layoutPoem(verse, measure, measure);
    const longer = layoutPoem(Array(5).fill(verse).join('\n\n'), measure, measure);
    expect(longer.pages).toHaveLength(1);
    expect(longer.fontSize).toBeLessThan(short.fontSize);
  });

  it('continues a very long poem on more pages, between verses, without losing text', () => {
    const poem = Array(15).fill(verse).join('\n\n');
    const { pages } = layoutPoem(poem, measure, measure);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages.slice(1)) expect(page[0]!.text).not.toBe('');
    expect(pages[0]!.at(-1)!.text).toBe('voor mens en voor beest');

    const rows = pages.flat().filter(row => row.text);
    expect(rows).toHaveLength(15 * 4);
  });
});

describe('layoutPoem with a design', () => {
  it('has no drop cap without a cap font', () => {
    const { dropCap, pages } = layoutPoem(verse, measure, null, poemFrame(PDF_DESIGNS.cadeaupapier));
    expect(dropCap).toBeNull();
    expect(pages[0]![0]!.text).toBe('Sint zag oma Truus');
  });

  it('does not hang wrapped rows in a centred design', () => {
    const line = 'woord '.repeat(40).trim();
    const { pages } = layoutPoem(`A\nB\n${line}`, measure, null, poemFrame(PDF_DESIGNS.cadeaupapier));
    expect(pages[0]!.every(row => row.indent === 0)).toBe(true);
  });

  it('uses the sizes of the design', () => {
    const { fontSize } = layoutPoem(verse, measure, null, poemFrame(PDF_DESIGNS.schoolschrift));
    expect(fontSize).toBe(PDF_DESIGNS.schoolschrift.sizes[0]!.fontSize);
  });
});

describe('PDF designs', () => {
  it.each(PDF_DESIGN_IDS)('%s has its files in public/', (id) => {
    const design = PDF_DESIGNS[id];
    for (const path of [design.background, design.preview, design.textFont, design.capFont].filter(Boolean)) {
      expect(() => file(path!), path!).not.toThrow();
    }
  });

  it.each(PDF_DESIGN_IDS)('%s makes a one-page PDF with Dutch accents', async (id) => {
    const poem = `${verse}\nCafé, coördinatie, reünie\nEën, ’s avonds — “prima” …`;
    const doc = await PDFDocument.load(await buildPoemPdf({ ...assetsFor(id), title: 'Voor oma', poem }));
    expect(doc.getPageCount()).toBe(1);
  });

  it('never names the site in the PDF', async () => {
    for (const id of PDF_DESIGN_IDS) {
      const bytes = await buildPoemPdf({ ...assetsFor(id), title: 'Voor oma', poem: verse });
      const doc = await PDFDocument.load(bytes);
      expect(doc.getAuthor() ?? '').not.toMatch(/sintgpt/i);
      expect(doc.getCreator() ?? '').not.toMatch(/sintgpt/i);
      expect(Buffer.from(bytes).toString('latin1')).not.toMatch(/sintgpt/i);
    }
  });
});

describe('buildPoemPdf', () => {
  const options = { ...assets, title: 'Voor oma' };

  it('makes a valid A4 PDF with the title', async () => {
    const doc = await PDFDocument.load(await buildPoemPdf({ ...options, poem: verse }));
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe('Voor oma');
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
  });

  it('adds pages for a very long poem', async () => {
    const poem = Array(15).fill(verse).join('\n\n');
    const doc = await PDFDocument.load(await buildPoemPdf({ ...options, poem }));
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it('accepts Dutch accents', async () => {
    const poem = 'Café, coördinatie, reünie\nEën, ’s avonds — “prima” …';
    await expect(buildPoemPdf({ ...options, poem })).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe('poemPdfFileName', () => {
  it.each([
    ['Oma Truus', 'sinterklaasgedicht-oma-truus-sintgpt.com.pdf'],
    ['René & Zoë', 'sinterklaasgedicht-rene-zoe-sintgpt.com.pdf'],
    ['../../etc', 'sinterklaasgedicht-etc-sintgpt.com.pdf'],
    ['', 'sinterklaasgedicht-sintgpt.com.pdf'],
    ['🎁', 'sinterklaasgedicht-sintgpt.com.pdf'],
  ])('turns %s into %s', (name, file) => {
    expect(poemPdfFileName(name)).toBe(file);
  });
});
