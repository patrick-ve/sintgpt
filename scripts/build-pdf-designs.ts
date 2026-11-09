/**
 * Renders the backgrounds of the poem PDF designs to public/pdf/<id>.jpg.
 * The parchment (paper.jpg) comes from scripts/build-pdf-paper.ts instead.
 * Keep the empty spaces in line with `area` in utils/pdfDesigns.ts, and never
 * put text or the site name on a background.
 *
 *   npm run build:pdf-designs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A4 in PDF points; one SVG unit is one point.
const W = 595;
const H = 842;
const SCALE = 2.5;

/** A fixed sequence of numbers from 0 to 1, so every build draws the same picture. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

// ---------------------------------------------------------------- pakjesavond

function sparkle(x: number, y: number, size: number) {
  const s = size;
  const t = size * 0.22;
  return `<path d="M${x} ${y - s} L${x + t} ${y - t} L${x + s} ${y} L${x + t} ${y + t} L${x} ${y + s} L${x - t} ${y + t} L${x - s} ${y} L${x - t} ${y - t} Z" fill="#e8c25f"/>`;
}

function house(x: number, w: number, h: number, kind: number, rnd: () => number): string {
  const base = H + 2;
  const top = H - h;
  let outline: string;
  if (kind === 0) {
    // Stepped gable (trapgevel).
    const steps = 4;
    const stepW = w / (steps * 2 + 1);
    const stepH = 13;
    const points: string[] = [`${x},${base}`, `${x},${top}`];
    for (let i = 0; i < steps; i += 1) {
      const sx = x + stepW * i;
      const sy = top - stepH * i;
      points.push(`${sx},${sy}`, `${sx},${sy - stepH}`, `${sx + stepW},${sy - stepH}`);
    }
    const peakY = top - stepH * steps;
    points.push(`${x + stepW * steps},${peakY}`, `${x + stepW * (steps + 1)},${peakY}`);
    for (let i = steps - 1; i >= 0; i -= 1) {
      const sx = x + w - stepW * i;
      const sy = top - stepH * i;
      points.push(`${sx - stepW},${sy - stepH}`, `${sx},${sy - stepH}`, `${sx},${sy}`);
    }
    points.push(`${x + w},${top}`, `${x + w},${base}`);
    outline = `<polygon points="${points.map(p => p.split(',').map(Number).map(round).join(',')).join(' ')}"/>`;
  } else if (kind === 1) {
    // Neck gable (halsgevel) with a round top.
    const neck = w * 0.42;
    const nx = x + (w - neck) / 2;
    const shoulder = top - 14;
    const neckTop = shoulder - 34;
    outline = `<path d="M${x} ${base} L${x} ${top} Q${x} ${shoulder} ${nx} ${shoulder} L${nx} ${neckTop} Q${x + w / 2} ${neckTop - 22} ${nx + neck} ${neckTop} L${nx + neck} ${shoulder} Q${x + w} ${shoulder} ${x + w} ${top} L${x + w} ${base} Z"/>`;
  } else {
    // Pointed roof with a chimney.
    const peak = top - w * 0.45;
    const cx = x + w * 0.68;
    outline = `<polygon points="${round(x - 4)},${top} ${round(x + w / 2)},${round(peak)} ${round(x + w + 4)},${top} ${x + w},${base} ${x},${base}"/>
      <rect x="${round(cx)}" y="${round(peak + 4)}" width="12" height="${round((top - peak) * 0.55)}"/>`;
  }

  const windows: string[] = [];
  const cols = w > 80 ? 3 : 2;
  const gap = w / (cols + 1);
  for (let row = 0; top + 22 + row * 36 < H - 30; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      const lit = rnd() < 0.28;
      windows.push(`<rect x="${round(x + gap * col - 5)}" y="${round(top + 22 + row * 36)}" width="10" height="15" rx="1" fill="${lit ? '#f2c66d' : '#16213f'}"${lit ? ' opacity="0.92"' : ''}/>`);
    }
  }
  return `<g fill="#060b1c">${outline}</g>${windows.join('')}`;
}

function pakjesavond(): string {
  const rnd = random(5122026);
  const stars: string[] = [];
  for (let i = 0; i < 170; i += 1) {
    const x = rnd() * W;
    const y = 30 + rnd() * 600;
    const size = 0.35 + rnd() * 0.95;
    const opacity = 0.25 + rnd() * 0.6;
    if (x > 440 && y < 140) continue; // the moon
    // Behind the poem only a few faint stars, so they never look like punctuation.
    const behindText = x > 80 && x < W - 80 && y > 120 && y < 640;
    if (behindText && rnd() < 0.8) continue;
    stars.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${round(behindText ? Math.min(size, 0.6) : size)}" fill="#fff" opacity="${round(behindText ? Math.min(opacity, 0.3) : opacity)}"/>`);
  }
  const sparkles = [[64, 92, 7], [118, 58, 4], [548, 214, 5], [42, 330, 4], [556, 470, 6], [38, 560, 5], [300, 50, 3.5]]
    .map(([x, y, s]) => sparkle(x!, y!, s!)).join('');

  const houses: string[] = [];
  let x = -14;
  let kind = 0;
  while (x < W + 10) {
    const w = 64 + Math.floor(rnd() * 40);
    const h = 120 + Math.floor(rnd() * 48);
    houses.push(house(x, w, h, kind % 3, rnd));
    x += w - 1;
    kind += 1 + Math.floor(rnd() * 2);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a1230"/>
      <stop offset="0.65" stop-color="#16244d"/>
      <stop offset="1" stop-color="#26376a"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#f6e6b4" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#f6e6b4" stop-opacity="0"/>
    </radialGradient>
    <mask id="crescent">
      <circle cx="505" cy="82" r="30" fill="#fff"/>
      <circle cx="519" cy="71" r="27" fill="#000"/>
    </mask>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars.join('')}
  ${sparkles}
  <circle cx="505" cy="82" r="80" fill="url(#glow)"/>
  <circle cx="505" cy="82" r="30" fill="#f6e6b4" mask="url(#crescent)"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#e8c25f" stroke-opacity="0.5" stroke-width="0.8"/>
  <rect x="27" y="27" width="${W - 54}" height="${H - 54}" fill="none" stroke="#e8c25f" stroke-opacity="0.25" stroke-width="0.6"/>
  ${houses.join('')}
</svg>`;
}

// ---------------------------------------------------------------- cadeaupapier

function star(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? r * 0.45 : r;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${round(cx + radius * Math.cos(angle))},${round(cy + radius * Math.sin(angle))}`);
  }
  return `<polygon points="${points.join(' ')}"/>`;
}

function cadeaupapier(): string {
  const card = { x: 44, y: 60, w: W - 88, h: H - 120 };
  const mid = W / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="paper" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
      <rect width="64" height="64" fill="#b51f2e"/>
      <path d="M-8 72 L72 -8" stroke="#ffffff" stroke-opacity="0.05" stroke-width="10"/>
      <g fill="#e2b453">${star(16, 16, 6)}${star(48, 48, 4)}</g>
      <circle cx="48" cy="16" r="1.8" fill="#fff4dc" opacity="0.85"/>
      <circle cx="16" cy="48" r="1.8" fill="#fff4dc" opacity="0.85"/>
    </pattern>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0cf6e"/>
      <stop offset="0.5" stop-color="#d4a23a"/>
      <stop offset="1" stop-color="#a87a20"/>
    </linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a87a20"/>
      <stop offset="0.5" stop-color="#ecc864"/>
      <stop offset="1" stop-color="#a87a20"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/>

  <rect x="${mid - 14}" y="0" width="28" height="${H}" fill="url(#band)"/>

  <rect x="${card.x + 2}" y="${card.y + 5}" width="${card.w}" height="${card.h}" rx="6" fill="#3a0510" opacity="0.45" filter="url(#shadow)"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="6" fill="#fffaf0"/>
  <rect x="${card.x + 12}" y="${card.y + 12}" width="${card.w - 24}" height="${card.h - 24}" rx="3" fill="none" stroke="#c9a24a" stroke-width="1.2"/>
  <rect x="${card.x + 16}" y="${card.y + 16}" width="${card.w - 32}" height="${card.h - 32}" rx="2" fill="none" stroke="#c9a24a" stroke-opacity="0.45" stroke-width="0.6"/>
  <g fill="#c9a24a">
    ${[[card.x + 12, card.y + 12], [card.x + card.w - 12, card.y + 12], [card.x + 12, card.y + card.h - 12], [card.x + card.w - 12, card.y + card.h - 12]]
      .map(([cx, cy]) => `<path d="M${cx} ${cy! - 5} L${cx! + 5} ${cy} L${cx} ${cy! + 5} L${cx! - 5} ${cy} Z"/>`).join('')}
    <path d="M${mid - 40} ${card.y + card.h - 44} L${mid - 8} ${card.y + card.h - 44}" stroke="#c9a24a" stroke-width="0.8"/>
    <path d="M${mid + 8} ${card.y + card.h - 44} L${mid + 40} ${card.y + card.h - 44}" stroke="#c9a24a" stroke-width="0.8"/>
    <path d="M${mid} ${card.y + card.h - 49} L${mid + 5} ${card.y + card.h - 44} L${mid} ${card.y + card.h - 39} L${mid - 5} ${card.y + card.h - 44} Z"/>
  </g>

  <g stroke="#8a6215" stroke-width="0.8">
    <path d="M${mid - 6} 68 C ${mid - 30} 96, ${mid - 34} 112, ${mid - 46} 128 L ${mid - 30} 124 L ${mid - 26} 136 C ${mid - 18} 116, ${mid - 10} 96, ${mid + 2} 70 Z" fill="url(#gold)"/>
    <path d="M${mid + 6} 68 C ${mid + 30} 96, ${mid + 34} 112, ${mid + 46} 128 L ${mid + 30} 124 L ${mid + 26} 136 C ${mid + 18} 116, ${mid + 10} 96, ${mid - 2} 70 Z" fill="url(#gold)"/>
    <path d="M${mid} 64 C ${mid - 22} 30, ${mid - 72} 26, ${mid - 76} 52 C ${mid - 78} 76, ${mid - 30} 82, ${mid} 64 Z" fill="url(#gold)"/>
    <path d="M${mid} 64 C ${mid + 22} 30, ${mid + 72} 26, ${mid + 76} 52 C ${mid + 78} 76, ${mid + 30} 82, ${mid} 64 Z" fill="url(#gold)"/>
    <path d="M${mid - 6} 62 C ${mid - 26} 44, ${mid - 56} 42, ${mid - 62} 54" fill="none" stroke-opacity="0.6"/>
    <path d="M${mid + 6} 62 C ${mid + 26} 44, ${mid + 56} 42, ${mid + 62} 54" fill="none" stroke-opacity="0.6"/>
    <ellipse cx="${mid}" cy="64" rx="11" ry="10" fill="url(#gold)"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------- schoolschrift

function schoolschrift(): string {
  const holes = [0.14, 0.38, 0.62, 0.86].map(f => Math.round(H * f));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.35  0 0 0 0.06 0"/>
    </filter>
    <radialGradient id="hole">
      <stop offset="0.7" stop-color="#e3ded2"/>
      <stop offset="1" stop-color="#cfc8b8"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#fdfcf6"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  <line x1="80" y1="0" x2="80" y2="${H}" stroke="#e2737b" stroke-opacity="0.8" stroke-width="0.8"/>
  <line x1="83.5" y1="0" x2="83.5" y2="${H}" stroke="#e2737b" stroke-opacity="0.8" stroke-width="0.8"/>
  ${holes.map(y => `<circle cx="28" cy="${y}" r="8.5" fill="url(#hole)"/>`).join('')}
</svg>`;
}

// ---------------------------------------------------------------- main

const DESIGNS: Record<string, () => string> = { pakjesavond, cadeaupapier, schoolschrift };

async function main() {
  for (const [id, draw] of Object.entries(DESIGNS)) {
    const outFile = path.join(root, `public/pdf/${id}.jpg`);
    await sharp(Buffer.from(draw()), { density: 72 * SCALE })
      .resize(Math.round(W * SCALE), Math.round(H * SCALE))
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outFile);
    const { size } = await fs.stat(outFile);
    console.log(`public/pdf/${id}.jpg (${Math.round(size / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
