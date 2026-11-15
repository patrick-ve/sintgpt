/**
 * Crops public/sint.png (1536x1024) to every size the app uses. Run this after
 * replacing the photo, then run build:og for the Open Graph images.
 *
 *   tsx scripts/build-sint-images.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SINT_PORTRAIT } from './og-images';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/sint.png');

/** Head, mitre and gesture, for avatars. */
const SINT_SQUARE = { left: 300, top: 0, width: 880, height: 880 };
/**
 * Portrait (4:5) for the arched photo in the home page hero. It fits in the
 * style photos too (see STYLE_SCALE), so the photo does not jump when the
 * visitor picks a style.
 */
const SINT_HERO = { left: 454, top: 0, width: 691, height: 864 };
/** Square for the small style avatar in the form; fits in the style photos. */
const SINT_STYLE_SQUARE = { left: 308, top: 0, width: 864, height: 864 };

/**
 * One photo per poem style (scripts/sint-styles/<style>.jpg), made from
 * public/sint.png with GPT Image 2.5 Sunburst in ElevenLabs (Nov 2026).
 * They are 1280x720: the original scaled by 1280/1536 with the bottom cut
 * off, so a region of the original scales by this factor. Klassiek and
 * Grappig use public/sint.png itself: their hero is sint-hero-*.webp, and
 * only the form avatar is made here (classic-176.webp).
 */
const STYLE_SCALE = 1280 / 1536;
export const SINT_STYLES = ['classic', 'ironic', 'old-fashioned', 'spicy', 'roast'] as const;

function styleCrop(style: (typeof SINT_STYLES)[number], region: typeof SINT_PORTRAIT) {
  if (style === 'classic') return sharp(source).extract(region);
  const scaled = Object.fromEntries(Object.entries(region).map(([key, value]) => [key, Math.round(value * STYLE_SCALE)])) as typeof region;
  return sharp(path.join(root, 'scripts/sint-styles', `${style}.jpg`)).extract(scaled);
}
/** Face and mitre only, so a small icon stays readable. */
const SINT_ICON = { left: 480, top: 90, width: 560, height: 560 };

function crop(region: typeof SINT_PORTRAIT) {
  return sharp(source).extract(region);
}

/** An ICO file that holds one PNG, which all current browsers support. */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

async function main() {
  await crop(SINT_PORTRAIT)
    .resize(400, 630)
    // resvg stores this photo in a PNG, which compresses detail poorly. A light
    // source keeps the share image small enough for link previews.
    .jpeg({ quality: 65, mozjpeg: true })
    .toFile(path.join(root, 'server/assets/share/sint.jpg'));

  await crop(SINT_SQUARE)
    .resize(352, 352)
    .webp({ quality: 80 })
    .toFile(path.join(root, 'public/sint-352.webp'));

  for (const width of [400, 600, 800]) {
    await crop(SINT_HERO)
      .resize(width, Math.round(width * 1.25))
      .webp({ quality: 78 })
      .toFile(path.join(root, `public/sint-hero-${width}.webp`));
  }

  // The hero photo and the form avatar per poem style (utils/sintStyles.ts).
  await fs.mkdir(path.join(root, 'public/sint-styles'), { recursive: true });
  for (const style of SINT_STYLES) {
    for (const width of style === 'classic' ? [] : [400, 600, 800]) {
      await styleCrop(style, SINT_HERO)
        .resize(width, Math.round(width * 1.25))
        .webp({ quality: 78 })
        .toFile(path.join(root, `public/sint-styles/${style}-${width}.webp`));
    }
    await styleCrop(style, SINT_STYLE_SQUARE)
      .resize(176, 176)
      .webp({ quality: 80 })
      .toFile(path.join(root, `public/sint-styles/${style}-176.webp`));
  }

  for (const [name, size] of [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['favicon-192x192.png', 192],
    ['apple-touch-icon.png', 180],
  ] as const) {
    await crop(SINT_ICON).resize(size, size).png().toFile(path.join(root, 'public', name));
  }

  const ico = await crop(SINT_ICON).resize(32, 32).png().toBuffer();
  await fs.writeFile(path.join(root, 'public/favicon.ico'), pngToIco(ico, 32));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
