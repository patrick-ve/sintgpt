import { consola } from 'consola';
import { fetchPoemCount, POEM_COUNT_TTL_SECONDS, type PoemCount } from '../../utils/poemCounter';

// The hero's poem counter. Analytics Engine is asked at most once per
// POEM_COUNT_TTL_SECONDS per Cloudflare location (Cache API; no KV writes),
// and once per isolate in memory. Without the token (the Node build, the
// tests) or when the query fails, it answers 404 and the page shows nothing.

let memory: { at: number; count: PoemCount } | null = null;
const CACHE_KEY = 'https://sintgpt.com/__cache/poem-count';

interface EdgeCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

function edgeCache(): EdgeCache | null {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default ?? null;
}

export default defineEventHandler(async (event): Promise<PoemCount> => {
  const token = String(useRuntimeConfig(event).cloudflareAnalyticsToken || '');
  if (!token) throw createError({ statusCode: 404, statusMessage: 'No poem count' });

  setResponseHeader(event, 'cache-control', `public, max-age=${POEM_COUNT_TTL_SECONDS}`);
  if (memory && Date.now() - memory.at < POEM_COUNT_TTL_SECONDS * 1000) return memory.count;

  const cache = edgeCache();
  const cached = await cache?.match(CACHE_KEY).catch(() => undefined);
  if (cached) {
    const count = (await cached.json()) as PoemCount;
    memory = { at: Date.now(), count };
    return count;
  }

  try {
    const count = await fetchPoemCount(token);
    memory = { at: Date.now(), count };
    await cache?.put(CACHE_KEY, new Response(JSON.stringify(count), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${POEM_COUNT_TTL_SECONDS}` },
    })).catch(() => undefined);
    return count;
  } catch (error) {
    consola.warn('Poem count unavailable:', (error as Error).message);
    throw createError({ statusCode: 404, statusMessage: 'No poem count' });
  }
});
