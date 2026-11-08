import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { buildPoemPdf, layoutPoem, poemPdfFileName } from '../../utils/poemPdf';

const assets = {
  paper: readFileSync('public/pdf/paper.jpg'),
  textFont: readFileSync('public/pdf/alegreya-400.ttf'),
  capFont: readFileSync('public/pdf/texturina-700.ttf'),
};
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

describe('buildPoemPdf', () => {
  const options = { ...assets, title: 'Voor oma', attribution: 'Geschreven met sintgpt.com' };

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
    ['Oma Truus', 'sinterklaasgedicht-oma-truus.pdf'],
    ['René & Zoë', 'sinterklaasgedicht-rene-zoe.pdf'],
    ['../../etc', 'sinterklaasgedicht-etc.pdf'],
    ['', 'sinterklaasgedicht.pdf'],
    ['🎁', 'sinterklaasgedicht.pdf'],
  ])('turns %s into %s', (name, file) => {
    expect(poemPdfFileName(name)).toBe(file);
  });
});
