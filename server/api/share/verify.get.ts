import { verifyPoemShare } from '../../utils/poemShare';

// Used by the /gedicht page while rendering on the server.
export default defineEventHandler(async (event) => {
  const share = await verifyPoemShare(
    getQuery(event),
    useRuntimeConfig(event).accessCookieSecret,
  );
  if (!share) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown poem link' });
  }
  return share;
});
