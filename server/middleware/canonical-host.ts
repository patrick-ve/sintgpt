import { canonicalRedirect } from '../utils/canonicalHost';

export default defineEventHandler((event) => {
  const target = canonicalRedirect(getRequestHost(event), event.path);
  if (target) return sendRedirect(event, target, 301);
});
