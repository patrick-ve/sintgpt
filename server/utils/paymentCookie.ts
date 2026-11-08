import type { H3Event } from 'h3';
import {
  ACCESS_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
} from './paymentAccess';

const ACCESS_COOKIE = 'sintgpt-access';

// Fails closed: without a configured secret nobody has unlimited access.
export async function hasUnlimitedAccess(event: H3Event): Promise<boolean> {
  const secret = useRuntimeConfig(event).accessCookieSecret;
  const token = getCookie(event, ACCESS_COOKIE);
  if (!secret || !token) return false;
  return verifyAccessToken(token, secret);
}

export async function setAccessCookie(
  event: H3Event,
  paymentId: string,
  secret: string,
): Promise<void> {
  setCookie(event, ACCESS_COOKIE, await signAccessToken(paymentId, secret), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: ACCESS_TTL_SECONDS,
    path: '/',
  });
}
