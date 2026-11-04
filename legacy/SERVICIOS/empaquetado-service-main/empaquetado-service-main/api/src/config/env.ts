import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';

export const apiDirectory = fileURLToPath(new URL('../../', import.meta.url));
const envFile = resolve(apiDirectory, '.env');
if (existsSync(envFile)) loadEnvFile(envFile);

const originSchema = z.url().refine((value) => {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Usa un origen HTTP(S) exacto, sin ruta ni barra final.');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_PATH: z.string().min(1).default('./data/empaquetados.db'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://127.0.0.1:3000')
    .transform((value) => value.split(',').map((item) => item.trim()))
    .pipe(z.array(originSchema).min(1)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const result = envSchema.safeParse(environment);
  if (!result.success) {
    // No imprimir valores de entorno: podrían contener información sensible.
    throw new Error(
      `Configuración inválida: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return { ...result.data, DATABASE_PATH: resolve(apiDirectory, result.data.DATABASE_PATH) };
}

export type AppConfig = ReturnType<typeof readConfig>;
