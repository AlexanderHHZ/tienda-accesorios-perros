import { z } from 'zod';

const configSchema = z.object({
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  BODY_LIMIT: z.coerce.number().int().min(1024).max(1048576).default(16384),
});

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const result = configSchema.safeParse(environment);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Configuración inválida. Revisa: ${fields}.`);
  }
  return result.data;
}
