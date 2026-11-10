/** Page sections whose paths are always lowercase. /g/<id> is not here: its IDs are case-sensitive. */
const LOWERCASE_SECTIONS = new Set(['blog', 'voorbeelden', 'lootjes', 'privacy', 'voorwaarden', 'gedicht']);

export interface CanonicalRequest {
  host: string;
  /** Path with query, as in event.path. */
  path: string;
  /** 'http' or 'https', as the visitor used it. */
  protocol?: string;
  /** Only GET and HEAD are redirected for the path rules; a 301 would turn a POST into a GET. */
  method?: string;
}

/**
 * The site lives at https://sintgpt.com, with lowercase page paths and no
 * trailing slash. Returns where a request must go, or null when it is right.
 * localhost and workers.dev keep their host and protocol.
 */
export function canonicalRedirect(request: CanonicalRequest): string | null {
  const { host, path } = request;
  const isWww = host.startsWith('www.');
  const mainHost = isWww ? host.slice(4) : host;
  const isLive = mainHost === 'sintgpt.com';

  const queryStart = path.search(/[?#]/);
  const pathname = queryStart === -1 ? path : path.slice(0, queryStart);
  const rest = queryStart === -1 ? '' : path.slice(queryStart);

  let cleanPath = pathname;
  const method = (request.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) cleanPath = cleanPath.replace(/\/+$/, '') || '/';
    const section = cleanPath.split('/')[1]?.toLowerCase();
    if (section && LOWERCASE_SECTIONS.has(section)) cleanPath = cleanPath.toLowerCase();
  }

  const insecure = isLive && request.protocol === 'http';
  if (!isWww && !insecure && cleanPath === pathname) return null;

  const protocol = isWww || isLive ? 'https' : (request.protocol ?? 'https');
  return `${protocol}://${mainHost}${cleanPath}${rest}`;
}
