/**
 * Renders the empty parchment scroll to public/pdf/paper.jpg, the background of
 * the poem PDF. It uses the CSS of PaperScroll.vue, so both keep the same look.
 * Re-run after changing that component.
 *
 *   npm run build:pdf-paper
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A4 in PDF points. One CSS pixel is one point, as in utils/poemPdf.ts.
const WIDTH = 595;
const HEIGHT = 842;
const MARGIN = 24;
const ROLL_HEIGHT = 28;
const ROLL_OVERLAP = 6;
const SCALE = 2.5;

function extractStyles(component: string): string {
  const style = component.match(/<style scoped>([\s\S]*?)<\/style>/)?.[1];
  if (!style) throw new Error('PaperScroll.vue has no scoped style');
  // The PDF always has the desktop layout.
  return style.replace(/@media \(max-width: 640px\) \{[\s\S]*\n\}\s*$/, '');
}

function html(styles: string): string {
  const body = HEIGHT - 2 * MARGIN - 2 * (ROLL_HEIGHT - ROLL_OVERLAP);
  const roll = (side: string) => `
    <div class="scroll-roll scroll-roll-${side}">
      <div class="roll-shadow"></div>
      <div class="roll-highlight"></div>
      <div class="roll-wood-cap left"></div>
      <div class="roll-wood-cap right"></div>
    </div>`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Texturina:opsz,wght@12..72,700&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  :root { --font-display: 'Texturina', serif; }
  body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; padding: ${MARGIN}px; background: #fff8e7; overflow: hidden; }
  ${styles}
  .parchment-body { height: ${body}px; }
</style>
</head>
<body>
  <div class="scroll-wrapper">
    ${roll('top')}
    <div class="parchment-body">
      <div class="texture-layer fiber-texture"></div>
      <div class="texture-layer stain-texture"></div>
      <div class="texture-layer noise-texture"></div>
      <div class="vignette-overlay"></div>
      <div class="wax-seal"><div class="seal-inner">S</div></div>
      <div class="flourish top-left">❦</div>
      <div class="flourish bottom-right">❦</div>
    </div>
    ${roll('bottom')}
  </div>
</body>
</html>`;
}

async function main() {
  const component = await fs.readFile(path.join(root, 'components/PaperScroll.vue'), 'utf8');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });
    await page.setContent(html(extractStyles(component)), { waitUntil: 'load', timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    const outFile = path.join(root, 'public/pdf/paper.jpg');
    await sharp(png).jpeg({ quality: 80, mozjpeg: true }).toFile(outFile);
    const { size } = await fs.stat(outFile);
    console.log(`public/pdf/paper.jpg (${Math.round(size / 1024)} KB)`);
  }
  finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
