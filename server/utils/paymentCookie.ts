import type { H3Event } from 'h3';
import {
  ACCESS_TTL_SECONDS,
  readAccessToken,
  signAccessToken,
} from './paymentAccess';

const ACCESS_COOKIE = 'sintgpt-access';

// Fails closed: without a configured secret nobody has unlimited access.
export async function hasUnlimitedAccess(event: H3Event): Promise<boolean> {
  return (await unlimitedAccessPaymentId(event)) !== null;
}

/** The payment behind a valid access cookie, or null without one. */
export async function unlimitedAccessPaymentId(event: H3Event): Promise<string | null> {
  const secret = useRuntimeConfig(event).accessCookieSecret;
  const token = getCookie(event, ACCESS_COOKIE);
  if (!secret || !token) return null;
  return readAccessToken(token, secret);
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
