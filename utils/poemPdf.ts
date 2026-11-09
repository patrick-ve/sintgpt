// Builds the poem PDF in the browser. Keep this behind a dynamic import, because
// pdf-lib is large and only people who save a poem need it.
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { DEFAULT_PDF_DESIGN, PDF_DESIGNS, type PdfColor, type PdfDesign, type PdfTextSize } from './pdfDesigns';
import { stripEmoji } from './poemLink';

export interface PoemPdfOptions {
  poem: string;
  title: string;
  design: PdfDesign;
  /** The design's background JPEG. */
  background: Uint8Array;
  textFont: Uint8Array;
  /** Needed when the design has a drop cap. */
  capFont?: Uint8Array;
}

export interface PoemRow {
  text: string;
  indent: number;
}

export interface PoemLayout {
  fontSize: number;
  lineHeight: number;
  /** The first letter when it becomes a drop cap, and its size. */
  dropCap: { letter: string; size: number } | null;
  pages: PoemRow[][];
  /** Rows that fit on one page at this size. */
  perPage: number;
}

/** The space the poem may use, from a design. */
export interface PoemFrame {
  width: number;
  height: number;
  sizes: PdfTextSize[];
  /** Wrapped rows hang under their verse line; centred text does not. */
  hanging: boolean;
}

type Measure = (text: string, size: number) => number;

const PAGE = { width: 595.28, height: 841.89 };

export function poemFrame(design: PdfDesign): PoemFrame {
  return {
    width: PAGE.width - design.area.left - design.area.right,
    height: PAGE.height - design.area.top - design.area.bottom,
    sizes: design.sizes,
    hanging: design.align === 'left',
  };
}

const DEFAULT_FRAME = poemFrame(PDF_DESIGNS[DEFAULT_PDF_DESIGN]);

const HANGING_INDENT_EM = 0.9;
const CAP_SIZE_EM = 3.33;
const CAP_MARGIN_EM = 0.15;
const CAP_ROWS = 2;

function splitLongWord(word: string, fits: (text: string) => boolean): string[] {
  const parts: string[] = [];
  let part = '';
  for (const char of word) {
    if (part && !fits(part + char)) {
      parts.push(part);
      part = char;
    } else {
      part += char;
    }
  }
  if (part) parts.push(part);
  return parts;
}

/** Wraps verse lines into rows. A wrapped row hangs under its verse line. */
function wrapRows(
  lines: string[],
  size: number,
  measure: Measure,
  capIndent: number,
  frame: PoemFrame,
): PoemRow[] {
  const rows: PoemRow[] = [];
  const hanging = frame.hanging ? HANGING_INDENT_EM * size : 0;
  const extraIndent = () => (rows.length < CAP_ROWS ? capIndent : 0);

  for (const line of lines) {
    if (!line.trim()) {
      rows.push({ text: '', indent: 0 });
      continue;
    }
    let row = '';
    let indent = extraIndent();
    const fits = (text: string) => measure(text, size) <= frame.width - indent;
    const flush = () => {
      rows.push({ text: row, indent });
      row = '';
      indent = hanging + extraIndent();
    };
    for (const word of line.trim().split(/\s+/)) {
      const next = row ? `${row} ${word}` : word;
      if (fits(next)) {
        row = next;
        continue;
      }
      if (row) flush();
      if (fits(word)) {
        row = word;
      } else {
        for (const part of splitLongWord(word, fits)) {
          if (row) flush();
          row = part;
        }
      }
    }
    if (row) flush();
  }
  return rows;
}

/** Splits rows over pages, between verses where possible. */
function paginate(rows: PoemRow[], perPage: number): PoemRow[][] {
  const pages: PoemRow[][] = [];
  let rest = rows;
  while (rest.length > perPage) {
    let end = perPage;
    for (let index = perPage; index >= Math.ceil(perPage / 2); index -= 1) {
      if (!rest[index]?.text) {
        end = index;
        break;
      }
    }
    pages.push(rest.slice(0, end));
    rest = rest.slice(end);
    while (rest[0] && !rest[0].text) rest = rest.slice(1);
  }
  if (rest.length) pages.push(rest);
  return pages;
}

