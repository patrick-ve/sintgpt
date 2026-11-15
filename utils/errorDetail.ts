import { DETAIL_MAX_LENGTH, DETAIL_PATTERN } from './analyticsEvents';

/**
 * A short, safe `detail` for an error event: the error type and the start of
 * its message. Quoted parts are removed first, because browsers quote the
 * input in some messages (JSON.parse quotes the text it could not read), and
 * that text could be a poem or a name. Links are shortened to "url". The
 * result fits DETAIL_PATTERN.
 */
export function errorDetail(error: unknown): string {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error
    ? error.message
    : typeof error === 'string' ? error : '';
  return cleanDetail(message ? `${name}: ${message}` : name);
}

/** Text reduced to what DETAIL_PATTERN allows, at most DETAIL_MAX_LENGTH long. */
export function cleanDetail(text: string): string {
  const clean = text
    .replace(/"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”|‘[^’]*’/g, ' ')
    .replace(/https?:\/\/\S+/g, 'url')
    .replace(/[^\p{L}\p{N} ._:/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DETAIL_MAX_LENGTH)
    .trim();
  return DETAIL_PATTERN.test(clean) ? clean : '';
}

/** The page or route without anything that identifies a poem or a payment. */
export function routeDetail(path: string): string {
  return path.split(/[?#]/)[0]!.replace(/^\/g\/[^/]+/, '/g/:id').replace(/^\/api\/share\/links\/[^/]+/, '/api/share/links/:id');
}
