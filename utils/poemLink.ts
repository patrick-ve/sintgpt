// A shared poem lives in its link, so no database is needed:
//   /gedicht?s=<opening>&l=<language>&d=<digest>&sig=<signature>#<whole poem>
// Browsers never send the part after # to a server, so the whole poem stays out
// of server logs. The server signs the opening and a digest of the poem when it
// generates them. That lets the page prove the text came from SintGPT, without
// the server ever seeing the shared poem again.

export type PoemLanguage = 'nl' | 'en';

export interface PoemShare {
  /** The opening lines, base64url. */
  s: string;
  l: PoemLanguage;
  /** Digest of the whole poem, base64url. */
  d: string;
  /** Server signature over s, l and d, base64url. */
  sig: string;
}

const OPENING_LINES = 2;
const MAX_OPENING_CHARS = 180;
/** Far above the longest poem; stops a crafted link from exhausting memory. */
const MAX_POEM_BYTES = 16 * 1024;

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export function encodeText(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

export function decodeText(value: string): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(value));
}

/** The first two lines of the poem, for the preview text and image. */
export function extractOpening(poem: string): string {
  return poem
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, OPENING_LINES)
    .join('\n')
    .slice(0, MAX_OPENING_CHARS);
}

export async function poemDigest(poem: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(poem.trim()));
  return bytesToBase64Url(new Uint8Array(hash).slice(0, 16));
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_POEM_BYTES) {
      await reader.cancel();
      throw new Error('Poem is too long');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return all;
}

function pipe(bytes: Uint8Array, transform: ReadableWritablePair<Uint8Array, Uint8Array>) {
  return new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
}

/** Compresses the poem for the link. The first character names the format. */
export async function encodePoem(poem: string): Promise<string> {
  const bytes = new TextEncoder().encode(poem);
  if (typeof CompressionStream === 'undefined') return `p${bytesToBase64Url(bytes)}`;
  const compressed = await readAll(pipe(bytes, new CompressionStream('deflate-raw') as ReadableWritablePair<Uint8Array, Uint8Array>));
  return `d${bytesToBase64Url(compressed)}`;
}

/** Returns null for anything that is not a valid encoded poem. */
export async function decodePoem(encoded: string): Promise<string | null> {
  try {
    const bytes = base64UrlToBytes(encoded.slice(1));
    let plain: Uint8Array;
    if (encoded[0] === 'p') {
      if (bytes.length > MAX_POEM_BYTES) return null;
      plain = bytes;
    } else if (encoded[0] === 'd') {
      plain = await readAll(pipe(bytes, new DecompressionStream('deflate-raw') as ReadableWritablePair<Uint8Array, Uint8Array>));
    } else {
      return null;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(plain);
  } catch {
    return null;
  }
}

export async function buildShareUrl(
  origin: string,
  share: PoemShare,
  poem: string,
): Promise<string> {
  const query = new URLSearchParams({ s: share.s, l: share.l, d: share.d, sig: share.sig });
  return `${origin}/gedicht?${query}#${await encodePoem(poem)}`;
}
