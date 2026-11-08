// Draws the share image as an SVG. Kept free of WASM so it is easy to test.
import { stripEmoji } from '../../utils/poemLink';

export { stripEmoji };

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

/** The photo fills about a third of the width, inside a gold border. */
const PORTRAIT = { x: 790, y: 22, width: 388, height: 568 };
const PANEL_WIDTH = 746;
const TEXT_WIDTH = 690;
const MAX_ROWS = 5;
/** Alegreya's average character width, on the safe side. */
const CHAR_WIDTH_EM = 0.46;
const FONT_SIZES = [54, 48, 44, 40, 36, 32];
const LINE_HEIGHT = 1.28;
/** Room between the logo and the button. */
const TEXT_TOP = 150;
const TEXT_HEIGHT = 320;

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLine(line: string, maxChars: number): string[] {
  const rows: string[] = [];
  let row = '';
  for (const word of line.split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (next.length > maxChars && row) {
      rows.push(row);
      row = word;
    } else {
      row = next;
    }
  }
  if (row) rows.push(row);
  return rows;
}

/** Picks the largest font size at which the text fits. */
export function layoutOpening(opening: string): { fontSize: number; rows: string[] } {
  const lines = stripEmoji(opening).split('\n').map(line => line.trim()).filter(Boolean);
  for (const fontSize of FONT_SIZES) {
    const maxChars = Math.floor(TEXT_WIDTH / (fontSize * CHAR_WIDTH_EM));
    const rows = lines.flatMap(line => wrapLine(line, maxChars));
    const fits = rows.length <= MAX_ROWS
      && rows.length * fontSize * LINE_HEIGHT <= TEXT_HEIGHT
      && rows.every(row => row.length <= maxChars);
    if (fits) {
      return { fontSize, rows };
    }
  }
  // A very long word or line: cut it off rather than run out of the image.
  const fontSize = FONT_SIZES.at(-1)!;
  const maxChars = Math.floor(TEXT_WIDTH / (fontSize * CHAR_WIDTH_EM));
  const rows = lines
    .flatMap(line => wrapLine(line, maxChars))
    .slice(0, MAX_ROWS)
    .map(row => (row.length > maxChars ? `${row.slice(0, maxChars - 1)}…` : row));
  return { fontSize, rows };
}

export function buildShareSvg(
  opening: string,
  language: 'nl' | 'en',
  sintDataUrl: string,
): string {
  const { fontSize, rows } = layoutOpening(opening);
  const lineHeight = Math.round(fontSize * LINE_HEIGHT);
  const blockHeight = rows.length * lineHeight;
  const top = TEXT_TOP + Math.round((TEXT_HEIGHT - blockHeight) / 2) + fontSize;
  const cta = language === 'nl'
    ? 'Lees dit gedicht verder op SintGPT.com'
    : 'Read the rest of this poem at SintGPT.com';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SHARE_IMAGE_WIDTH}" height="${SHARE_IMAGE_HEIGHT}" viewBox="0 0 ${SHARE_IMAGE_WIDTH} ${SHARE_IMAGE_HEIGHT}">
  <defs>
    <radialGradient id="bg" cx="30%" cy="45%" r="85%">
      <stop offset="0" stop-color="#a01a42"/>
      <stop offset="0.5" stop-color="#7d1233"/>
      <stop offset="1" stop-color="#4f0a20"/>
    </radialGradient>
  </defs>
  <rect width="${SHARE_IMAGE_WIDTH}" height="${SHARE_IMAGE_HEIGHT}" fill="url(#bg)"/>
  <rect x="22" y="22" width="${PANEL_WIDTH}" height="${PORTRAIT.height}" fill="none" stroke="#f4cd60" stroke-opacity="0.35" stroke-width="1.5"/>
  <rect x="0" y="612" width="${SHARE_IMAGE_WIDTH}" height="18" fill="#f4cd60"/>
  <text x="70" y="118" font-family="Texturina" font-weight="700" font-size="52" fill="#f4cd60">SintGPT</text>
  ${rows.map((row, index) => `<text x="70" y="${top + index * lineHeight}" font-family="Alegreya" font-weight="500" font-size="${fontSize}" fill="#fbf1dc">${escapeXml(row)}</text>`).join('\n  ')}
  <rect x="70" y="496" width="620" height="66" rx="33" fill="#f4cd60"/>
  <text x="380" y="539" text-anchor="middle" font-family="Alegreya Sans" font-weight="700" font-size="32" fill="#3d0716">${escapeXml(cta)}</text>
  <image x="${PORTRAIT.x}" y="${PORTRAIT.y}" width="${PORTRAIT.width}" height="${PORTRAIT.height}" preserveAspectRatio="xMidYMid slice" href="${sintDataUrl}" xlink:href="${sintDataUrl}"/>
  <rect x="${PORTRAIT.x}" y="${PORTRAIT.y}" width="${PORTRAIT.width}" height="${PORTRAIT.height}" fill="none" stroke="#f4cd60" stroke-width="6"/>
</svg>`;
}
