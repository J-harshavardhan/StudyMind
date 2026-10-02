import { z } from 'zod';
import { CATEGORY_ICON_KEYS } from '../utils/constants.js';

const name = z.string().trim().min(1).max(40);
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a 6-digit hex value');
const icon = z.enum(CATEGORY_ICON_KEYS);

export const createCategorySchema = z.object({ name, color, icon });
export const updateCategorySchema = z.object({
  name: name.optional(),
  color: color.optional(),
  icon: icon.optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');
