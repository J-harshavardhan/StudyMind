import 'dotenv/config';
import { z } from 'zod';

const rawEnv = {
  PORT: process.env.PORT ?? '5000',
  MONGO_URI: process.env.MONGO_URI ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  TRUST_PROXY: process.env.TRUST_PROXY ?? 'false',
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ?? '10',
  GENERAL_RATE_LIMIT_MAX: process.env.GENERAL_RATE_LIMIT_MAX ?? '300',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB ?? (process.env.NODE_ENV === 'test' ? 'true' : 'false')
};

const envSchema = z.object({
  PORT: z.string().trim().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().max(65535)),
  MONGO_URI: z.string().trim().optional(),
  JWT_SECRET: z.string().trim().min(32, 'JWT_SECRET must be at least 32 characters long'),
  CLIENT_ORIGIN: z.string().trim().min(1).url('CLIENT_ORIGIN must be a valid URL'),
  TRUST_PROXY: z.enum(['true', 'false']),
  AUTH_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  GENERAL_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
  USE_MEMORY_DB: z.enum(['true', 'false'])
});

const parsed = envSchema.safeParse(rawEnv);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment config:\n${details}`);
}

const envData = parsed.data;
if (envData.USE_MEMORY_DB === 'false' && !envData.MONGO_URI.trim()) {
  throw new Error('MONGO_URI is required when USE_MEMORY_DB is false');
}

export const env = {
  ...envData,
  PORT: Number(envData.PORT),
  AUTH_RATE_LIMIT_MAX: envData.AUTH_RATE_LIMIT_MAX,
  GENERAL_RATE_LIMIT_MAX: envData.GENERAL_RATE_LIMIT_MAX,
  MONGO_URI: envData.MONGO_URI.trim() || undefined,
  TRUST_PROXY: envData.TRUST_PROXY === 'true',
  USE_MEMORY_DB: envData.USE_MEMORY_DB === 'true'
};
