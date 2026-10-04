import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, sessionVersion: user.sessionVersion || 0 },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : readCookie(req.headers.cookie, 'studymind_token');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('sessionVersion').lean();
    if (!user || user.sessionVersion !== (payload.sessionVersion || 0)) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function setAuthCookie(res, token) {
  res.cookie('studymind_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('studymind_token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/'
  });
}

export function csrfProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const cookie = readCookie(req.headers.cookie, 'studymind_token');
  if (cookie && req.headers.origin !== env.CLIENT_ORIGIN) {
    return res.status(403).json({ message: 'Invalid request origin' });
  }

  return next();
}

function readCookie(header, name) {
  const prefix = `${name}=`;
  const value = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}
