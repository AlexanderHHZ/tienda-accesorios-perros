import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = mkdtempSync(join(tmpdir(), 'empaquetado-e2e-'));
// Las pruebas de navegador nunca apuntan a la base de desarrollo del usuario.
const child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
  cwd: fileURLToPath(new URL('../api/', import.meta.url)),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '4100',
    DATABASE_PATH: join(directory, 'e2e.db'),
    CORS_ORIGINS: 'http://127.0.0.1:3100',
    LOG_LEVEL: 'silent',
  },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
child.once('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  rmSync(directory, { recursive: true, force: true });
  process.exitCode = code ?? 0;
});
