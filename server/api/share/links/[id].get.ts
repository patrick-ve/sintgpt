import { readShortLink, shortLinkStore } from '../../../utils/poemShortLink';

// Used by the /g/<id> page while rendering on the server.
export default defineEventHandler(async (event) => {
  const store = shortLinkStore(event);
  const poem = store
    ? await readShortLink(store, getRouterParam(event, 'id') ?? '', useRuntimeConfig(event).accessCookieSecret)
    : null;
  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown poem link' });
  }
  return poem;
});
