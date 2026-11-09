/**
 * Builds a PDF of an example poem in every design and saves page 1 as the
 * preview picture for the design choice (public/pdf/previews/<id>.jpg).
 * Needs pdftoppm (Poppler: `brew install poppler`).
 *
 *   npm run build:pdf-previews                  # the small pictures for the site
 *   npx tsx scripts/build-pdf-previews.ts <dir> # full-size PDFs and PNGs to review
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { EXAMPLE_POEMS } from '../utils/examplePoems';
import { PDF_DESIGNS, PDF_DESIGN_IDS } from '../utils/pdfDesigns';
import { buildPoemPdf } from '../utils/poemPdf';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const asset = (publicPath: string) => fs.readFile(path.join(root, 'public', publicPath));

/** Preview width in pixels; the page shows it at about half. */
const PREVIEW_WIDTH = 320;

async function main() {
  const reviewDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
  const example = EXAMPLE_POEMS.find(item => item.id === 'opa-kees')!;
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-previews-'));
  const outDir = path.join(root, 'public/pdf/previews');
  await fs.mkdir(reviewDir ?? outDir, { recursive: true });

  try {
    for (const id of PDF_DESIGN_IDS) {
      const design = PDF_DESIGNS[id];
      const bytes = await buildPoemPdf({
        poem: example.poem,
        title: `Sinterklaasgedicht voor ${example.request.name}`,
        design,
        background: await asset(design.background),
        textFont: await asset(design.textFont),
        capFont: design.capFont ? await asset(design.capFont) : undefined,
      });
      const pdfFile = path.join(reviewDir ?? work, `${id}.pdf`);
      await fs.writeFile(pdfFile, bytes);

      const pngBase = path.join(work, id);
      await run('pdftoppm', ['-png', '-r', reviewDir ? '110' : '60', '-f', '1', '-l', '1', '-singlefile', pdfFile, pngBase]);

      if (reviewDir) {
        await fs.copyFile(`${pngBase}.png`, path.join(reviewDir, `${id}.png`));
        console.log(`${path.join(reviewDir, id)}.pdf / .png`);
      } else {
        const outFile = path.join(outDir, `${id}.jpg`);
        await sharp(`${pngBase}.png`).resize(PREVIEW_WIDTH).jpeg({ quality: 78, mozjpeg: true }).toFile(outFile);
        const { size } = await fs.stat(outFile);
        console.log(`public/pdf/previews/${id}.jpg (${Math.round(size / 1024)} KB)`);
      }
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
