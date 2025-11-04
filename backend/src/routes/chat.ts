import { Router, type Request, type Response } from 'express';
import { authMiddleware, type AuthedRequest } from '../middleware/auth.js';
import { Types } from 'mongoose';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import { getIO } from '../sockets/io.js';

const r = Router();

/** GET /chat/:bookingId — message history */
r.get('/:bookingId', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const { bookingId } = req.params as { bookingId: string };

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  // only creator or admin can view
  if (String(booking.userId) !== user.id && user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const msgs = await Message.find({ bookingId })
    .sort({ createdAt: 1 })
    .lean();

  res.json(msgs);
});

/** POST /chat/:bookingId/send — send a text message */
r.post('/:bookingId/send', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const { bookingId } = req.params as { bookingId: string };
  const { content } = req.body as { content: string };

  if (!content?.trim()) return res.status(400).json({ message: 'Empty message' });

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  // only creator or admin can send
  if (String(booking.userId) !== user.id && user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const msg = await Message.create({
    bookingId: new Types.ObjectId(bookingId),
    senderId: new Types.ObjectId(user.id),
    content: content.trim(),
    kind: 'text',
  });

  // unread bump to the other participants
  booking.lastMessageAt = new Date();
  booking.participants = (booking.participants || []).map(p =>
    String(p.userId) === user.id ? { ...p, unread: 0 } : { ...p, unread: (p.unread ?? 0) + 1 }
  );
  await booking.save();

  const io = getIO();
  io.to(`booking:${bookingId}`).emit('chat:message', msg);
  // optional general notify
  const targetUserId = user.role === 'admin' ? booking.userId : booking.confirmedBy ?? null;
  if (targetUserId) {
    io.to(`user:${targetUserId}`).emit('notify:new', {
      type: 'chat_message',
      bookingId,
      preview: msg.content,
      createdAt: new Date().toISOString(),
    });
  }

  res.json(msg);
});

export default r;
