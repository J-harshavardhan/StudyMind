import { z } from 'zod';
import { isValidDayKey } from '../utils/dateUtils.js';

const dayKey = z.string().refine(isValidDayKey, 'Invalid date key');
const objectId = z.string().regex(/^[a-f\d]{24}$/iu, 'Invalid ObjectId').nullable().optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dateKey: dayKey.optional(),
  dayKey: dayKey.optional(),
  note: objectId,
  priority: z.enum(['low', 'medium', 'high']).optional(),
  source: z.enum(['manual', 'study-plan', 'pomodoro']).optional()
}).transform((value) => ({ ...value, dateKey: value.dateKey || value.dayKey }));

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  dateKey: dayKey.optional(),
  note: objectId,
  priority: z.enum(['low', 'medium', 'high']).optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
