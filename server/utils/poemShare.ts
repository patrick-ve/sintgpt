import {
  base64UrlToBytes,
  bytesToBase64Url,
  decodeText,
  encodeText,
  extractOpening,
  poemDigest,
  type PoemLanguage,
  type PoemShare,
} from '../../utils/poemLink';
import { hmacKey } from './paymentAccess';

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_ENCODED_OPENING = 400;

// The prefix keeps these signatures separate from access tokens, which use the
// same secret but start with "v1.".
function signedMessage(s: string, l: string, d: string) {
  return new TextEncoder().encode(`share.v1|${l}|${d}|${s}`);
}

export async function signPoemShare(
  poem: string,
  language: PoemLanguage,
  secret: string,
): Promise<PoemShare> {
  const s = encodeText(extractOpening(poem));
  const d = await poemDigest(poem);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), signedMessage(s, language, d));
  return { s, l: language, d, sig: bytesToBase64Url(new Uint8Array(signature)) };
}

/**
 * The cache key for a share image. It holds only the signed values, so extra
 * query parameters on a valid link cannot force a new render.
 */
export function shareImageCacheUrl(requestUrl: URL): string {
  const { searchParams } = requestUrl;
  const query = new URLSearchParams();
  for (const name of ['s', 'l', 'd', 'sig']) {
    query.set(name, searchParams.get(name) ?? '');
  }
  return `${requestUrl.origin}${requestUrl.pathname}?${query}`;
}

export interface VerifiedShare {
  opening: string;
  language: PoemLanguage;
  digest: string;
}

/** Returns the signed content, or null when the link was not made by SintGPT. */
export async function verifyPoemShare(
  query: Record<string, unknown>,
  secret: string,
): Promise<VerifiedShare | null> {
  const { s, l, d, sig } = query;
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
    return valid ? { opening: decodeText(s), language: l, digest: d } : null;
  } catch {
    return null;
  }
}
