import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import User from '../models/User.js';
import { auth, clearAuthCookie, setAuthCookie, signToken } from '../middleware/auth.js';

const router = Router();

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8)
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  settings: z.object({
    timezone: z.string().trim().min(1).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    dailyFocusGoalMinutes: z.number().int().min(0).max(600).optional()
  }).optional()
}).refine((value) => value.name !== undefined || value.settings !== undefined, {
  message: 'Provide a name or settings update.'
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  settings: user.settings || {},
  streak: user.streak || {}
});

const parse = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error(result.error.issues[0].message);
    error.status = 400;
    throw error;
  }
  return result.data;
};

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = parse(registrationSchema, req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = parse(loginSchema, req.body);
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/profile', auth, async (req, res, next) => {
  try {
    const payload = parse(profileSchema, req.body);
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (payload.name) {
      user.name = payload.name;
    }

    if (payload.settings) {
      user.settings = {
        ...user.settings.toObject?.() || user.settings,
        ...payload.settings
      };
    }

    await user.save();
    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = parse(passwordSchema, req.body);
    const user = await User.findById(req.user.sub).select('+passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.sessionVersion += 1;
    await user.save();
    const token = signToken(user);
    setAuthCookie(res, token);
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', auth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.sub, { $inc: { sessionVersion: 1 } });
    clearAuthCookie(res);
  } catch (error) {
    return next(error);
  }
  res.json({ message: 'Logged out' });
});

export default router;
