import { consola, type LogObject } from 'consola';
import { getRequestURL, type H3Event } from 'h3';
import { cleanDetail, errorDetail, routeDetail } from '../../utils/errorDetail';
import { trackServerEvent } from '../utils/analytics';

const METHODS = { error: 'error', fatal: 'error', warn: 'warn', log: 'log', info: 'info', success: 'info', debug: 'debug', trace: 'debug', verbose: 'debug', fail: 'error', ready: 'info', start: 'info', box: 'log', silent: 'debug' } as const;

const text = (arg: unknown) =>
  arg instanceof Error ? `${arg.name}: ${arg.message}`
    : typeof arg === 'string' ? arg
      : JSON.stringify(arg);

// Workers Logs stores what the Worker writes with console.*. A plain object
// becomes searchable fields ($level, message, status, route, ...); consola's
// default output on Workers is a styled browser line full of CSS instead.
export default defineNitroPlugin((nitroApp) => {
  if (!import.meta.dev) {
    consola.setReporters([{
      log(entry: LogObject) {
        const method = METHODS[entry.type as keyof typeof METHODS] ?? 'log';
        console[method]({
          level: method,
          ...(entry.tag ? { tag: entry.tag } : {}),
          message: entry.args.map(text).join(' '),
        });
      },
    }]);
  }

  // Every error that reaches Nitro: thrown in a handler or while rendering a
  // page. Expected ones (404 for a wrong link, 429 for the rate limit) are
  // answers, not faults.
  nitroApp.hooks.hook('error', (error, { event }) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    const unhandled = (error as { unhandled?: boolean }).unhandled === true;
    if (status < 500 && !unhandled) return;
    const route = event ? routeDetail(getRequestURL(event as H3Event).pathname) : '';
    console.error({
      level: 'error',
      message: 'Server error',
      status,
      method: (event as H3Event | undefined)?.method,
      route,
      error: errorDetail(error),
    });
    if (event) {
      trackServerEvent(event as H3Event, 'Server error', { detail: cleanDetail(`${status} ${route}`) });
    }
  });
});
