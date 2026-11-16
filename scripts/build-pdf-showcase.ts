/**
 * Builds a real PDF of example poems and saves page 1 as a picture:
 * - the carousel on the home page: a different poem in every design
 *   (public/pdf/showcase/<design>.webp, pairs in utils/pdfShowcase.ts);
 * - /voorbeelden: every example poem in its design
 *   (public/pdf/examples/<id>-<width>.webp, designs in utils/exampleSheets.ts).
 * Needs pdftoppm (Poppler: `brew install poppler`).
 *
 *   npm run build:pdf-showcase
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { EXAMPLE_POEMS } from '../utils/examplePoems';
import { EXAMPLE_SHEET_DESIGNS, EXAMPLE_SHEET_WIDTHS, exampleSheetImage } from '../utils/exampleSheets';
import { PDF_DESIGNS, type PdfDesignId } from '../utils/pdfDesigns';
import { PDF_SHOWCASE, PDF_SHOWCASE_WIDTH, pdfShowcaseImage } from '../utils/pdfShowcase';
import { buildPoemPdf } from '../utils/poemPdf';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const asset = (publicPath: string) => fs.readFile(path.join(root, 'public', publicPath));

/** Renders page 1 of the example in the design and writes one WebP per output. */
async function renderPage(
  work: string,
  exampleId: string,
  id: PdfDesignId,
  outputs: { publicPath: string; width: number }[],
) {
  const example = EXAMPLE_POEMS.find(item => item.id === exampleId);
  if (!example) throw new Error(`No example poem ${exampleId}`);
  const design = PDF_DESIGNS[id];
  const bytes = await buildPoemPdf({
    poem: example.poem,
    title: `Sinterklaasgedicht voor ${example.request.name}`,
    design,
    background: await asset(design.background),
    textFont: await asset(design.textFont),
    capFont: design.capFont ? await asset(design.capFont) : undefined,
  });
  // The picture shows page 1 only, so the whole poem must be on it.
  const pages = (await PDFDocument.load(bytes)).getPageCount();
  if (pages !== 1) throw new Error(`${exampleId} in ${id} takes ${pages} pages`);

  const base = `${exampleId}-${id}`;
  const pdfFile = path.join(work, `${base}.pdf`);
  await fs.writeFile(pdfFile, bytes);

  // Render at about 2x the largest size, then scale down for sharp text.
  const largest = Math.max(...outputs.map(output => output.width));
  const dpi = String(Math.max(144, Math.ceil((largest * 2 * 72) / 595)));
  const pngBase = path.join(work, base);
  await run('pdftoppm', ['-png', '-r', dpi, '-f', '1', '-l', '1', '-singlefile', pdfFile, pngBase]);

  for (const { publicPath, width } of outputs) {
    const outFile = path.join(root, 'public', publicPath);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await sharp(`${pngBase}.png`).resize(width).webp({ quality: 74, effort: 6 }).toFile(outFile);
    const { size } = await fs.stat(outFile);
    console.log(`public${publicPath} (${Math.round(size / 1024)} KB, ${exampleId})`);
  }
}

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-showcase-'));
  try {
    for (const { design, exampleId } of PDF_SHOWCASE) {
      await renderPage(work, exampleId, design, [{ publicPath: pdfShowcaseImage(design), width: PDF_SHOWCASE_WIDTH }]);
    }
    for (const [exampleId, design] of Object.entries(EXAMPLE_SHEET_DESIGNS)) {
      await renderPage(work, exampleId, design, EXAMPLE_SHEET_WIDTHS.map(width => ({
        publicPath: exampleSheetImage(exampleId, width),
        width,
      })));
    }
  }
  finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
