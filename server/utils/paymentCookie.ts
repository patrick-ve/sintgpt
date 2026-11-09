import type { H3Event } from 'h3';
import { giftStillValid, isGiftId } from './giftAccess';
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
  const access = await readAccessToken(token, secret);
  // A gift ends as soon as its code leaves NUXT_GIFT_CODES.
  if (access && isGiftId(access.paymentId) && !(await giftStillValid(access.paymentId, String(useRuntimeConfig(event).giftCodes || "")))) {
    return null;
  }
  return access;
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
