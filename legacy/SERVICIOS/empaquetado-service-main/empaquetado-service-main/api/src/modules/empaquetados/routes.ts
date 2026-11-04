import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  createSchema,
  errorResponseSchema,
  idSchema,
  itemResponseSchema,
  listResponseSchema,
  patchSchema,
  querySchema,
  versionHeadersSchema,
} from './schemas.js';
import type { EmpaquetadosRepository } from './repository.js';
import { EmpaquetadosService } from './service.js';

export async function registerEmpaquetadosRoutes(
  app: FastifyInstance,
  repository: EmpaquetadosRepository,
) {
  const api = app.withTypeProvider<ZodTypeProvider>();
  const service = new EmpaquetadosService(repository);
  const tags = ['Empaquetados'];
  const errors = {
    400: errorResponseSchema,
    403: errorResponseSchema,
    500: errorResponseSchema,
    503: errorResponseSchema,
  };

  api.post(
    '/api/v1/empaquetados',
    {
      schema: {
        tags,
        operationId: 'crearEmpaquetado',
        summary: 'Crear un empaquetado',
        description:
          'Persiste un registro. Peso en kg, dimensiones en cm. No se aceptan campos desconocidos.',
        body: createSchema,
        response: {
          201: itemResponseSchema,
          ...errors,
          409: errorResponseSchema,
          413: errorResponseSchema,
          415: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const data = repository.create(request.body);
      return reply
        .status(201)
        .header('Location', `/api/v1/empaquetados/${data.id}`)
        .send({ success: true, data });
    },
  );

  api.get(
    '/api/v1/empaquetados',
    {
      schema: {
        tags,
        operationId: 'listarEmpaquetados',
        summary: 'Listar, buscar y filtrar empaquetados',
        description:
          'Paginación desde 1. Máximo 100 registros por página. Los totales corresponden a todos los resultados filtrados, no solo a la página.',
        querystring: querySchema,
        response: { 200: listResponseSchema, ...errors },
      },
    },
    async (request) => ({ success: true as const, ...repository.list(request.query) }),
  );

  api.get(
    '/api/v1/empaquetados/:id',
    {
      schema: {
        tags,
        operationId: 'obtenerEmpaquetado',
        summary: 'Obtener un empaquetado por ID',
        params: idSchema,
        response: { 200: itemResponseSchema, ...errors, 404: errorResponseSchema },
      },
    },
    async (request) => ({ success: true as const, data: service.get(request.params.id) }),
  );

  api.patch(
    '/api/v1/empaquetados/:id',
    {
      schema: {
        tags,
        operationId: 'actualizarEmpaquetado',
        summary: 'Actualizar parcialmente un empaquetado',
        description:
          'Permite actualizar una sola dimensión. Se rechazan {} y medidas vacías. El encabezado X-Expected-Updated-At evita sobrescribir cambios de otro cliente.',
        params: idSchema,
        body: patchSchema,
        headers: versionHeadersSchema,
        response: {
          200: itemResponseSchema,
          ...errors,
          404: errorResponseSchema,
          409: errorResponseSchema,
          413: errorResponseSchema,
          415: errorResponseSchema,
        },
      },
    },
    async (request) => ({
      success: true as const,
      data: service.update(
        request.params.id,
        request.body,
        request.headers['x-expected-updated-at'],
      ),
    }),
  );

  api.delete(
    '/api/v1/empaquetados/:id',
    {
      schema: {
        tags,
        operationId: 'eliminarEmpaquetado',
        summary: 'Eliminar un empaquetado',
        description:
          'Eliminación permanente. Responde 204 sin cuerpo. Admite protección opcional contra cambios simultáneos.',
        params: idSchema,
        headers: versionHeadersSchema,
        response: {
          204: z.null().describe('Eliminado, sin contenido.'),
          ...errors,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      service.delete(request.params.id, request.headers['x-expected-updated-at']);
      return reply.status(204).send(null);
    },
  );
}
