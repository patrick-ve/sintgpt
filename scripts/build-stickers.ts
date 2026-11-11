/**
 * Renders the guerrilla stickers (scripts/stickers.ts) to
 * marketing/stickers/<id>.png (90 x 90 mm at 300 dpi, rounded die-cut
 * corners on a transparent background) and <id>.pdf (90 x 90 mm).
 *
 *   npx tsx scripts/build-stickers.ts [out-dir] [id ...]
 *
 * The outer 3 mm is bleed: keep text and the QR code 6 mm from the edge.
 * The QR code is the only link on the sticker; each variant has its own
 * utm_campaign, so the dashboard shows which design works.
 * The photo is always the real one, without a colour tint.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { renderSVG } from 'uqr';
import { STICKERS, STICKER_DPI, STICKER_SIZE_MM, stickerUrl, type StickerSpec, type StickerTemplate } from './stickers';

const CSS_SIZE = 360; // CSS px; one CSS px is 0.25 mm
const PIXELS = Math.round((STICKER_SIZE_MM / 25.4) * STICKER_DPI); // 1063

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'marketing/stickers'));
const only = process.argv.slice(3);

// Square crop of the face. In this crop the eyes sit at (325, 340) and (450, 335).
const FACE = { left: 420, top: 60, width: 760, height: 760 };
const EYES = { x: 387.5, y: 337.5, distance: 125 };
const CHEEK = { x: 560, y: 520 };

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function qr(spec: StickerSpec, dark = '#000', light = '#fff'): string {
  return renderSVG(stickerUrl(spec), { ecc: 'M', border: 0, pixelSize: 1, blackColor: dark, whiteColor: light })
    .replace('<svg', '<svg class="qr" aria-hidden="true"');
}

const chili = (cls = '') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M50 8c2 10-1 18-6 24S31 44 21 48c-5 2-9 3-13 2 6-6 13-9 20-12s12-8 15-14 4-11 7-16z" fill="#ff2a4d"/><path d="M50 8c-1-3-4-5-8-4 3 1 5 3 6 6 1-1 2-1 2-2z" fill="#3fa34d"/></svg>`;
const flame = (cls = '') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4c2 12 14 18 14 32a14 14 0 0 1-28 0c0-6 3-10 6-14 0 6 3 9 6 9 2-9-2-17 2-27z" fill="#ff7a1a"/><path d="M32 30c1 7 7 10 7 16a7 7 0 0 1-14 0c0-4 3-6 4-9 0 3 1 5 3 5 1-4-1-8 0-12z" fill="#ffd166"/></svg>`;
/** A plain grey robot head: stands for ChatGPT without its logo. */
const bot = (cls = '') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6v10" stroke="#9a9a9a" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="6" r="4" fill="#9a9a9a"/><rect x="10" y="16" width="44" height="36" rx="10" fill="#9a9a9a"/><rect x="18" y="28" width="9" height="9" rx="2" fill="#212121"/><rect x="37" y="28" width="9" height="9" rx="2" fill="#212121"/><path d="M24 44h16" stroke="#212121" stroke-width="3" stroke-linecap="round"/><path d="M4 30v10M60 30v10" stroke="#9a9a9a" stroke-width="5" stroke-linecap="round"/></svg>`;
const cross = (color: string) => `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="${color}" stroke-width="4" stroke-linecap="round"/></svg>`;
const check = (color: string) => `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l5 5L20 6" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const icons = { pikant: chili, roast: flame, vs: bot } as const;
const kissMark = (style: string) => `<svg class="kiss" style="${style}" viewBox="0 0 100 60" aria-hidden="true"><path d="M50 22C40 8 14 10 10 28c-2 10 20 26 40 28 20-2 42-18 40-28C86 10 60 8 50 22z" fill="#e4003a"/><path d="M12 30c14-4 26-4 38 0 12-4 24-4 38 0" stroke="#8a0022" stroke-width="3" fill="none"/></svg>`;
const flames = (a: string, b: string) => `<svg class="flames" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}"/><stop offset=".55" stop-color="${a}"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient></defs>
  <path fill="url(#fg)" d="M0 120V70C20 60 25 20 40 40c10 15 15 40 30 30 15-10 10-60 30-40 15 15 10 55 30 45 20-10 15-60 35-40 15 15 10 55 30 45 20-10 15-55 35-35 15 15 10 40 30 30 20-10 15-65 35-45 15 15 10 50 30 40 15-10 20-30 35-15v120z"/>
  <path fill="${b}" opacity=".7" d="M0 120V96c15-6 20-30 32-18 8 10 10 25 20 18 10-7 8-30 20-20 8 8 8 30 20 22 12-8 10-36 25-24 10 10 8 30 22 22 12-8 12-32 26-20 10 8 8 26 22 18 12-8 12-30 26-18 10 8 8 24 22 16 12-8 12-26 26-14 10 8 10 20 24 12 12-6 20-16 30-6v16z"/>
