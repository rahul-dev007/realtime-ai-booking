import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { env } from '../config/env.js';

export function registerSockets(io: Server) {
  io.on('connection', (socket) => {
    // cookie থেকে টোকেন ধরার চেষ্টা
    const rawCookie = socket.handshake.headers.cookie || '';
    const parsed = cookie.parse(rawCookie);
    const token = parsed?.token;

    let userId: string | null = null;

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as { id: string };
        userId = payload.id;
        socket.join(`user:${userId}`);
      } catch { /* ignore */ }
    }

    socket.on('join:booking', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('leave:booking', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });
  });
}
