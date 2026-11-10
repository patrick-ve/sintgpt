import { z } from 'zod';
import { POEM_INPUT_LIMITS } from '../../utils/poemLimits';
import { extractOpening, poemDigest, type PoemShare } from '../../utils/poemLink';
import { signPoemShare, verifyPoemShare } from './poemShare';

// A visitor may change a word or a line of a poem and keep the share link. The
// link is signed so that nobody can put their own text on sintgpt.com, so an
// edit is signed only when it stays close to a poem SintGPT wrote:
// - the whole poem changes by at most a quarter of its words;
// - the opening, which the link preview and share image show, changes by at
//   most a quarter of its characters (at least 12, enough to fix a name).
// The edit is always compared with the original poem, never with an earlier
// edit, so many small edits cannot add up to a new poem.

export const MAX_WORD_CHANGE = 0.25;
export const MAX_OPENING_CHANGE = 0.25;
export const MIN_OPENING_CHARS = 12;
const MAX_LINES = 60;

export const PoemEditSchema = z.object({
  share: z.object({
    s: z.string().max(400),
    l: z.enum(['nl', 'en']),
    d: z.string().max(64),
    sig: z.string().max(64),
  }),
  original: z.string().min(1).max(POEM_INPUT_LIMITS.previousPoem),
  text: z.string().max(POEM_INPUT_LIMITS.previousPoem),
});

export type PoemEditRequest = z.infer<typeof PoemEditSchema>;

/** Edit distance between two sequences, with two rows of memory. */
export function editDistance<T>(a: readonly T[], b: readonly T[]): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  let current = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length]!;
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** The share of words that changed: 0 is the same poem, 1 is a new one. */
export function wordChange(original: string, text: string): number {
  const a = words(original);
  const b = words(text);
  return editDistance(a, b) / Math.max(a.length, b.length, 1);
}

export type EditVerdict = { ok: true } | { ok: false; reason: 'empty' | 'too-long' | 'too-different' };

export function checkPoemEdit(original: string, text: string): EditVerdict {
  const edited = text.trim();
  if (!edited) return { ok: false, reason: 'empty' };
  if (edited.split('\n').length > MAX_LINES) return { ok: false, reason: 'too-long' };
  if (wordChange(original, edited) > MAX_WORD_CHANGE) return { ok: false, reason: 'too-different' };

  const before = [...extractOpening(original)];
  const after = [...extractOpening(edited)];
  const allowed = Math.max(MIN_OPENING_CHARS, Math.floor(before.length * MAX_OPENING_CHANGE));
  if (editDistance(before, after) > allowed) return { ok: false, reason: 'too-different' };
  return { ok: true };
}

export type ReSignResult =
  | { ok: true; share: PoemShare }
  | { ok: false; reason: 'invalid' | 'empty' | 'too-long' | 'too-different' };

/**
 * Signs an edited poem when `share` is SintGPT's signature for `original` and
 * the edit is small. The original must match the signed digest exactly.
 */
export async function reSignEditedPoem(request: PoemEditRequest, secret: string): Promise<ReSignResult> {
  const verified = await verifyPoemShare(request.share, secret);
  if (!verified || verified.digest !== (await poemDigest(request.original))) {
    return { ok: false, reason: 'invalid' };
  }
  const verdict = checkPoemEdit(request.original, request.text);
  if (!verdict.ok) return verdict;
  return { ok: true, share: await signPoemShare(request.text.trim(), verified.language, secret) };
}
