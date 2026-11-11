/**
 * The guerrilla stickers: the 9 Pikant and Roast designs the site owner chose
 * out of 30 on 11 Nov 2026 (after feedback), plus the 2 "ChatGPT vs Sint" designs chosen out of 5,
 * each with a QR code to the home page. Rendered by scripts/build-stickers.ts,
 * which holds the layouts (`template`).
 *
 * Every sticker links to https://sintgpt.com/?utm_source=sticker&utm_medium=qr
 * &utm_campaign=ams-<id>, so the dashboard shows which design brings
 * visitors (Sources → campaign).
 *
 * The quotes are lines from real poems that SintGPT wrote with the live
 * prompt on 11 Nov 2026 (AABB, Dutch) for made-up people. The chat and versus
 * layouts can show ChatGPT's own lines (utils/chatgptPoems.ts); the chosen
 * designs do not. The stickers use the name ChatGPT only, never its logo.
 */
export type StickerTemplate = 'corner' | 'ember' | 'bar' | 'bleed' | 'scale' | 'flames' | 'band' | 'word' | 'quote' | 'chat' | 'versus';
export type StickerStyle = 'pikant' | 'roast' | 'vs';

export interface Palette {
  bg: string;
  fg: string;
  /** Colour of <em> in the headline, icons, the site name. */
  accent: string;
  /** Second colour for gradients (flames, ember, the big word). */
  accent2: string;
  tagBg: string;
  tagFg: string;
  /** Text colour on the rotated bar (bar template); default the background. */
  barFg?: string;
}

export interface StickerSpec {
  /** File name; the campaign tag is `ams-<id>`. */
  id: string;
  style: StickerStyle;
  /** Short name of the variant, for the overview. */
  name: string;
  template: StickerTemplate;
  palette: Palette;
  /** Headline; may hold <em> and <br>. */
  head: string;
  sub?: string;
  /** Font size of `sub` in CSS px, when the layout's default is not right. */
  subSize?: number;
  /** Small line above the photo (bar template). */
  kicker?: string;
  /** Text on the rotated bar (bar template). */
  bar?: string;
  /** Text in the stamp (band template); without it there is no stamp. */
  stamp?: string;
  /** Two lines of a real poem (quote template). */
  quote?: [string, string];
  /** The request in the chat window (chat template). */
  ask?: string;
  /** ChatGPT's answer, line by line; may hold <u> around the words that should rhyme (chat template). */
  reply?: string[];
  /** ChatGPT's two lines next to Sint's `quote` (versus template); both may hold <u>. */
  against?: [string, string];
  /** What is drawn on the photo. */
  face?: 'plain' | 'shades' | 'kiss';
}

export const STICKER_SIZE_MM = 90;
export const STICKER_DPI = 300;

const P = {
  blackRed: { bg: '#0a0a0a', fg: '#ffffff', accent: '#ff2a4d', accent2: '#ff8fb1', tagBg: '#ff2a4d', tagFg: '#0a0a0a' },
  pink: { bg: '#ff2a6d', fg: '#111111', accent: '#ffffff', accent2: '#ffd6e3', tagBg: '#111111', tagFg: '#ff2a6d' },
  wine: { bg: '#3d0716', fg: '#fbf1dc', accent: '#f4cd60', accent2: '#ff2a4d', tagBg: '#f4cd60', tagFg: '#3d0716' },
  whiteRed: { bg: '#ffffff', fg: '#111111', accent: '#ff2a4d', accent2: '#ff8fb1', tagBg: '#111111', tagFg: '#ffffff', barFg: '#ff2a4d' },
  blackOrange: { bg: '#111111', fg: '#ffffff', accent: '#ff7a1a', accent2: '#ffd166', tagBg: '#ff7a1a', tagFg: '#111111' },
  charcoal: { bg: '#1c1c1c', fg: '#fbf1dc', accent: '#ff7a1a', accent2: '#ffd166', tagBg: '#1c1c1c', tagFg: '#ff7a1a' },
  pureBlack: { bg: '#000000', fg: '#ffffff', accent: '#ff7a1a', accent2: '#ffd166', tagBg: '#000000', tagFg: '#ffd9b3' },
  whiteOrange: { bg: '#ffffff', fg: '#111111', accent: '#ff7a1a', accent2: '#ffd166', tagBg: '#111111', tagFg: '#ffffff', barFg: '#ff7a1a' },
  orange: { bg: '#ff7a1a', fg: '#111111', accent: '#ffffff', accent2: '#ffd166', tagBg: '#111111', tagFg: '#ff7a1a', barFg: '#ff7a1a' },
  /** The dark grey of a chat window; red marks the faults, gold marks Sint. */
  chat: { bg: '#212121', fg: '#ececec', accent: '#ff2a4d', accent2: '#f4cd60', tagBg: '#f4cd60', tagFg: '#212121' },
} satisfies Record<string, Palette>;

