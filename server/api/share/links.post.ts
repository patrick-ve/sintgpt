import type { PoemShare } from '../../../utils/poemLink';
import { createShortLink, shortLinkStore } from '../../utils/poemShortLink';

// The browser shares the long link when this fails, so no error reaches the user.
export default defineEventHandler(async (event) => {
  const store = shortLinkStore(event);
  if (!store) {
    throw createError({ statusCode: 503, statusMessage: 'Short links are not available' });
  }

  const body = await readBody<{ share?: PoemShare; poem?: unknown }>(event);
  const id = body?.share
    ? await createShortLink(store, body.share, body.poem, useRuntimeConfig(event).accessCookieSecret)
    : null;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Not a poem from SintGPT' });
  }
  return { id };
});