/**
 * Splits the poem into rows and pages. Without `measureCap` there is no drop
 * cap. The frame defaults to the parchment design.
 */
export function layoutPoem(
  poem: string,
  measure: Measure,
  measureCap: Measure | null,
  frame: PoemFrame = DEFAULT_FRAME,
): PoemLayout {
  const lines = poem.trim().split('\n').map(stripEmoji);
  const first = lines[0] ?? '';
  const hasDropCap = measureCap !== null && /^[\p{L}\p{N}]/u.test(first);
  const letter = hasDropCap ? [...first][0]! : '';
  const verse = hasDropCap ? [first.slice(letter.length), ...lines.slice(1)] : lines;

  const fit = (size: PdfTextSize) => {
    const capSize = size.fontSize * CAP_SIZE_EM;
    const capIndent = hasDropCap ? measureCap(letter, capSize) + CAP_MARGIN_EM * capSize : 0;
    const rows = wrapRows(verse, size.fontSize, measure, capIndent, frame);
    return { ...size, capSize, rows, perPage: Math.floor(frame.height / size.lineHeight) };
  };

  const chosen = frame.sizes.map(fit).find(option => option.rows.length <= option.perPage)
    ?? fit(frame.sizes.at(-1)!);
  return {
    fontSize: chosen.fontSize,
    lineHeight: chosen.lineHeight,
    dropCap: hasDropCap ? { letter, size: chosen.capSize } : null,
    pages: paginate(chosen.rows, chosen.perPage),
    perPage: chosen.perPage,
  };
}

const color = ({ r, g, b }: PdfColor) => rgb(r, g, b);

export async function buildPoemPdf(options: PoemPdfOptions): Promise<Uint8Array> {
  const { design } = options;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(options.title);

  const background = await doc.embedJpg(options.background);
  const textFont = await doc.embedFont(
    options.textFont,
    design.plainFont ? { subset: false, features: { calt: false, liga: false } } : { subset: true },
  );
  const capFont = design.capFont && options.capFont
    ? await doc.embedFont(options.capFont, { subset: true })
    : null;

  const frame = poemFrame(design);
  const layout = layoutPoem(
    options.poem,
    (text, size) => textFont.widthOfTextAtSize(text, size),
    capFont ? (text, size) => capFont.widthOfTextAtSize(text, size) : null,
    frame,
  );
  const { fontSize, lineHeight, dropCap } = layout;
  const ink = color(design.ink);
  // Centres the text in its line, as a browser does with a large line height.
  const baselineOffset = (lineHeight + fontSize * 0.6) / 2;
  const rowY = (index: number) =>
    PAGE.height - design.area.top - index * lineHeight - baselineOffset;
  const rowX = (row: PoemRow) => design.align === 'center'
    ? design.area.left + (frame.width - textFont.widthOfTextAtSize(row.text, fontSize)) / 2
    : design.area.left + row.indent;

  for (const [pageIndex, rows] of layout.pages.entries()) {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawImage(background, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });

    if (design.rules) {
      // A line under every row the page can hold, as in a school notebook.
      const { left, right } = design.rules;
      for (let index = 0; index < layout.perPage; index += 1) {
        const y = rowY(index) - fontSize * 0.12;
        page.drawLine({
          start: { x: left, y },
          end: { x: PAGE.width - right, y },
          thickness: 0.6,
          color: color(design.rules.color),
        });
      }
    }

    if (pageIndex === 0 && dropCap && capFont) {
      page.drawText(dropCap.letter, {
        x: design.area.left,
        y: rowY(CAP_ROWS - 1),
        size: dropCap.size,
        font: capFont,
        color: color(design.accent),
      });
    }
    for (const [rowIndex, row] of rows.entries()) {
      if (!row.text) continue;
      page.drawText(row.text, { x: rowX(row), y: rowY(rowIndex), size: fontSize, font: textFont, color: ink });
    }
  }

  return doc.save();
}

/**
 * A safe file name that names the site, for example
 * sinterklaasgedicht-oma-truus-sintgpt.com.pdf. The PDF itself never names it.
 */
export function poemPdfFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `sinterklaasgedicht-${slug}-sintgpt.com.pdf` : 'sinterklaasgedicht-sintgpt.com.pdf';
}
