import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');
const title = z.string().trim().min(1).max(200);
const tags = z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10);
const category = objectId.nullable().optional();
const deadline = z.coerce.date().nullable().optional();

export const createNoteSchema = z.object({
  title,
  content: z.string().max(100000).default(''),
  category,
  tags: tags.default([]),
  isPinned: z.boolean().optional().default(false),
  deadline
});

export const updateNoteSchema = z.object({
  title: title.optional(),
  content: z.string().max(100000).optional(),
  category,
  tags: tags.optional(),
  isPinned: z.boolean().optional(),
  deadline
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const noteQuerySchema = z.object({
  q: z.string().optional(),
  category: objectId.optional(),
  tag: z.string().trim().toLowerCase().min(1).max(30).optional(),
  pinned: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  hasDeadline: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sort: z.enum(['updatedAt', 'deadline']).default('updatedAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});
