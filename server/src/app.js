import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import noteRoutes from './routes/notes.js';
import taskRoutes from './routes/tasks.js';
import calendarRoutes from './routes/calendar.js';
import assistantRoutes from './routes/assistant.js';
import reminderRoutes from './routes/reminders.js';
import { csrfProtection } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.GENERAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', generalLimiter);
app.use('/api', csrfProtection);
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/reminders', reminderRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
