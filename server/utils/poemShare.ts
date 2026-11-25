import {
  base64UrlToBytes,
  bytesToBase64Url,
  decodeText,
  encodeText,
  extractOpening,
  poemDigest,
  shownOpening,
  type PoemLanguage,
  type PoemShare,
} from '../../utils/poemLink';
import { hasOwnPhoto, type SintStyle } from '../../utils/sintStyles';
import { hmacKey } from './paymentAccess';

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_ENCODED_OPENING = 400;
const STYLE_TAG_BYTES = 12;
const MAX_STYLE_VALUE = 40;

// The prefix keeps these signatures separate from access tokens, which use the
// same secret but start with "v1.".
function signedMessage(s: string, l: string, d: string) {
  return new TextEncoder().encode(`share.v1|${l}|${d}|${s}`);
}

// The style has its own signature over the link's signature, so the link
// itself did not change: a page from before the style (or anything else that
// drops `st`) still makes a valid link, with the usual photo.
async function styleTag(sig: string, style: string, secret: string): Promise<string> {
  const message = new TextEncoder().encode(`share-style.v1|${sig}|${style}`);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), message);
  return bytesToBase64Url(new Uint8Array(signature).slice(0, STYLE_TAG_BYTES));
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/** The style of a signed link, or null: no style, the usual photo, or a wrong tag. */
async function verifiedStyle(st: unknown, sig: string, secret: string): Promise<SintStyle | null> {
  if (typeof st !== 'string' || st.length > MAX_STYLE_VALUE) return null;
  const dot = st.lastIndexOf('.');
  const style = st.slice(0, dot) as SintStyle;
  if (dot < 1 || !hasOwnPhoto(style)) return null;
  return sameText(st.slice(dot + 1), await styleTag(sig, style, secret)) ? style : null;
}

/**
 * Signs a poem for its link. `style` is the poem style of the request; only
 * the styles with their own Sint photo (utils/sintStyles.ts) go into the link.
 */
export async function signPoemShare(
  poem: string,
  language: PoemLanguage,
  secret: string,
  style?: string | null,
): Promise<PoemShare> {
  const s = encodeText(extractOpening(poem));
  const d = await poemDigest(poem);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), signedMessage(s, language, d));
  const sig = bytesToBase64Url(new Uint8Array(signature));
  const share: PoemShare = { s, l: language, d, sig };
  if (hasOwnPhoto((style ?? null) as SintStyle | null)) {
    share.st = `${style}.${await styleTag(sig, style!, secret)}`;
  }
  return share;
}

/**
 * Raise this when the image of an existing link changes, so the edge cache
 * draws it again. 2: the image leaves out the greeting (15 Nov 2026).
 */
const SHARE_IMAGE_VERSION = '2';

/**
 * The cache key for a share image. It holds only the signed values, so extra
 * query parameters on a valid link cannot force a new render. `style` is the
 * verified style: a link without one keeps the key it had before the styles.
 */
export function shareImageCacheUrl(requestUrl: URL, style: SintStyle | null = null): string {
  const { searchParams } = requestUrl;
  const query = new URLSearchParams();
  for (const name of ['s', 'l', 'd', 'sig']) {
    query.set(name, searchParams.get(name) ?? '');
  }
  if (style) query.set('st', style);
  query.set('v', SHARE_IMAGE_VERSION);
  return `${requestUrl.origin}${requestUrl.pathname}?${query}`;
}

export interface VerifiedShare {
  opening: string;
  language: PoemLanguage;
  digest: string;
  /** The style whose Sint photo the share image shows; null for the usual photo. */
  style: SintStyle | null;
}

/** Returns the signed content, or null when the link was not made by SintGPT. */
export async function verifyPoemShare(
  query: Record<string, unknown>,
  secret: string,
): Promise<VerifiedShare | null> {
  const { s, l, d, sig, st } = query;
  if (
    !secret
    || (l !== 'nl' && l !== 'en')
    || typeof s !== 'string' || !BASE64URL.test(s) || s.length > MAX_ENCODED_OPENING
    || typeof d !== 'string' || !BASE64URL.test(d) || d.length > 64
    || typeof sig !== 'string' || !BASE64URL.test(sig) || sig.length > 64
  ) {
    return null;
  }

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      base64UrlToBytes(sig) as BufferSource,
      signedMessage(s, l, d),
    );
    if (!valid) return null;
    return {
      opening: shownOpening(decodeText(s)),
      language: l,
      digest: d,
      style: await verifiedStyle(st, sig, secret),
    };
  } catch {
    return null;
  }
}