const pikant = (n: number, spec: Omit<StickerSpec, 'id' | 'style'>): StickerSpec =>
  ({ id: `pikant-${String(n).padStart(2, '0')}`, style: 'pikant', face: 'plain', ...spec });
const roast = (n: number, spec: Omit<StickerSpec, 'id' | 'style'>): StickerSpec =>
  ({ id: `roast-${String(n).padStart(2, '0')}`, style: 'roast', face: 'shades', ...spec });
const vs = (n: number, spec: Omit<StickerSpec, 'id' | 'style'>): StickerSpec =>
  ({ id: `vs-${String(n).padStart(2, '0')}`, style: 'vs', face: 'plain', ...spec });


export const STICKERS: StickerSpec[] = [
  pikant(1, { name: 'Spicy gedicht', template: 'corner', palette: P.blackRed,
    head: 'Een <em>spicy</em><i class="chili"></i> sinterklaasgedicht nodig?', sub: 'Klaar in 30 seconden…' }),
  pikant(3, { name: 'Vorig weekend', template: 'bleed', palette: P.wine, face: 'kiss',
    head: 'Sint weet wat je <em>vannacht</em> deed…', sub: 'Een spicy gedicht. Klaar in 30 seconden.' }),
  pikant(5, { name: 'Hij komt', template: 'bleed', palette: P.blackRed,
    head: 'Hij komt,<br><em>hij komt…</em>', sub: 'Een spicy gedicht. Klaar in 30 seconden.' }),
  pikant(9, { name: 'Ondeugend rijmpje', template: 'corner', palette: P.pink,
    head: 'Sint heeft een <em>ondeugend</em> rijmpje voor je.', sub: 'Pikant en spicy. Klaar in 30 seconden.' }),
  pikant(11, { name: 'Een beetje spicy', template: 'bleed', palette: P.blackRed,
    head: 'Pakjesavond wordt een beetje <em>spicy.</em>', sub: 'Een pikant gedicht van Sint.', subSize: 22 }),

  roast(1, { name: 'Sint ziet alles', template: 'ember', palette: P.blackOrange,
    head: 'Sint ziet alles.<br><em>En zegt het ook.</em>', sub: 'Een Sinterklaas roast voor je familie, vrienden en collega’s.', subSize: 17 }),
  roast(13, { name: 'Je huisgenoot', template: 'corner', palette: P.blackOrange,
    head: 'Je huisgenoot gaat dit <em>niet</em> leuk vinden.', sub: 'Jij wel. Een Sinterklaas roast klaar in 30 seconden.' }),
  roast(14, { name: 'Je collega', template: 'corner', palette: P.blackOrange,
    head: 'Je collega heeft dit <em>verdiend.</em>', sub: 'Een roast op rijm voor de sinterklaasborrel op kantoor.' }),
  roast(15, { name: 'Niet voor jou', template: 'band', palette: P.blackOrange,
    head: 'Sint is lief voor kinderen.<em>Niet voor jou.</em>', sub: 'Een Sinterklaas roast. Klaar in 30 seconden.' }),

  // ChatGPT vs Sint: ChatGPT cannot write a sinterklaasgedicht (2 chosen out of 5).
  vs(3, { name: 'Sint ziet het', template: 'bleed', palette: P.wine,
    head: 'Sint ziet dat je gedicht uit <em>ChatGPT</em> komt.', sub: 'Je tante ook. Schrijf er een die wel lekker rijmt.' }),
  vs(5, { name: 'Sorry, ChatGPT', template: 'word', palette: P.blackRed,
    head: 'Sorry, ChatGPT.', sub: 'Een sinterklaasgedicht laat je aan Sint over.' }),
];

export const stickerUrl = (spec: StickerSpec) =>
  `https://sintgpt.com/?utm_source=sticker&utm_medium=qr&utm_campaign=ams-${spec.id}`;