</svg>`;

/** Sunglasses or a kiss on a face crop drawn at (left, top) with the given size. */
function onFace(face: StickerSpec['face'], left: number, top: number, size: number, rotate = -2): string {
  const s = size / 760;
  if (face === 'kiss') {
    const w = 46 * (size / 360);
    return kissMark(`left:${(left + CHEEK.x * s - w / 2).toFixed(1)}px;top:${(top + CHEEK.y * s - w * 0.3).toFixed(1)}px;width:${w.toFixed(1)}px;transform:rotate(-18deg)`);
  }
  if (face !== 'shades') return '';
  const width = EYES.distance * s * 2.1;
  const height = width / 3;
  const x = left + EYES.x * s - width / 2;
  const y = top + EYES.y * s - height / 2;
  return `<svg class="shades" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${width.toFixed(1)}px;transform:rotate(${rotate}deg)" viewBox="0 0 300 100" aria-hidden="true">
  <path d="M8 30h284" stroke="#111" stroke-width="10" stroke-linecap="round"/>
  <path d="M10 28c0 40 20 58 60 58s62-18 62-54c0-6-4-8-12-8H24c-10 0-14 2-14 4z" fill="#111"/>
  <path d="M290 28c0 40-20 58-60 58s-62-18-62-54c0-6 4-8 12-8h98c10 0 14 2 12 4z" fill="#111"/>
  <path d="M132 36c6-8 30-8 36 0" stroke="#111" stroke-width="8" fill="none"/>
  <path d="M26 36c10-6 28-8 44-2" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/>
  <path d="M196 36c10-6 28-8 44-2" stroke="#fff" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/>
</svg>`;
}

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Alegreya:ital,wght@0,400;0,700;1,400;1,700&family=Alegreya+Sans:wght@500;700;800&display=block" rel="stylesheet">`;

