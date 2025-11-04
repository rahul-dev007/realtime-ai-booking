import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'
import { env } from '../config/env.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';

const r = Router();

r.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// REGISTER
r.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  // ... create user (hash etc.)
  const user = await User.create({ email, password, name }); // demo only
  const token = jwt.sign({ id: user._id, role: user.role || 'user' }, env.JWT_SECRET, { expiresIn: '7d' });

  setAuthCookie(res, token);       // ✅ cookie set
  res.json({ ok: true, user: { id: user._id, email: user.email, role: user.role || 'user' } });
});

// LOGIN
r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // ... validate user + password
  const user = await User.findOne({ email }); // demo only
  // if (!user || !await verify(password)) return res.status(401)...
  const token = jwt.sign({ id: user!._id, role: user!.role || 'user' }, env.JWT_SECRET, { expiresIn: '7d' });

  setAuthCookie(res, token);       // ✅ cookie set
  res.json({ ok: true, user: { id: user!._id, email: user!.email, role: user!.role || 'user' } });
});

// LOGOUT (clear cookie)
r.post('/logout', (req, res) => {
  clearAuthCookie(res);            // ✅ cookie clear
  res.json({ ok: true });
});

export default r;
