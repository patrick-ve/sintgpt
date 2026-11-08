/**
 * Renders the Open Graph images listed in scripts/og-images.ts to
 * public/og/<name>.jpg (1200x630).
 *
 *   npm run build:og
 *
 * Rendering happens at 2x and is downscaled, and the JPEG keeps full
 * chroma (4:4:4), so gold and red text stays crisp in small previews.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { OG_IMAGES, SINT_PORTRAIT, type OgImageSpec } from './og-images';

const WIDTH = 1200;
const HEIGHT = 630;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/og');

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Gift mark, matching the 🎁 logo in the site header, as SVG so it renders
// the same on every machine (emoji fonts differ per OS).
const giftIcon = `
<svg viewBox="0 0 64 64" aria-hidden="true">
  <rect x="10" y="28" width="44" height="28" rx="3" fill="#8b1538"/>
  <rect x="7" y="19" width="50" height="11" rx="3" fill="#a61d45"/>
  <rect x="28" y="19" width="8" height="37" fill="#f4cd60"/>
  <path d="M32 19c-4-9-15-11-15-4 0 4 7 5 15 4zm0 0c4-9 15-11 15-4 0 4-7 5-15 4z"
        fill="none" stroke="#f4cd60" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const sparkle = (cls: string) => `
<svg class="sparkle ${cls}" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z"/>
</svg>`;

function body(spec: OgImageSpec): string {
  if (spec.kind === 'home') {
    return `
      <div class="brand">${giftIcon}<span>SintGPT</span></div>
      <p class="hook">${escape(spec.hook)}</p>
      <h1 class="headline">${escape(spec.headline).replace(' ', '<br>')}</h1>
      <p class="pill">${escape(spec.claim)}</p>`;
  }
  return `
    <div class="brand brand-small">${giftIcon}<span>SintGPT</span><em>Blog</em></div>
    <h1 class="title" data-fit>${escape(spec.title)}</h1>
    <p class="subtitle">${escape(spec.subtitle)}</p>`;
}

function html(spec: OgImageSpec, sintDataUrl: string): string {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Texturina:opsz,wght@12..72,500;12..72,700&family=Alegreya:ital,wght@0,400;0,500;1,400&family=Alegreya+Sans:wght@500;700&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --gold: #f4cd60;
    --gold-deep: #d4a853;
    --cream: #fbf1dc;
    --wine: #8b1538;
  }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden;
    background:
      radial-gradient(ellipse 70% 90% at 28% 45%, #a01a42 0%, #7d1233 45%, #4f0a20 100%);
    color: var(--cream);
    font-family: 'Alegreya', Georgia, serif;
    position: relative;
  }
  /* faint wrapping-paper dots */
  body::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(244,205,96,.07) 1.5px, transparent 1.6px);
    background-size: 28px 28px;
  }
  .frame {
    position: absolute; inset: 22px 432px 40px 22px;
    border: 1.5px solid rgba(244,205,96,.35);
  }
  .frame::before, .frame::after {
    content: ''; position: absolute; width: 56px; height: 56px;
    border: 3px solid var(--gold);
  }
  .frame::before { top: -6px; left: -6px; border-right: 0; border-bottom: 0; }
  .frame::after { bottom: -6px; right: -6px; border-left: 0; border-top: 0; }
  .band {
    position: absolute; left: 0; right: 0; bottom: 0; height: 18px;
    background: repeating-linear-gradient(90deg, var(--gold) 0 22px, var(--gold-deep) 22px 44px);
  }

  .content {
    position: absolute; left: 80px; top: 64px; bottom: 82px; width: 640px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .brand {
    display: flex; align-items: center; gap: 16px;
    font-family: 'Texturina', serif; font-weight: 700;
    font-size: 40px; color: var(--gold); letter-spacing: .02em;
  }
  .brand svg {
    width: 60px; height: 60px; padding: 9px; border-radius: 50%;
    background: linear-gradient(135deg, #fbe08a, var(--gold-deep));
    box-shadow: 0 4px 14px rgba(0,0,0,.35);
  }
  .brand em {
    font-family: 'Alegreya Sans', sans-serif; font-style: normal; font-weight: 700;
    font-size: .62em; letter-spacing: .05em; color: var(--cream);
    padding-left: 16px; margin-left: 2px; border-left: 2px solid rgba(244,205,96,.5);
  }
  .brand-small { font-size: 34px; }
  .brand-small svg { width: 52px; height: 52px; padding: 8px; }

  .hook {
    margin-top: 40px; font-style: italic; font-size: 46px; line-height: 1.1;
    color: var(--cream);
  }
  .headline {
    margin-top: 6px; font-family: 'Texturina', serif; font-weight: 700;
    font-size: 104px; line-height: .98; letter-spacing: -.01em;
    background: linear-gradient(180deg, #fff1b8 0%, var(--gold) 45%, #c99a3c 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    filter: drop-shadow(0 4px 0 rgba(60,5,20,.55));
  }
  .pill {
    margin-top: 34px; align-self: flex-start;
    font-family: 'Alegreya Sans', sans-serif; font-weight: 700; font-size: 29px;
    color: #3d0716; background: linear-gradient(135deg, #fbe08a, var(--gold-deep));
    padding: 12px 28px; border-radius: 999px;
    box-shadow: 0 6px 18px rgba(0,0,0,.3);
  }

  .title {
    margin-top: 38px; font-family: 'Texturina', serif; font-weight: 700;
    font-size: 62px; line-height: 1.08; color: var(--cream);
    hyphens: manual; overflow-wrap: normal;
    text-shadow: 0 3px 0 rgba(60,5,20,.5);
  }
  .subtitle {
    margin-top: 26px; font-style: italic; font-size: 34px; line-height: 1.2;
    color: var(--gold);
  }

  /* The photo fills about a third of the width, inside a gold border. */
  .portrait {
    position: absolute; top: 22px; right: 22px; bottom: 40px; width: 388px;
    border: 6px solid var(--gold);
    box-shadow: 0 12px 34px rgba(0,0,0,.4);
  }
  .portrait img { display: block; width: 100%; height: 100%; object-fit: cover; }

  .sparkle { position: absolute; fill: var(--gold); opacity: .85; }
  .s1 { width: 30px; top: 70px; right: 470px; }
  .s2 { width: 18px; top: 120px; right: 450px; opacity: .6; }
  .s3 { width: 22px; bottom: 90px; right: 460px; opacity: .55; }
</style>
</head>
<body class="${spec.kind}">
  <div class="frame"></div>
  <div class="band"></div>
  ${sparkle('s1')}${sparkle('s2')}${sparkle('s3')}
  <div class="content">${body(spec)}</div>
  <div class="portrait"><img src="${sintDataUrl}" alt=""></div>
  <script>
    // Shrink long titles until they fit in three lines without overflow.
    window.fitTitles = () => {
      for (const el of document.querySelectorAll('[data-fit]')) {
        let size = parseFloat(getComputedStyle(el).fontSize);
        const lineHeight = () => parseFloat(getComputedStyle(el).lineHeight);
        while (size > 36 && (el.scrollWidth > el.clientWidth
          || el.getBoundingClientRect().height > lineHeight() * 3 + 1)) {
          size -= 2;
          el.style.fontSize = size + 'px';
        }
      }
    };
  </script>
</body>
</html>`;
}

async function main() {
  // Embed a small copy of the photo so rendering stays fast.
  const sint = await sharp(path.join(root, 'public/sint.png'))
    .extract(SINT_PORTRAIT)
    .jpeg({ quality: 90 })
    .toBuffer();
  const sintDataUrl = `data:image/jpeg;base64,${sint.toString('base64')}`;

  await fs.mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

    for (const spec of OG_IMAGES) {
      await page.setContent(html(spec, sintDataUrl), { waitUntil: 'load', timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready);

      const fontsOk = await page.evaluate(() =>
        ['700 20px Texturina', 'italic 20px Alegreya', '700 20px "Alegreya Sans"']
          .every(f => document.fonts.check(f)));
      if (!fontsOk) throw new Error('Web fonts did not load (offline?)');

      await page.evaluate(() => (window as any).fitTitles());

      const png = await page.screenshot({ type: 'png' });
      const outFile = path.join(outDir, `${spec.name}.jpg`);
      await sharp(png)
        .resize(WIDTH, HEIGHT, { kernel: 'lanczos3' })
        .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toFile(outFile);

      const { size } = await fs.stat(outFile);
      console.log(`✔ public/og/${spec.name}.jpg (${Math.round(size / 1024)} KB)`);
    }
  }
  finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
