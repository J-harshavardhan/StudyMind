import { z } from 'zod';
import { isValidDayKey } from '../utils/dateUtils.js';

const timezone = z.string().trim().min(1).max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}, 'Invalid timezone');

const dateKey = z.string().refine(isValidDayKey, 'Invalid date key');
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u, 'Time must use HH:mm format');

export const createReminderSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dateKey,
  time,
  timezone: timezone.default('Asia/Kolkata'),
  duration: z.number().int().min(0).max(1440).optional().default(0),
  description: z.string().trim().max(2000).optional().default(''),
  repeat: z.enum(['none', 'daily', 'weekdays', 'weekly']).optional().default('none'),
  reminderOffset: z.number().int().refine((value) => [0, 5, 10, 15].includes(value), 'Invalid reminder offset').optional().default(0),
  ringtoneType: z.enum(['default', 'custom']).optional().default('default')
});

export const updateReminderStatusSchema = z.object({
  status: z.enum(['upcoming', 'triggered', 'snoozed', 'completed', 'dismissed', 'missed']),
  occurrenceDateKey: dateKey.optional()
});

export const updateReminderSchema = createReminderSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one reminder field is required'
);