const base = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: transparent; }
  body { width: ${CSS_SIZE}px; height: ${CSS_SIZE}px; overflow: hidden; }
  .sticker {
    position: relative; width: ${CSS_SIZE}px; height: ${CSS_SIZE}px;
    border-radius: 26px; overflow: hidden; isolation: isolate;
    background: var(--bg); color: var(--fg);
  }
  .photo { position: absolute; overflow: hidden; }
  .photo img { display: block; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.08) saturate(1.08); }
  .photo .fade { position: absolute; inset: 0; }
  .qr-tile {
    position: absolute; background: #fff; border-radius: 10px;
    width: 98px; padding: 7px; display: flex; flex-direction: column; align-items: center; gap: 4px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35);
  }
  .qr-tile svg { display: block; width: 84px; height: 84px; }
  .scan { font: 800 10px/1 'Alegreya Sans', sans-serif; letter-spacing: .04em; white-space: nowrap; color: #111; }
  .shades, .kiss { position: absolute; }
  .kiss { filter: drop-shadow(0 2px 2px rgba(0,0,0,.4)); }
  .anton { font-family: 'Anton', sans-serif; font-weight: 400; text-transform: uppercase; }
  .head em { font-style: normal; color: var(--accent); }
  .head i.chili { display: inline-block; width: .8em; height: .8em; vertical-align: -.08em; margin-left: .06em;
    background: url("data:image/svg+xml,${encodeURIComponent(chili())}") center/contain no-repeat; }
`;

type Design = (spec: StickerSpec, face: string) => { css: string; body: string };

/** The label under every QR code. */
const SCAN = 'sintgpt.com';

const common = (_spec: StickerSpec) => ({ scan: SCAN });

const templates: Record<StickerTemplate, Design> = {
  // Big round photo bottom-right, headline top-left.
  corner: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .photo { right: -70px; top: 70px; width: 330px; height: 330px; border-radius: 50%; }
        .photo .fade { background: radial-gradient(circle at 60% 45%, transparent 50%, var(--bg) 72%); }
        .copy { position: absolute; left: 24px; top: 24px; width: 290px; display: flex; flex-direction: column; gap: 10px; }
        .head { font-size: 33px; line-height: .92; letter-spacing: .005em; text-shadow: 0 2px 0 var(--bg), 0 0 24px var(--bg); }
        .sub { width: 200px; font: italic 700 20px/1.1 'Alegreya', serif; color: var(--accent2); text-shadow: 0 1px 0 var(--bg), 0 0 16px var(--bg); }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        <div class="photo"><img src="${face}" alt=""><div class="fade"></div></div>
        ${onFace(spec.face, 100, 70, 330)}
        <div class="copy">
          <p class="head anton" data-fit="130">${spec.head}</p>
          <p class="sub">${spec.sub ?? ''}</p>
        </div>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Glow from below, the photo bottom-left, a two-line headline across the top.
  ember: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .sticker { background: radial-gradient(circle at 50% 120%, var(--accent) 0%, color-mix(in srgb, var(--accent) 45%, #000) 38%, var(--bg) 70%); }
        .photo { left: -30px; bottom: -60px; width: 300px; height: 300px; border-radius: 50%; }
        .photo .fade { background: radial-gradient(circle at 42% 52%, transparent 38%, color-mix(in srgb, var(--bg) 70%, transparent) 56%, var(--bg) 68%); }
        .head { position: absolute; left: 24px; top: 24px; width: 312px; font-size: 42px; line-height: .9; }
        .sub { position: absolute; right: 24px; top: 118px; width: 150px; text-align: right;
          font: 700 15px/1.2 'Alegreya Sans', sans-serif; color: var(--accent2); text-shadow: 0 1px 2px #000; }
        .qr-tile { right: 24px; bottom: 24px; }
      `,
      body: `
        <div class="photo"><img src="${face}" alt=""><div class="fade"></div></div>
        ${onFace(spec.face, -30, 120, 300)}
        <p class="head anton" data-fit="92">${spec.head}</p>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Round photo in the middle with a rotated black bar across it.
  bar: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .kicker { position: absolute; left: 24px; top: 24px; width: 215px; font-size: 20px; line-height: 1; white-space: nowrap; }
        .photo { left: 36px; top: 44px; width: 260px; height: 260px; border-radius: 50%; border: 4px solid var(--fg); }
        .bar { position: absolute; left: -24px; right: -24px; top: 176px; padding: 7px 0; background: var(--fg); color: var(--bar-fg);
          font-size: 36px; line-height: 1; text-align: center; letter-spacing: .02em; transform: rotate(4deg); box-shadow: 0 8px 20px rgba(0,0,0,.3); }
        .sub { position: absolute; left: 24px; bottom: 58px; width: 190px; font: italic 700 21px/1.05 'Alegreya', serif; }
        .qr-tile { right: 24px; bottom: 24px; }
      `,
      body: `
        <p class="kicker anton" data-fit="22">${spec.kicker ?? ''}</p>
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 36, 44, 260)}
        <p class="bar anton" data-fit="40">${spec.bar ?? ''}</p>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // The photo bleeds in from the right, the headline on the left.
  bleed: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .photo { right: -60px; top: 0; width: 360px; height: 360px; }
        .photo .fade { background: linear-gradient(90deg, var(--bg) 0%, var(--bg) 22%, transparent 62%); }
        .copy { position: absolute; left: 24px; top: 26px; width: 240px; display: flex; flex-direction: column; gap: 12px; }
        .head { font-size: 35px; line-height: .94; text-shadow: 0 2px 0 var(--bg), 0 0 22px var(--bg); }
        .sub { width: 180px; font: italic 700 19px/1.1 'Alegreya', serif; color: var(--accent); text-shadow: 0 1px 0 var(--bg), 0 0 14px var(--bg); }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        <div class="photo"><img src="${face}" alt=""><div class="fade"></div></div>
        ${onFace(spec.face, 60, 0, 360)}
        <div class="copy">
          <p class="head anton" data-fit="150">${spec.head}</p>
          <p class="sub">${spec.sub ?? ''}</p>
        </div>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Giant question, a scale of three icons with the hottest one picked, a small photo.
  scale: (spec, face) => {
    const { scan } = common(spec);
    const icon = icons[spec.style];
    return {
      css: `
        .head { position: absolute; left: 24px; top: 24px; width: 300px; font-size: 54px; line-height: .9; letter-spacing: -.005em; }
        .scale { position: absolute; left: 24px; top: 142px; display: flex; align-items: center; gap: 8px; }
        .scale svg { width: 38px; height: 38px; }
        .scale .dim { opacity: .3; }
        .scale .pick { padding: 3px; border: 3px solid var(--fg); border-radius: 50%; width: 48px; height: 48px; display: grid; place-items: center; }
        .scale .pick svg { width: 32px; height: 32px; }
        .sub { position: absolute; left: 24px; top: 198px; width: 220px; font: 700 14px/1.2 'Alegreya Sans', sans-serif; opacity: .85; }
        .sub strong { opacity: 1; }
        .photo { left: 24px; bottom: 24px; width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--fg); }
        .qr-tile { right: 24px; bottom: 24px; box-shadow: none; border: 3px solid var(--fg); }
      `,
      body: `
        <p class="head anton" data-fit="110">${spec.head}</p>
        <div class="scale">${icon('dim')}${icon('dim')}<span class="pick">${icon()}</span></div>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 24, 360 - 24 - 100, 100)}
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Flames along the bottom, the photo in a circle bottom-right.
  flames: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .flames { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 150px; }
        .head { position: absolute; left: 24px; top: 24px; width: 236px; font-size: 44px; line-height: .9; }
        .sub { position: absolute; left: 24px; top: 150px; width: 170px; font: italic 700 19px/1.1 'Alegreya', serif; color: var(--accent2); }
        .photo { right: -14px; bottom: 14px; width: 196px; height: 196px; border-radius: 50%; border: 4px solid var(--bg); box-shadow: 0 10px 30px rgba(0,0,0,.5); }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        ${flames(spec.palette.accent, spec.palette.accent2)}
        <p class="head anton" data-fit="120">${spec.head}</p>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 360 + 14 - 196, 360 - 14 - 196, 196)}
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // The photo as a wide band at the top with a stamp, the headline below.
  band: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .photo { left: 0; top: 0; width: 360px; height: 190px; }
        .photo .fade { background: linear-gradient(180deg, transparent 55%, var(--bg) 100%); }
        .stamp { position: absolute; right: 22px; top: 112px; padding: 2px 10px; border: 4px solid var(--accent); border-radius: 6px; color: var(--accent);
          font-size: 30px; line-height: 1; letter-spacing: .08em; transform: rotate(-12deg); box-shadow: 0 0 0 2px rgba(0,0,0,.35); background: color-mix(in srgb, var(--bg) 35%, transparent); }
        .head { position: absolute; left: 24px; top: 190px; width: 206px; font-size: 24px; line-height: .95; }
        .head em { display: block; margin-top: 2px; font-size: 1.5em; }
        .sub { position: absolute; left: 24px; top: 284px; width: 190px; font: 700 14px/1.2 'Alegreya Sans', sans-serif; opacity: .8; }
        .qr-tile { right: 24px; bottom: 24px; }
      `,
      body: `
        <div class="photo"><img src="${face}" alt=""><div class="fade"></div></div>
        ${onFace(spec.face, 0, -(360 - 190) / 2, 360)}
        ${spec.stamp ? `<span class="stamp anton">${escape(spec.stamp)}</span>` : ''}
        <p class="head anton" data-fit="88">${spec.head}</p>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // One big word under a round photo.
  word: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .photo { left: 105px; top: 22px; width: 150px; height: 150px; border-radius: 50%; border: 3px solid var(--accent); }
        .head { position: absolute; left: 20px; right: 20px; top: 178px; text-align: center; font-size: 50px; line-height: .9; letter-spacing: .01em;
          background: linear-gradient(180deg, var(--accent2) 0%, var(--accent) 60%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .sub { position: absolute; left: 136px; bottom: 62px; width: 200px; font: italic 700 20px/1.05 'Alegreya', serif; color: var(--accent2); }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 105, 22, 150)}
        <p class="head anton" data-fit="56">${spec.head}</p>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Two lines of a real poem, big.
  quote: (spec, face) => {
    const { scan } = common(spec);
    const [a, b] = spec.quote ?? ['', ''];
    return {
      css: `
        .mark { position: absolute; left: 18px; top: 2px; font: 700 150px/1 'Alegreya', serif; color: var(--accent); opacity: .45; }
        .lines { position: absolute; left: 24px; right: 24px; top: 70px; font: italic 700 24px/1.2 'Alegreya', serif; text-wrap: balance; }
        .lines span { display: block; }
        .lines span + span { margin-top: 6px; }
        .photo { right: 22px; bottom: 24px; width: 96px; height: 96px; border-radius: 50%; border: 3px solid var(--accent); }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        <span class="mark" aria-hidden="true">„</span>
        <p class="lines" data-fit="130"><span>${escape(a)}</span><span>${escape(b)}</span></p>
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 360 - 22 - 96, 360 - 24 - 96, 96)}
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // A chat window: the request, ChatGPT's answer with the words that should rhyme marked, a stamp.
  chat: (spec, face) => {
    const { scan } = common(spec);
    return {
      css: `
        .ask { position: absolute; right: 24px; top: 48px; max-width: 232px; padding: 7px 11px; border-radius: 14px 14px 4px 14px;
          background: #3a3a3a; font: 500 10.5px/1.3 'Alegreya Sans', sans-serif; color: var(--fg); }
        .who { position: absolute; left: 24px; top: 96px; display: flex; align-items: center; gap: 5px;
          font: 800 9px/1 'Alegreya Sans', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #9a9a9a; }
        .who svg { width: 14px; height: 14px; }
        .reply { position: absolute; left: 24px; top: 114px; width: 312px; font: 400 12px/1.35 'Alegreya', serif; color: var(--fg); }
        .reply u { font-weight: 700; color: #fff; text-decoration: underline wavy var(--accent); text-decoration-thickness: 2px; text-underline-offset: 3px; }
        .stamp { position: absolute; right: 16px; top: 180px; padding: 2px 9px; border: 4px solid var(--accent); border-radius: 6px; color: var(--accent);
          font-size: 26px; line-height: 1; letter-spacing: .06em; transform: rotate(-12deg); background: color-mix(in srgb, var(--bg) 55%, transparent); }
        .head { position: absolute; left: 24px; top: 188px; width: 200px; font-size: 30px; line-height: .92; }
        .photo { left: 24px; bottom: 24px; width: 84px; height: 84px; border-radius: 50%; border: 3px solid var(--accent2); }
        .sub { position: absolute; left: 118px; bottom: 52px; width: 112px; font: 700 12px/1.15 'Alegreya Sans', sans-serif; color: var(--accent2); }
        .qr-tile { right: 24px; bottom: 24px; }
      `,
      body: `
        <p class="ask">${escape(spec.ask ?? '')}</p>
        <p class="who">${bot()}ChatGPT</p>
        <p class="reply">${(spec.reply ?? []).join('<br>')}</p>
        <span class="stamp anton">${escape(spec.stamp ?? '')}</span>
        <p class="head anton" data-fit="58">${spec.head}</p>
        <div class="photo"><img src="${face}" alt=""></div>
        ${onFace(spec.face, 24, 360 - 24 - 84, 84)}
        <p class="sub">${spec.sub ?? 'Rijmt echt. In 30 seconden.'}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },

  // Two columns: ChatGPT's lines that should rhyme next to Sint's lines that do.
  versus: (spec, face) => {
    const { scan } = common(spec);
    const [a1, a2] = spec.against ?? ['', ''];
    const [s1, s2] = spec.quote ?? ['', ''];
    return {
      css: `
        .head { position: absolute; left: 24px; right: 24px; top: 22px; text-align: center; font-size: 34px; line-height: 1; white-space: nowrap; }
        .col { position: absolute; top: 72px; width: 140px; display: flex; flex-direction: column; gap: 6px; }
        .col.gpt { left: 24px; }
        .col.sint { left: 196px; }
        .col .icon { width: 44px; height: 44px; }
        .col .photo { position: static; width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--accent2); }
        .col .name { font: 800 10px/1 'Alegreya Sans', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #9a9a9a; }
        .col.sint .name { color: var(--accent2); }
        .col .lines { font: italic 400 13px/1.25 'Alegreya', serif; }
        .col .lines span { display: block; }
        .col u { font-weight: 700; color: #fff; text-decoration: underline wavy var(--accent); text-decoration-thickness: 2px; text-underline-offset: 3px; }
        .col.sint u { text-decoration-color: var(--accent2); }
        .col .verdict { display: flex; align-items: center; gap: 4px; margin-top: 2px; font: 800 12px/1 'Alegreya Sans', sans-serif; letter-spacing: .04em; color: var(--accent); }
        .col.sint .verdict { color: var(--accent2); }
        .col .mark { width: 14px; height: 14px; }
        .vs { position: absolute; left: 160px; top: 110px; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
          background: var(--fg); color: var(--bg); font-size: 16px; line-height: 1; }
        .rule { position: absolute; left: 179px; top: 74px; width: 2px; height: 148px; background: rgba(255,255,255,.14); }
        .sub { position: absolute; left: 142px; top: 232px; width: 196px; font: 700 13px/1.2 'Alegreya Sans', sans-serif; color: var(--fg); opacity: .85; }
        .qr-tile { left: 24px; bottom: 24px; }
      `,
      body: `
        <p class="head anton" data-fit="40">${spec.head}</p>
        <span class="rule"></span>
        <div class="col gpt">
          ${bot('icon')}
          <p class="name">ChatGPT</p>
          <p class="lines"><span>${a1}</span><span>${a2}</span></p>
          <p class="verdict">${cross(spec.palette.accent)}Rijmt niet</p>
        </div>
        <span class="vs anton">vs</span>
        <div class="col sint">
          <div class="photo"><img src="${face}" alt=""></div>
          <p class="name">Sint</p>
          <p class="lines"><span>${s1}</span><span>${s2}</span></p>
          <p class="verdict">${check(spec.palette.accent2)}Rijmt echt</p>
        </div>
        <p class="sub">${spec.sub ?? ''}</p>
        <div class="qr-tile">${qr(spec)}<span class="scan">${scan}</span></div>`,
    };
  },
};

function html(spec: StickerSpec, face: string): string {
  const { css, body } = templates[spec.template](spec, face);
  const p = spec.palette;
  const vars = `--bg:${p.bg};--fg:${p.fg};--accent:${p.accent};--accent2:${p.accent2};--tag-bg:${p.tagBg};--tag-fg:${p.tagFg};--bar-fg:${p.barFg ?? p.bg};`;
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">${fonts}
<style>:root{${vars}}${base}${css}${spec.subSize ? `.sub{font-size:${spec.subSize}px}` : ''}</style></head>
<body><div class="sticker">${body}</div>
<script>
  // Shrink text with data-fit until it fits its width and the given height.
  window.fit = () => {
    for (const el of document.querySelectorAll('[data-fit]')) {
      const max = Number(el.dataset.fit);
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (size > 10 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > max + 1)) {
        size -= 1;
        el.style.fontSize = size + 'px';
      }
    }
  };
</script></body></html>`;
}

async function main() {
  const face = await sharp(path.join(root, 'public/sint.png')).extract(FACE).jpeg({ quality: 92 }).toBuffer();
  const faceUrl = `data:image/jpeg;base64,${face.toString('base64')}`;

  await fs.mkdir(outDir, { recursive: true });
  const specs = STICKERS.filter(s => only.length === 0 || only.includes(s.id));

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CSS_SIZE, height: CSS_SIZE, deviceScaleFactor: PIXELS / CSS_SIZE });

    for (const spec of specs) {
      await page.setContent(html(spec, faceUrl), { waitUntil: 'load', timeout: 60_000 });
      // Load every face, also the ones this sticker does not use, so the check is fair.
      await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load())));
      const fontsOk = await page.evaluate(() =>
        ['20px Anton', 'italic 700 20px Alegreya', '800 20px "Alegreya Sans"'].every(f => document.fonts.check(f)));
      if (!fontsOk) throw new Error('Web fonts did not load (offline?)');
      await page.evaluate(() => (window as any).fit());

      const png = await page.screenshot({ type: 'png', omitBackground: true });
      const pngFile = path.join(outDir, `${spec.id}.png`);
      await sharp(png).resize(PIXELS, PIXELS).withMetadata({ density: STICKER_DPI }).png().toFile(pngFile);

      await page.pdf({
        path: path.join(outDir, `${spec.id}.pdf`),
        width: `${STICKER_SIZE_MM}mm`,
        height: `${STICKER_SIZE_MM}mm`,
        printBackground: true,
        scale: STICKER_SIZE_MM / (CSS_SIZE * 25.4 / 96),
        pageRanges: '1',
      });

      const { size } = await fs.stat(pngFile);
      console.log(`✔ ${path.relative(root, pngFile)} (${Math.round(size / 1024)} KB) → ${stickerUrl(spec)}`);
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
