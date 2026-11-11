/**
 * Builds a PDF of a different example poem in every design and saves page 1
 * as a picture for the carousel on the home page
 * (public/pdf/showcase/<design>.webp). Which poem goes on which design is in
 * utils/pdfShowcase.ts. Needs pdftoppm (Poppler: `brew install poppler`).
 *
 *   npm run build:pdf-showcase
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { EXAMPLE_POEMS } from '../utils/examplePoems';
import { PDF_DESIGNS } from '../utils/pdfDesigns';
import { PDF_SHOWCASE, PDF_SHOWCASE_WIDTH, pdfShowcaseImage } from '../utils/pdfShowcase';
import { buildPoemPdf } from '../utils/poemPdf';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const asset = (publicPath: string) => fs.readFile(path.join(root, 'public', publicPath));

async function main() {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-showcase-'));
  await fs.mkdir(path.join(root, 'public/pdf/showcase'), { recursive: true });

  try {
    for (const { design: id, exampleId } of PDF_SHOWCASE) {
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
      const pdfFile = path.join(work, `${id}.pdf`);
      await fs.writeFile(pdfFile, bytes);

      // Render at about 2x the target size, then scale down for sharp text.
      const pngBase = path.join(work, id);
      await run('pdftoppm', ['-png', '-r', '144', '-f', '1', '-l', '1', '-singlefile', pdfFile, pngBase]);

      const outFile = path.join(root, 'public', pdfShowcaseImage(id));
      await sharp(`${pngBase}.png`).resize(PDF_SHOWCASE_WIDTH).webp({ quality: 74, effort: 6 }).toFile(outFile);
      const { size } = await fs.stat(outFile);
      console.log(`public${pdfShowcaseImage(id)} (${Math.round(size / 1024)} KB, ${exampleId})`);
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
