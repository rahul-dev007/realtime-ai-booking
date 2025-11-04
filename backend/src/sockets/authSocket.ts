// backend/src/sockets/authSocket.ts
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type JwtUser = { id: string; role: 'user' | 'admin' };

function parseCookie(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach((p) => {
    const [k, ...rest] = p.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('=') || '');
  });
  return out;
}

export function getUserFromSocket(socket: any): JwtUser | null {
  const cookies = parseCookie(socket.handshake.headers?.cookie);
  const token = cookies['token'];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    return payload;
  } catch {
    return null;
  }
}
