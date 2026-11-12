// Keeps the site owner's own visits out of analytics. Opening any page with
// `?intern=1` sets the cookie `sintgpt-intern=1` in that browser; `?intern=0`
// removes it. With the cookie, the browser sends no events and the server
// writes none for its requests (webhooks from Dodo carry no cookie and still
// count). It hides nothing else and grants nothing: anyone who sets it only
// leaves their own visits out.

export const INTERNAL_COOKIE = 'sintgpt-intern';
export const INTERNAL_PARAM = 'intern';
/** 400 days, the longest a browser keeps a cookie. */
export const INTERNAL_MAX_AGE = 400 * 24 * 60 * 60;

/** True when a Cookie header (or `document.cookie`) marks an internal visit. */
export function isInternalCookie(cookies: string | null | undefined): boolean {
  return (cookies ?? '').split(';').some(part => part.trim() === `${INTERNAL_COOKIE}=1`);
}

/** What `?intern=` asks for: `on`, `off`, or nothing. */
export function internalParam(search: string): 'on' | 'off' | null {
  const value = new URLSearchParams(search).get(INTERNAL_PARAM);
  if (value === '1') return 'on';
  if (value === '0') return 'off';
  return null;
}
