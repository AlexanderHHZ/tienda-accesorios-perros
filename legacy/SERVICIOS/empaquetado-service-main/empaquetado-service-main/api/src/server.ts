import { buildApp } from './app.js';
import { readConfig } from './config/env.js';

try {
  const config = readConfig();
  const app = await buildApp(config);
  // Fastify deja terminar solicitudes activas antes de cerrar SQLite.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      app.close().catch((error: unknown) => {
        app.log.error(error);
        process.exitCode = 1;
      });
    });
  }
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No fue posible iniciar la API.');
  process.exitCode = 1;
}
