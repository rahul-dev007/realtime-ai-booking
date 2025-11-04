import { Router, type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Booking from '../models/Booking.js';
import { authMiddleware, type AuthedRequest } from '../middleware/auth.js';

const r = Router();

// CREATE
r.post('/', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;         // ✅ cookie/JWT থেকে আসা ইউজার
  const { title, time } = req.body as { title: string; time: string };

  const booking = await Booking.create({
    userId: new Types.ObjectId(user.id),             // ✅ ObjectId-তে কাস্ট (Mongoose string-ও কাস্ট করতে পারে)
    title,
    time: new Date(time),
    status: 'pending'
  });

  // ( চাইলে: io.emit('booking:new', booking) )
  return res.json(booking);
});

// LIST (own only)
r.get('/', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;

  const docs = await Booking.find({ userId: user.id }) // ✅ user.id ব্যবহার
    .sort({ createdAt: -1 })
    .lean();

  return res.json(docs);
});

// DELETE
r.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user!;
  const { id } = req.params as { id: string };

  const doc = await Booking.findOneAndDelete({ _id: id, userId: user.id });
  if (!doc) return res.status(404).json({ message: 'Not found' });

  // ( চাইলে: io.emit('booking:deleted', { _id: id }) )
  return res.json({ ok: true, _id: id });
});

export default r;
