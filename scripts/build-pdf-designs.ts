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

// ---------------------------------------------------------------- goudfolie (Hele familie)

function fan(cx: number, cy: number, rotate: number) {
  const arcs = [14, 24, 34].map(r => `<path d="M${r} 0 A${r} ${r} 0 0 1 0 ${r}" fill="none" stroke="url(#foil)" stroke-width="1.2"/>`).join('');
  const rays = [15, 45, 75].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return `<line x1="0" y1="0" x2="${round(34 * Math.cos(rad))}" y2="${round(34 * Math.sin(rad))}" stroke="#d4a23a" stroke-width="0.8"/>`;
  }).join('');
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate})">${arcs}${rays}</g>`;
}

function goudfolie(): string {
  const mid = W / 2;
  const inset = 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="velvet" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#6a1229"/>
      <stop offset="0.65" stop-color="#4a0c1d"/>
      <stop offset="1" stop-color="#2c0611"/>
    </radialGradient>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6dc8c"/>
      <stop offset="0.45" stop-color="#d4a23a"/>
      <stop offset="0.7" stop-color="#f0cf6e"/>
      <stop offset="1" stop-color="#a87a20"/>
    </linearGradient>
    <pattern id="damask" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M18 6 L22 18 L18 30 L14 18 Z" fill="#e8c25f" opacity="0.06"/>
      <circle cx="0" cy="0" r="1.4" fill="#e8c25f" opacity="0.1"/>
      <circle cx="36" cy="36" r="1.4" fill="#e8c25f" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#velvet)"/>
  <rect width="${W}" height="${H}" fill="url(#damask)"/>

  <rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" fill="none" stroke="url(#foil)" stroke-width="2"/>
  <rect x="${inset + 7}" y="${inset + 7}" width="${W - inset * 2 - 14}" height="${H - inset * 2 - 14}" fill="none" stroke="url(#foil)" stroke-width="0.7" stroke-opacity="0.7"/>
  ${fan(inset + 7, inset + 7, 0)}
  ${fan(W - inset - 7, inset + 7, 90)}
  ${fan(W - inset - 7, H - inset - 7, 180)}
  ${fan(inset + 7, H - inset - 7, 270)}

  <g transform="translate(${mid} 0)">
    <path d="M-24 128 L-24 96 Q-24 66 0 48 Q24 66 24 96 L24 128 Z" fill="url(#foil)"/>
    <path d="M-24 116 L24 116" stroke="#4a0c1d" stroke-width="2.4"/>
    <path d="M-2.4 70 H2.4 V80 H10 V84.8 H2.4 V104 H-2.4 V84.8 H-10 V80 H-2.4 Z" fill="#4a0c1d"/>
    <path d="M-70 106 H-38 M38 106 H70" stroke="#d4a23a" stroke-width="0.9"/>
    <path d="M-34 106 L-30 102 L-26 106 L-30 110 Z M26 106 L30 102 L34 106 L30 110 Z" fill="url(#foil)"/>
  </g>

  <g transform="translate(${mid} ${H - 74})">
    <path d="M-90 0 H-12 M12 0 H90" stroke="#d4a23a" stroke-width="0.9"/>
    <path d="M0 -6 L6 0 L0 6 L-6 0 Z" fill="url(#foil)"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------- stoomboot (Hele familie)

function stoomboot(): string {
  const rnd = random(5);
  const waves = [0, 1, 2, 3, 4].map((row) => {
    const y = 728 + row * 24;
    const amp = 5 + row;
    const len = 46 + row * 8;
    let d = `M0 ${y}`;
    for (let x = 0; x <= W + len; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
    d += ` V${H} H0 Z`;
    const colors = ['#5b83b5', '#3f6699', '#2f527f', '#233f66', '#1a304f'];
    return `<path d="${d}" fill="${colors[row]}"/>`;
  }).join('');
  const stars = Array.from({ length: 9 }, () => {
    const x = 40 + rnd() * (W - 80);
    const y = 34 + rnd() * 40;
    return x > 470 && y < 90 ? '' : sparkle(round(x), round(y), round(2 + rnd() * 2.5)).replace('#e8c25f', '#d4a23a');
  }).join('');
  const flags = ['#b51f2e', '#e8c25f', '#2f527f', '#b51f2e', '#e8c25f', '#2f527f', '#b51f2e'];
  const bunting = (x1: number, y1: number, x2: number, y2: number) => flags.map((color, i) => {
    const t = (i + 0.5) / flags.length;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 10;
    return `<path d="M${round(x - 5)} ${round(y)} L${round(x + 5)} ${round(y)} L${round(x)} ${round(y + 9)} Z" fill="${color}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf5e6"/>
      <stop offset="0.75" stop-color="#f6ecd4"/>
      <stop offset="1" stop-color="#e9dcc0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <circle cx="532" cy="58" r="17" fill="#e8c25f"/>
  <circle cx="540" cy="52" r="15" fill="#fbf5e6"/>

  <g opacity="0.85">
    <circle cx="318" cy="566" r="11" fill="#d9d2c4"/>
    <circle cx="332" cy="548" r="14" fill="#e3ddd1"/>
    <circle cx="352" cy="530" r="17" fill="#ece7dd"/>
  </g>
  <line x1="196" y1="694" x2="196" y2="604" stroke="#3b2a1f" stroke-width="2"/>
  <line x1="404" y1="694" x2="404" y2="614" stroke="#3b2a1f" stroke-width="2"/>
  <line x1="196" y1="606" x2="300" y2="590" stroke="#3b2a1f" stroke-width="0.7"/>
  <line x1="322" y1="590" x2="404" y2="616" stroke="#3b2a1f" stroke-width="0.7"/>
  ${bunting(196, 606, 300, 590)}
  ${bunting(322, 590, 404, 616)}
  <rect x="300" y="584" width="22" height="58" fill="#b51f2e"/>
  <rect x="300" y="584" width="22" height="8" fill="#1d2b4f"/>
  <rect x="236" y="636" width="124" height="24" rx="2" fill="#fffaf0" stroke="#1d2b4f" stroke-width="1"/>
  <rect x="206" y="658" width="186" height="36" rx="2" fill="#fffaf0" stroke="#1d2b4f" stroke-width="1"/>
  ${[226, 252, 278, 304, 330, 356].map(x => `<circle cx="${x}" cy="676" r="5" fill="#5b83b5" stroke="#1d2b4f" stroke-width="1"/>`).join('')}
  <path d="M140 694 L460 694 L432 742 L170 742 Z" fill="#1d2b4f"/>
  <path d="M146 704 L454 704" stroke="#b51f2e" stroke-width="5"/>
  ${waves}
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#1d2b4f" stroke-opacity="0.55" stroke-width="0.8"/>
</svg>`;
}

// ---------------------------------------------------------------- main

const DESIGNS: Record<string, () => string> = { pakjesavond, cadeaupapier, schoolschrift, goudfolie, stoomboot };

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
