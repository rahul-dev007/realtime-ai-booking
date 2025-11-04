// backend/src/routes/admin.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import Booking from '../models/Booking.js';
import { authMiddleware, type AuthedRequest } from '../middleware/auth.js';
import { Types } from 'mongoose';
import { getIO } from '../sockets/io.js';
import Message from '../models/Message.js'; // ✅ যোগ করো


const r = Router();

/** admin guard: cookie/JWT থেকে পাওয়া req.user.role চেক */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const user = (req as AuthedRequest).user;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}

/** Simple health check */
r.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'admin', ts: new Date().toISOString() });
});

/** List all bookings (optional filters & pagination) */
r.get('/bookings', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query as { status?: string; page?: string; limit?: string };
    const q: any = {};
    if (status) q.status = status;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
        Booking.find(q).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
        Booking.countDocuments(q),
    ]);

    res.json({ items, total, page: pageNum, limit: pageSize });
});

/** Confirm a booking */
r.patch('/bookings/:id/confirm', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const admin = (req as AuthedRequest).user!;

  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Not found' });
  if (booking.status === 'confirmed') return res.json(booking);

  booking.status = 'confirmed';
  booking.confirmedAt = new Date();
  booking.confirmedBy = new Types.ObjectId(admin.id);

  // ensure participants include creator + admin
  const pMap = new Map<string, any>((booking.participants || []).map(p => [String(p.userId), p]));
  pMap.set(String(booking.userId), { userId: booking.userId, unread: 0 });
  pMap.set(String(admin.id), { userId: new Types.ObjectId(admin.id), unread: 0 });
  booking.participants = Array.from(pMap.values());

  // ⬇️ system message তৈরি
  const msg = await Message.create({
    bookingId: booking._id,
    senderId: new Types.ObjectId(admin.id), // system চাইলে nullও দিতে পারো
    content: 'Booking confirmed by admin.',
    kind: 'system'
  });

  // ⬇️ unread: admin পাঠিয়েছে → user এর unread +1
  booking.lastMessageAt = new Date();
  booking.participants = (booking.participants || []).map(p =>
    String(p.userId) === admin.id ? p : { ...p, unread: (p.unread ?? 0) + 1 }
  );

  await booking.save();

  const io = getIO();
  // status broadcast
  io.to(`booking:${booking._id}`).emit('booking:status', { bookingId: booking._id, status: 'confirmed' });

  // chat message broadcast (room: booking)
  io.to(`booking:${booking._id}`).emit('chat:message', msg);

  // user notification (room: user)
  io.to(`user:${booking.userId}`).emit('notify:new', {
    type: 'booking_confirmed',
    bookingId: booking._id,
    preview: msg.content,
    createdAt: new Date().toISOString()
  });

  res.json(booking);
});

/** Cancel a booking */
r.patch('/bookings/:id/cancel', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const admin = (req as AuthedRequest).user!;

  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Not found' });

  booking.status = 'cancelled';

  const msg = await Message.create({
    bookingId: booking._id,
    senderId: new Types.ObjectId(admin.id),
    content: 'Booking cancelled by admin.',
    kind: 'system'
  });

  booking.lastMessageAt = new Date();
  // unread: admin পাঠিয়েছে → user +1
  booking.participants = (booking.participants || []).map(p =>
    String(p.userId) === admin.id ? p : { ...p, unread: (p.unread ?? 0) + 1 }
  );

  await booking.save();

  const io = getIO();
  io.to(`booking:${booking._id}`).emit('booking:status', { bookingId: booking._id, status: 'cancelled' });
  io.to(`booking:${booking._id}`).emit('chat:message', msg);
  io.to(`user:${booking.userId}`).emit('notify:new', {
    type: 'booking_cancelled',
    bookingId: booking._id,
    preview: msg.content,
    createdAt: new Date().toISOString()
  });

  res.json(booking);
});

// DELETE /admin/bookings/:id  (hard delete by admin)
r.delete('/bookings/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Not found' });

    await Booking.deleteOne({ _id: id });

    // sockets
    const io = getIO();
    io.to(`booking:${id}`).emit('booking:deleted', { bookingId: id });
    io.to(`user:${booking.userId}`).emit('notify:new', {
        type: 'booking_deleted_by_admin',
        bookingId: id,
        createdAt: new Date().toISOString()
    });

    return res.json({ ok: true, _id: id });
});


export default r;
