import type { H3Event } from 'h3';
import { bytesToBase64Url } from '../../utils/poemLink';
import { isGreetingLine } from '../../utils/poemFrame';
import { shortLinkStore, type ShortLinkStore } from './poemShortLink';

/**
 * "Write first, then pay": a free visitor without poems left gets the poem
 * written anyway. The page shows only its start; the whole poem waits in
 * Workers KV until the visitor pays, then `POST /api/poem/unlock` gives it.
 *
 * Safeguards:
 * - 2 previews per IP per 24 hours (POEM_PREVIEW_LIMIT), on the poem model;
 * - only while payments work, and only for visitors without access;
 * - the poem stays at most 2 hours (PREVIEW_TTL_SECONDS), and the start of the
 *   poem is the only text the browser gets before payment;
 * - the ID is 128 random bits, and unlocking needs a valid access cookie; it
 *   counts as one of the buyer's poems (Drie: one of the 3);
 * - `NUXT_POEM_PREVIEW=off` turns it off without a deploy.
 */
export const PREVIEW_TTL_SECONDS = 2 * 60 * 60;
/** After an unlock, the same buyer can fetch it again for a while (a lost answer). */
export const UNLOCKED_TTL_SECONDS = 15 * 60;
export const PREVIEW_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
/** At most this many lines of the poem itself show before payment. */
const SHOWN_LINES = 4;

export interface StoredPreview {
  poem: string;
  style: string;
  rhymeScheme: string;
  language: 'dutch' | 'english';
  lines: number;
  createdAt: number;
  /** The buyer's counter name (a keyed hash) once unlocked. */
  unlockedBy?: string;
}

export interface PreviewTeaser {
  /** The greeting and the first lines, as the page shows them. */
  shown: string[];
  /** The other lines as their length in characters (0 = an empty line), for the blurred shape. */
  hidden: number[];
}

export function previewEnabled(setting: unknown): boolean {
  return String(setting ?? '').trim().toLowerCase() !== 'off';
}

export function newPreviewId(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export const previewKey = (id: string) => `preview:${id}`;

export function previewStore(event: H3Event): ShortLinkStore | undefined {
  return shortLinkStore(event);
}

/**
 * The start of the poem: the greeting, then the first stanza up to 4 lines,
 * and never more than half of the poem's lines. The rest is only its shape.
 */
export function previewTeaser(poem: string): PreviewTeaser {
  const lines = poem.trim().split('\n').map(line => line.trimEnd());
  const bodyCount = lines.filter(line => line.trim() && !isGreetingLine(line)).length;
  const limit = Math.max(1, Math.min(SHOWN_LINES, Math.floor(bodyCount / 2)));
  const shown: string[] = [];
  let index = 0;
  // The greeting line and the empty line after it.
  if (lines[0] && isGreetingLine(lines[0])) {
    shown.push(lines[0]);
    index = 1;
    while (index < lines.length && !lines[index]!.trim()) {
      shown.push('');
      index++;
    }
  }
  let count = 0;
  while (index < lines.length && count < limit) {
    const line = lines[index]!;
    if (!line.trim()) break;
    shown.push(line);
    count++;
    index++;
  }
  return { shown, hidden: lines.slice(index).map(line => line.trim().length) };
}
