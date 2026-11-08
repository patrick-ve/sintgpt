import type { H3Event } from 'h3';

/**
 * An AbortSignal that fires when the visitor disconnects.
 *
 * On Cloudflare Workers this is the incoming request's signal, which needs the
 * `enable_request_signal` compatibility flag (set in nuxt.config.ts) until the
 * compatibility date reaches 2026-11-17. On Node it follows the response.
 */
export function clientDisconnectSignal(event: H3Event): AbortSignal {
  const workerSignal = (event.context as { cloudflare?: { request?: Request } })
    .cloudflare?.request?.signal;
  if (workerSignal) return workerSignal;

  const controller = new AbortController();
  const response = event.node?.res;
  response?.once('close', () => {
    if (!response.writableFinished) controller.abort();
  });
  return controller.signal;
}
