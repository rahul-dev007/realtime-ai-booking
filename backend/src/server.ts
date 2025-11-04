import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { setIO } from './sockets/io.js';
import { registerSockets } from './sockets/index.js'; // if you have

export function createServer() {
    const app = express();

    // ✅ credentials=true + origin whitelist
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    app.use(cookieParser());     // ✅ আগে
    app.use(express.json());

    app.use('/auth', authRoutes);
    app.use('/bookings', bookingRoutes);
    app.use('/chat', chatRoutes);
    app.use('/admin', adminRoutes);

    const server = http.createServer(app);

    const io = new Server(server, {
        cors: { origin: 'http://localhost:3000', credentials: true },
    });
    setIO(io);
    registerSockets?.(io);

    return { app, server, io };
}
