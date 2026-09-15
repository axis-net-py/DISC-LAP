import { z } from 'zod';

const productionSchema = z.object({
  NODE_ENV: z.literal('production'),
  DATABASE_URL: z.string().url().startsWith('postgres'),
  ADMIN_PASSWORD_HASH: z.string().min(50),
  SESSION_SECRET: z.string().min(48),
  DATA_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(730)
});

export function readConfig(env = process.env) {
  const parsed = productionSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid server configuration: ${fields}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    databaseUrl: parsed.data.DATABASE_URL,
    adminPasswordHash: parsed.data.ADMIN_PASSWORD_HASH,
    sessionSecret: parsed.data.SESSION_SECRET,
    retentionDays: parsed.data.DATA_RETENTION_DAYS
  };
}
