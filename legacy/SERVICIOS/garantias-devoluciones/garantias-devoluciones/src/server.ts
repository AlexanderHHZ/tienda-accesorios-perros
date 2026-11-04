import { buildApp } from './app.js';
import { readConfig } from './config.js';

async function start(): Promise<void> {
  const config = readConfig();
  const app = await buildApp({ logger: { level: config.LOG_LEVEL }, bodyLimit: config.BODY_LIMIT });
  let closing = false;

  const close = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Cerrando el servicio');
    try {
      await app.close();
    } catch (error) {
      app.log.error({ err: error }, 'No fue posible cerrar correctamente');
      process.exitCode = 1;
    }
  };
  process.once('SIGINT', () => { void close('SIGINT'); });
  process.once('SIGTERM', () => { void close('SIGTERM'); });

  try {
    await app.listen({ host: config.HOST, port: config.PORT });
    app.log.info('Swagger disponible en /docs; contrato OpenAPI en /docs/json');
  } catch (error) {
    await app.close();
    throw error;
  }
}

start().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No fue posible iniciar el servicio.');
  process.exitCode = 1;
});
