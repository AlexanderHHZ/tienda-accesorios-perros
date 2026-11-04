import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/env.js';
import { itemResponseSchema } from '../src/modules/empaquetados/schemas.js';
import type { CreateInput } from '../src/modules/empaquetados/schemas.js';

export const validInput: CreateInput = {
  peso: 4.5,
  tamano: 'mediano',
  medidas: { largo: 40, ancho: 30, alto: 20 },
  tipoEmpacado: 'caja',
};

export async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'empaquetado-test-'));
  const config = {
    ...readConfig({ NODE_ENV: 'test', LOG_LEVEL: 'silent' }),
    DATABASE_PATH: join(directory, 'test.db'),
  };
  const app = await buildApp(config);
  return {
    app,
    config,
    async create(input: CreateInput = validInput) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/empaquetados',
        payload: input,
      });
      return itemResponseSchema.parse(response.json<unknown>()).data;
    },
    async close() {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
