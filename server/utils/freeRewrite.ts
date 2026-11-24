import { poemDigest } from '../../utils/poemLink';
import { verifyPoemShare } from './poemShare';

/**
 * A free visitor may rewrite their free poem once, with a wish (one per IP per
 * 24 hours, FREE_REWRITE_LIMIT). Safeguards, so it stays one small extra and
 * not a second free poem:
 * - only with a wish, and only of a poem on screen;
 * - the poem must carry SintGPT's signature (the `data-share` of the stream,
 *   or of a signed edit), so a script cannot send any text;
 * - it has its own counter, so it never gives a second new poem (since
 *   24 Nov 2026 it uses the same model as every poem, POEM_MODEL);
 * - `NUXT_FREE_REWRITE=off` turns it off without a deploy.
 * A request that does not qualify is an ordinary rewrite: it counts as a poem.
 */
export interface FreeRewriteRequest {
  regenerate?: boolean;
  rewriteHint?: string;
  previousPoem?: string;
  previousShare?: { s: string; l: string; d: string; sig: string };
}

export function freeRewriteEnabled(setting: unknown): boolean {
  return String(setting ?? '').trim().toLowerCase() !== 'off';
}

export async function qualifiesForFreeRewrite(body: FreeRewriteRequest | null, secret: string): Promise<boolean> {
  if (!body?.regenerate || !secret) return false;
  const hint = typeof body.rewriteHint === 'string' ? body.rewriteHint.trim() : '';
  const poem = typeof body.previousPoem === 'string' ? body.previousPoem.trim() : '';
  if (!hint || !poem || !body.previousShare || typeof body.previousShare !== 'object') return false;
  const verified = await verifyPoemShare(body.previousShare as unknown as Record<string, unknown>, secret);
  return !!verified && verified.digest === (await poemDigest(poem));
}
