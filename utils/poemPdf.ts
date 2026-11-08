// Builds the poem PDF in the browser. Keep this behind a dynamic import, because
// pdf-lib is large and only people who save a poem need it.
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { stripEmoji } from './poemLink';

export interface PoemPdfAssets {
  /** public/pdf/paper.jpg, made by scripts/build-pdf-paper.ts. */
  paper: Uint8Array;
  /** Alegreya, like the poem on screen. */
  textFont: Uint8Array;
  /** Texturina, like the drop cap on screen. */
  capFont: Uint8Array;
}

export interface PoemPdfOptions extends PoemPdfAssets {
  poem: string;
  title: string;
  attribution: string;
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
}

type Measure = (text: string, size: number) => number;

const PAGE = { width: 595.28, height: 841.89 };
// The writing area of the parchment in paper.jpg.
const TEXT_AREA = { left: 80, right: 80, top: 104, bottom: 100 };
const TEXT_WIDTH = PAGE.width - TEXT_AREA.left - TEXT_AREA.right;
const TEXT_HEIGHT = PAGE.height - TEXT_AREA.top - TEXT_AREA.bottom;

// The same ratios as PaperScroll.vue. Longer poems step down until they fit one
// page, and the last step continues on more pages.
const SIZES = [
  { fontSize: 15, lineHeight: 30 },
  { fontSize: 14, lineHeight: 26 },
  { fontSize: 13, lineHeight: 22 },
  { fontSize: 12.5, lineHeight: 19 },
];
const HANGING_INDENT_EM = 0.9;
const CAP_SIZE_EM = 3.33;
const CAP_MARGIN_EM = 0.15;
const CAP_ROWS = 2;

const INK = rgb(0x2d / 255, 0x18 / 255, 0x10 / 255);
const WINE = rgb(0x8b / 255, 0x15 / 255, 0x38 / 255);

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
): PoemRow[] {
  const rows: PoemRow[] = [];
  const hanging = HANGING_INDENT_EM * size;
  const extraIndent = () => (rows.length < CAP_ROWS ? capIndent : 0);

  for (const line of lines) {
    if (!line.trim()) {
      rows.push({ text: '', indent: 0 });
      continue;
    }
    let row = '';
    let indent = extraIndent();
    const fits = (text: string) => measure(text, size) <= TEXT_WIDTH - indent;
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

export function layoutPoem(poem: string, measure: Measure, measureCap: Measure): PoemLayout {
  const lines = poem.trim().split('\n').map(stripEmoji);
  const first = lines[0] ?? '';
  const hasDropCap = /^[\p{L}\p{N}]/u.test(first);
  const letter = hasDropCap ? [...first][0]! : '';
  const verse = hasDropCap ? [first.slice(letter.length), ...lines.slice(1)] : lines;

  const fit = (size: { fontSize: number; lineHeight: number }) => {
    const capSize = size.fontSize * CAP_SIZE_EM;
    const capIndent = hasDropCap ? measureCap(letter, capSize) + CAP_MARGIN_EM * capSize : 0;
    const rows = wrapRows(verse, size.fontSize, measure, capIndent);
    return { ...size, capSize, rows, perPage: Math.floor(TEXT_HEIGHT / size.lineHeight) };
  };

  const chosen = SIZES.map(fit).find(option => option.rows.length <= option.perPage)
    ?? fit(SIZES.at(-1)!);
  return {
    fontSize: chosen.fontSize,
    lineHeight: chosen.lineHeight,
    dropCap: hasDropCap ? { letter, size: chosen.capSize } : null,
    pages: paginate(chosen.rows, chosen.perPage),
  };
}

export async function buildPoemPdf(options: PoemPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(options.title);
  doc.setAuthor('SintGPT');
  doc.setCreator('SintGPT');

  const paper = await doc.embedJpg(options.paper);
  const textFont = await doc.embedFont(options.textFont, { subset: true });
  const capFont = await doc.embedFont(options.capFont, { subset: true });

  const layout = layoutPoem(
    options.poem,
    (text, size) => textFont.widthOfTextAtSize(text, size),
    (text, size) => capFont.widthOfTextAtSize(text, size),
  );
  const { fontSize, lineHeight, dropCap } = layout;
  // Centres the text in its line, as a browser does with a large line height.
  const baselineOffset = (lineHeight + fontSize * 0.6) / 2;
  const rowY = (index: number) =>
    PAGE.height - TEXT_AREA.top - index * lineHeight - baselineOffset;

  layout.pages.forEach((rows, pageIndex) => {
    const page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawImage(paper, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });

    if (pageIndex === 0 && dropCap) {
      page.drawText(dropCap.letter, {
        x: TEXT_AREA.left,
        y: rowY(CAP_ROWS - 1),
        size: dropCap.size,
        font: capFont,
        color: WINE,
      });
    }
    rows.forEach((row, rowIndex) => {
      if (!row.text) return;
      page.drawText(row.text, {
        x: TEXT_AREA.left + row.indent,
        y: rowY(rowIndex),
        size: fontSize,
        font: textFont,
        color: INK,
      });
    });

    if (pageIndex === layout.pages.length - 1) {
      const size = 10;
      page.drawText(options.attribution, {
        x: (PAGE.width - textFont.widthOfTextAtSize(options.attribution, size)) / 2,
        y: 76,
        size,
        font: textFont,
        color: WINE,
        opacity: 0.7,
      });
    }
  });

  return doc.save();
}

/** A safe file name, for example sinterklaasgedicht-oma-truus.pdf. */
export function poemPdfFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `sinterklaasgedicht-${slug}.pdf` : 'sinterklaasgedicht.pdf';
}
