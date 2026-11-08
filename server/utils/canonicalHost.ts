/**
 * The site lives at sintgpt.com. Returns where a www request must go, or null
 * when the host is already right (including localhost and workers.dev).
 */
export function canonicalRedirect(host: string, path: string): string | null {
  return host.startsWith('www.') ? `https://${host.slice(4)}${path}` : null;
}
