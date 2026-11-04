import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from './app.js';
import { readConfig } from './config/env.js';

// Exportar documentación no debe crear ni modificar la base del usuario.
const directory = mkdtempSync(join(tmpdir(), 'empaquetado-openapi-'));
try {
  const app = await buildApp({
    ...readConfig(),
    DATABASE_PATH: join(directory, 'docs.db'),
    LOG_LEVEL: 'silent',
  });
  try {
    writeFileSync(
      new URL('../../docs/openapi.json', import.meta.url),
      `${JSON.stringify(app.swagger(), null, 2)}\n`,
    );
    console.log('Especificación exportada en docs/openapi.json');
  } finally {
    await app.close();
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
