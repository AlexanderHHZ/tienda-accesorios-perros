import Fastify, { type FastifyServerOptions } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { ReturnService } from './application/returns/return-service.js';
import { WarrantyService } from './application/warranties/warranty-service.js';
import type { UnitOfWork } from './domain/unit-of-work.js';
import { registerIntegrationDocs } from './http/docs/integration.js';
import { swaggerUiOptions } from './http/docs/swagger-ui.js';
import { handleFrameworkError, registerErrorHandler } from './http/errors/error-handler.js';
import { registerReturnRoutes } from './http/routes/returns.js';
import { registerWarrantyRoutes } from './http/routes/warranties.js';
import { InMemoryUnitOfWork } from './infrastructure/repositories/in-memory-unit-of-work.js';
import { demoData } from './mock/data.js';

export interface AppOptions {
  readonly unitOfWork?: UnitOfWork;
  readonly now?: () => Date;
  readonly logger?: FastifyServerOptions['logger'];
  readonly bodyLimit?: number;
}

/** Punto de composición: aquí se sustituye el adaptador, sin cambiar los casos de uso. */
export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: options.bodyLimit ?? 16384,
    frameworkErrors: handleFrameworkError,
  });

  const unitOfWork = options.unitOfWork ?? new InMemoryUnitOfWork(demoData);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerErrorHandler(app);

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Garantías y Devoluciones',
        version: '1.0.0',
        description:
          'Simulación académica. REST + JSON. Los datos se restablecen al reiniciar. Venta 1001: producto 101 ×1 y producto 102 ×2.',
      },
      tags: [
        {
          name: 'Devoluciones',
          description: 'DEVOLUCIONES_VENTA: controla cantidades acumuladas.',
        },
        {
          name: 'Garantías',
          description: 'GARANTIAS: proceso independiente, sin cantidad ni plazo inventado.',
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, swaggerUiOptions);

  registerIntegrationDocs(app);

  registerReturnRoutes(app, new ReturnService(unitOfWork, options.now));
  registerWarrantyRoutes(app, new WarrantyService(unitOfWork, options.now));

  await app.ready();

  return app;
}