import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { ReturnService } from '../../application/returns/return-service.js';
import { errorResponses, idParamsSchema } from '../schemas/common.js';
import { createReturnSchema, returnResponseSchema, returnStatusSchema } from '../schemas/returns.js';
import { serializeReturn } from '../serialization.js';

export function registerReturnRoutes(app: FastifyInstance, service: ReturnService): void {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const url = '/api/v1/returns';

  routes.post(url, {
    schema: {
      tags: ['Devoluciones'], operationId: 'createReturn', summary: 'Registrar una devolución',
      description: 'Inicia en PENDING. Pendientes, aprobadas y completadas consumen la capacidad; rechazadas la liberan.',
      body: createReturnSchema,
      response: { 201: returnResponseSchema, ...errorResponses },
    },
  }, async (request, reply) => {
    const result = serializeReturn(await service.create(request.body));
    return reply.code(201).header('Location', `${url}/${result.id}`).send(result);
  });

  routes.get(url, {
    schema: {
      tags: ['Devoluciones'], operationId: 'listReturns', summary: 'Consultar devoluciones',
      description: 'Devuelve todas las devoluciones en orden ascendente por ID; sin filtros ni paginación.',
      response: { 200: returnResponseSchema.array(), ...errorResponses },
    },
  }, async () => (await service.list()).map(serializeReturn));

  routes.get(`${url}/:id`, {
    schema: {
      tags: ['Devoluciones'], operationId: 'getReturn', summary: 'Consultar una devolución por ID',
      params: idParamsSchema,
      response: { 200: returnResponseSchema, ...errorResponses },
    },
  }, async (request) => serializeReturn(await service.getById(request.params.id)));

  routes.patch(`${url}/:id/status`, {
    schema: {
      tags: ['Devoluciones'], operationId: 'changeReturnStatus', summary: 'Cambiar estado de una devolución',
      description: 'Solo PENDING → APPROVED, PENDING → REJECTED y APPROVED → COMPLETED. Repetir el estado produce 409.',
      params: idParamsSchema, body: returnStatusSchema,
      response: { 200: returnResponseSchema, ...errorResponses },
    },
  }, async (request) => serializeReturn(await service.changeStatus(request.params.id, request.body.status)));
}
