import { errorDetail } from '~/utils/errorDetail';

/** At most this many error events per page load, so a loop cannot flood the dataset. */
const MAX_PER_PAGE = 5;

// Script errors in the browser become a `Client error` event, which the alert
// check (server/utils/alerts.ts) reports. Errors the page already handles
// (Poem stream failed, PDF failed, Copy failed) have their own events.
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) return;
  const { track } = useAnalytics();
  const seen = new Set<string>();

  const report = (error: unknown, where: string) => {
    const status = (error as { statusCode?: number } | null)?.statusCode;
    // A 404 or 429 is an answer, not a fault. AbortError: the visitor left.
    if (status && status < 500) return;
    if (error instanceof Error && error.name === 'AbortError') return;
    const detail = errorDetail(error);
    // Errors in scripts from other sites carry no information at all.
    if (!detail || /^(string: )?Script error/i.test(detail)) return;
    if (seen.has(detail) || seen.size >= MAX_PER_PAGE) return;
    seen.add(detail);
    track('Client error', { detail: `${where}:${detail}`.slice(0, 60) });
  };

  nuxtApp.hook('vue:error', error => report(error, 'vue'));
  nuxtApp.hook('app:error', error => report(error, 'app'));
  nuxtApp.hook('app:chunkError', ({ error }) => report(error, 'chunk'));

  window.addEventListener('error', (event) => {
    // Only our own scripts: browser extensions also throw on this page.
    if (event.filename && !event.filename.startsWith(window.location.origin)) return;
    report(event.error ?? event.message, 'window');
  });
  window.addEventListener('unhandledrejection', event => report(event.reason, 'promise'));
});
