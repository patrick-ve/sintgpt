import type { H3Event } from 'h3';
import { cookieMaxAge, readAccessToken, signAccessToken, type PaidAccess } from './paymentAccess';

const ACCESS_COOKIE = 'sintgpt-access';

/**
 * The tier and payment behind a valid access cookie, or null without one.
 * Fails closed: without a configured secret nobody has paid access.
 */
export async function paidAccess(event: H3Event): Promise<PaidAccess | null> {
  const secret = useRuntimeConfig(event).accessCookieSecret;
  const token = getCookie(event, ACCESS_COOKIE);
  if (!secret || !token) return null;
  return readAccessToken(token, secret);
}

export async function setAccessCookie(event: H3Event, access: PaidAccess, secret: string): Promise<void> {
  setCookie(event, ACCESS_COOKIE, await signAccessToken(access, secret), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: cookieMaxAge(access.expiresAt),
    path: '/',
  });
}
