import type { H3Event } from 'h3';

export function hasUnlimitedAccess(event: H3Event): boolean {
  const cookies = parseCookies(event);

  // Check if any cookie starts with 'sintgpt-'
  return Object.keys(cookies).some(key => key.startsWith('sintgpt-'));
}
