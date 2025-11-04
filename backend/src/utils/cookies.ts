import type { Response } from 'express';

export function setAuthCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd ? true : false,   // dev: http ok; prod: must be true
    sameSite: isProd ? 'lax' : 'lax',// localhost:3000↔4000 same-site, Lax যথেষ্ট
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie('token', { path: '/' });
}
