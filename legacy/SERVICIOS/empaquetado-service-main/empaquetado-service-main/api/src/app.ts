import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  createJsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { readConfig } from './config/env.js';
import type { AppConfig } from './config/env.js';
import { openDatabase } from './db/database.js';
import { AppError } from './errors/app-error.js';
import { EmpaquetadosRepository } from './modules/empaquetados/repository.js';
import { registerEmpaquetadosRoutes } from './modules/empaquetados/routes.js';
import { errorResponseSchema } from './modules/empaquetados/schemas.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerIntegrationDocs } from './plugins/integration-docs.js';
import { transformOpenApi } from './plugins/openapi.js';
import { swaggerUiTheme } from './plugins/swagger-ui-theme.js';

export async function buildApp(
  config: AppConfig = readConfig(),
) {
  const app = Fastify({
    logger:
      config.LOG_LEVEL === 'silent'
        ? false
        : {
            level: config.LOG_LEVEL,
            redact: [
              'req.headers.authorization',
              'req.headers.cookie',
            ],
          },
    bodyLimit: 16 * 1024,
    requestTimeout: 15_000,
  });

  registerErrorHandler(app);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const db = openDatabase(config.DATABASE_PATH);

  app.addHook('onClose', async () => {
    db.close();
  });

  try {
    await app.register(helmet, {
      global: true,
    });

    await app.register(cors, {
      origin(origin, callback) {
        // Los clientes HTTP que no envían Origin, como Python,
        // Java o cURL, no están sujetos a CORS del navegador.
        if (
          !origin ||
          config.CORS_ORIGINS.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(
          new AppError(
            403,
            'ORIGIN_NOT_ALLOWED',
            'El origen no está permitido.',
          ),
          false,
        );
      },

      credentials: false,

      methods: [
        'GET',
        'POST',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'X-Expected-Updated-At',
      ],

      exposedHeaders: ['Location'],
    });

    app.addHook(
      'onRequest',
      async (request, reply) => {
        if (!request.url.startsWith('/api/')) {
          return;
        }

        reply.header(
          'Cache-Control',
          'no-store',
        );

        if (
          ['POST', 'PATCH'].includes(request.method) &&
          !/^application\/json(?:\s*;|$)/i.test(
            request.headers['content-type'] ?? '',
          )
        ) {
          throw new AppError(
            415,
            'UNSUPPORTED_MEDIA_TYPE',
            'Utiliza Content-Type: application/json.',
          );
        }
      },
    );

    await app.register(swagger, {
      openapi: {
        openapi: '3.0.3',

        info: {
          title: 'Empaquetado Service API',
          version: '1.0.0',
          description:
            'API REST independiente. Peso en kg y medidas en cm. Respuestas JSON; DELETE devuelve 204. Sin autenticación en este alcance.',
        },

        tags: [
          {
            name: 'Empaquetados',
            description:
              'Registro y administración de empaquetados.',
          },
          {
            name: 'Sistema',
            description:
              'Disponibilidad de la API.',
          },
        ],
      },

      transform: createJsonSchemaTransform({
        zodToJsonConfig: {
          target: 'openapi-3.0',
        },
      }),

      transformObject: transformOpenApi,
    });

    // Documentación complementaria para consumidores externos.
    // Estas rutas no forman parte del contrato OpenAPI.
    await registerIntegrationDocs(app);

    await app.register(swaggerUi, {
      routePrefix: '/docs',

      staticCSP: true,

      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },

      // Personalización visual aislada de Swagger UI.
      // No modifica los archivos internos del paquete.
      theme: swaggerUiTheme,
    });

    app
      .withTypeProvider<ZodTypeProvider>()
      .get(
        '/health',
        {
          schema: {
            tags: ['Sistema'],
            summary:
              'Comprobar API y base de datos',
            operationId: 'health',

            response: {
              200: z.object({
                success: z.literal(true),

                data: z.object({
                  status: z.literal('ok'),
                }),
              }),

              500: errorResponseSchema,
            },
          },
        },

        async () => {
          db.prepare('SELECT 1').get();

          return {
            success: true as const,

            data: {
              status: 'ok' as const,
            },
          };
        },
      );

    await registerEmpaquetadosRoutes(
      app,
      new EmpaquetadosRepository(db),
    );

    await app.ready();

    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
