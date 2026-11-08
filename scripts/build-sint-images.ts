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
