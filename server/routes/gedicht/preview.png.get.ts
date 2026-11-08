import { initWasm, Resvg } from '@resvg/resvg-wasm';
// @ts-expect-error unwasm resolves this to a WebAssembly.Module. Cloudflare
// Workers can only load WASM that is part of the upload, not compile it later.
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm?module';
import { verifyPoemShare } from '../../utils/poemShare';
import { buildShareSvg } from '../../utils/shareImageSvg';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

let wasmReady: Promise<void> | null = null;

function toBytes(value: unknown): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer);
}

async function renderPng(opening: string, language: 'nl' | 'en'): Promise<Uint8Array> {
  wasmReady ??= initWasm(resvgWasm);
  await wasmReady;

  const assets = useStorage('assets:server');
  const load = async (name: string) => toBytes(await assets.getItemRaw(`share:${name}`));
  const [texturina, alegreya, alegreyaSans, sint] = await Promise.all([
    load('texturina-700.ttf'),
    load('alegreya-500.ttf'),
    load('alegreya-sans-700.ttf'),
    load('sint.jpg'),
  ]);

  const sintDataUrl = `data:image/jpeg;base64,${btoa(String.fromCharCode(...sint))}`;
  const resvg = new Resvg(buildShareSvg(opening, language, sintDataUrl), {
    font: {
      loadSystemFonts: false,
      fontBuffers: [texturina, alegreya, alegreyaSans],
      defaultFontFamily: 'Alegreya',
    },
  });
  const image = resvg.render();
  const png = image.asPng();
  image.free();
  resvg.free();
  return png;
}

// Apps fetch this image without a browser, and the same link is fetched many
// times. Keep it in Cloudflare's edge cache, so it is drawn only once.
export default defineEventHandler(async (event) => {
  const share = await verifyPoemShare(
    getQuery(event),
    useRuntimeConfig(event).accessCookieSecret,
  );
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown poem image' });
  }

  const edgeCache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(getRequestURL(event).toString());
  const cached = await edgeCache?.match(cacheKey);
  if (cached) return cached;

  const response = new Response((await renderPng(share.opening, share.language)) as BodyInit, {
    headers: {
      'content-type': 'image/png',
      'cache-control': `public, max-age=${YEAR_SECONDS}, immutable`,
    },
  });
  if (edgeCache) {
    const put = edgeCache.put(cacheKey, response.clone());
    const context = (event.context as { cloudflare?: { context?: { waitUntil(p: Promise<unknown>): void } } }).cloudflare?.context;
    if (context) context.waitUntil(put);
    else await put;
  }
  return response;
});
