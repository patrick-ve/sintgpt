import { consola } from 'consola';
import type { H3Event } from 'h3';

function generateRandomHash(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Generate a random 69-character hash
    const hash = generateRandomHash(69);
    const cookieName = `sintgpt-${hash}`;

    // Set HTTP-only cookie that expires in 1 year
    setCookie(event, cookieName, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    consola.success('Access cookie set:', cookieName);

    return {
      success: true,
      message: 'Unlimited access granted',
    };
  } catch (error: any) {
    consola.error('Error setting access cookie:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to set access cookie',
      data: { originalError: error.message },
    });
  }
});
