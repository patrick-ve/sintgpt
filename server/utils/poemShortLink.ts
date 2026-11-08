import type { H3Event } from 'h3';
import {
  bytesToBase64Url,
  poemDigest,
  type PoemShare,
} from '../../utils/poemLink';
import { hmacKey } from './paymentAccess';
import { verifyPoemShare, type VerifiedShare } from './poemShare';

// A short link needs storage, so a shared poem stays on the server for a while.
// It is stored only when someone chooses to share it, and removes itself.
export const SHORT_LINK_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_POEM_CHARS = 16 * 1024;
const ID_LENGTH = 10;
const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

export interface ShortLinkStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

export interface StoredPoem extends VerifiedShare {
  share: PoemShare;
  poem: string;
}

/** Workers KV on Cloudflare. Other builds have none, and share long links. */
export function shortLinkStore(event: H3Event): ShortLinkStore | undefined {
  const { cloudflare } = event.context as {
    cloudflare?: { env?: { POEM_LINKS?: ShortLinkStore } };
  };
  return cloudflare?.env?.POEM_LINKS;
}

// Derived from the signature: the same poem always gets the same link, and
// nobody can work out the ID of a poem without the secret.
async function shortLinkId(share: PoemShare, secret: string): Promise<string> {
  const message = new TextEncoder().encode(`short.v1|${share.sig}`);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), message);
  return bytesToBase64Url(new Uint8Array(signature)).slice(0, ID_LENGTH);
}

/**
 * Stores a poem that SintGPT wrote and returns its ID. Returns null for anything
 * else, so nobody can use this to put other text on sintgpt.com.
 */
export async function createShortLink(
  store: ShortLinkStore,
  share: PoemShare,
  poem: unknown,
  secret: string,
): Promise<string | null> {
  if (typeof poem !== 'string' || poem.length > MAX_POEM_CHARS) return null;
  const verified = await verifyPoemShare({ ...share }, secret);
  if (!verified || (await poemDigest(poem)) !== verified.digest) return null;

  const id = await shortLinkId(share, secret);
  // The free plan has a low daily write limit, so do not write a poem twice.
  if ((await store.get(id)) === null) {
    const stored = JSON.stringify({ s: share.s, l: share.l, d: share.d, sig: share.sig, poem });
    await store.put(id, stored, { expirationTtl: SHORT_LINK_TTL_SECONDS });
  }
  return id;
}

/** Returns null for an unknown or expired ID, or a link the secret no longer signs. */
export async function readShortLink(
  store: ShortLinkStore,
  id: string,
  secret: string,
): Promise<StoredPoem | null> {
  if (!ID_PATTERN.test(id)) return null;
  const value = await store.get(id);
  if (value === null) return null;

  const { poem, ...share } = JSON.parse(value) as PoemShare & { poem: string };
  const verified = await verifyPoemShare({ ...share }, secret);
  return verified ? { ...verified, share, poem } : null;
}
