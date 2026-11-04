import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { WarrantyService } from '../../application/warranties/warranty-service.js';
import { errorResponses, idParamsSchema } from '../schemas/common.js';
import { createWarrantySchema, warrantyResponseSchema, warrantyStatusSchema } from '../schemas/warranties.js';
import { serializeWarranty } from '../serialization.js';

export function registerWarrantyRoutes(app: FastifyInstance, service: WarrantyService): void {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const url = '/api/v1/warranties';

  routes.post(url, {
    schema: {
      tags: ['Garantías'], operationId: 'createWarranty', summary: 'Registrar una garantía',
      description: 'Inicia en PENDING y sin resolución. No admite cantidad ni otra garantía PENDING o APPROVED para la misma pareja.',
      body: createWarrantySchema,
      response: { 201: warrantyResponseSchema, ...errorResponses },
    },
  }, async (request, reply) => {
    const result = serializeWarranty(await service.create(request.body));
    return reply.code(201).header('Location', `${url}/${result.id}`).send(result);
  });

  routes.get(url, {
    schema: {
      tags: ['Garantías'], operationId: 'listWarranties', summary: 'Consultar garantías',
      description: 'Devuelve todas las garantías en orden ascendente por ID; sin filtros ni paginación.',
      response: { 200: warrantyResponseSchema.array(), ...errorResponses },
    },
  }, async () => (await service.list()).map(serializeWarranty));

  routes.get(`${url}/:id`, {
    schema: {
      tags: ['Garantías'], operationId: 'getWarranty', summary: 'Consultar una garantía por ID',
      params: idParamsSchema,
      response: { 200: warrantyResponseSchema, ...errorResponses },
    },
  }, async (request) => serializeWarranty(await service.getById(request.params.id)));

  routes.patch(`${url}/:id/status`, {
    schema: {
      tags: ['Garantías'], operationId: 'changeWarrantyStatus', summary: 'Cambiar estado y registrar resolución',
      description: 'PENDING → APPROVED o REJECTED; APPROVED → COMPLETED. COMPLETED requiere resolución previa o enviada en esta petición.',
      params: idParamsSchema, body: warrantyStatusSchema,
      response: { 200: warrantyResponseSchema, ...errorResponses },
    },
  }, async (request) => serializeWarranty(await service.changeStatus(
    request.params.id, request.body.status, request.body.resolution,
  )));
}
