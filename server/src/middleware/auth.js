import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
}

export function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    req.user = jwt.verify(authorization.slice(7), env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
