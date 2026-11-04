import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

import { DomainError, type DomainErrorCode } from '../../domain/errors.js';

const domainStatus: Readonly<Record<DomainErrorCode, 400 | 404 | 409>> = {
  SALE_NOT_FOUND: 404,
  PRODUCT_NOT_FOUND: 404,
  PRODUCT_NOT_IN_SALE: 400,
  INVALID_ID: 400,
  INVALID_QUANTITY: 400,
  INVALID_REASON: 400,
  INVALID_RESOLUTION: 400,
  RESOLUTION_REQUIRED: 400,
  RETURN_QUANTITY_EXCEEDED: 409,
  RETURN_NOT_FOUND: 404,
  WARRANTY_NOT_FOUND: 404,
  ACTIVE_WARRANTY_ALREADY_EXISTS: 409,
  INVALID_STATUS_TRANSITION: 409,
};

/**
 * Maneja errores que Fastify puede producir antes de que una petición
 * alcance las rutas o el manejador global de errores.
 */
export function handleFrameworkError(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error.code === 'FST_ERR_BAD_URL') {
    reply.code(400).send({
      error: {
        code: 'INVALID_URL',
        message: 'La URL de la solicitud no es válida.',
      },
    });
    return;
  }

  request.log.error({ err: error }, 'Fallo interno del enrutador');

  reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'No se pudo procesar la solicitud.',
    },
  });
}

/**
 * Centraliza los errores de dominio, validación y procesamiento HTTP
 * para mantener respuestas consistentes en toda la API.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'La ruta solicitada no existe.',
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply.code(domainStatus[error.code]).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const invalidQuantity =
        error.validationContext === 'body'
        && error.validation.some(
          (issue) => issue.instancePath === '/quantity',
        );

      return reply.code(400).send({
        error: {
          code: invalidQuantity ? 'INVALID_QUANTITY' : 'VALIDATION_ERROR',
          message: invalidQuantity
            ? 'La cantidad debe ser un entero mayor que cero.'
            : 'La solicitud contiene campos inválidos.',
          details: error.validation.map((issue) => ({
            path: `${error.validationContext ?? 'request'}${issue.instancePath}`,
            message: issue.message ?? 'Valor inválido.',
          })),
        },
      });
    }

    const code =
      error instanceof Error && 'code' in error
        ? error.code
        : undefined;

    if (
      code === 'FST_ERR_CTP_INVALID_JSON_BODY'
      || code === 'FST_ERR_CTP_EMPTY_JSON_BODY'
    ) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_JSON',
          message: 'El cuerpo debe contener JSON válido.',
        },
      });
    }

    if (code === 'FST_ERR_CTP_INVALID_CONTENT_LENGTH') {
      return reply.code(400).send({
        error: {
          code: 'INVALID_CONTENT_LENGTH',
          message: 'El tamaño del cuerpo de la solicitud no es válido.',
        },
      });
    }

    if (code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.code(413).send({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'El cuerpo de la solicitud es demasiado grande.',
        },
      });
    }

    if (code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
      return reply.code(415).send({
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Utiliza Content-Type: application/json.',
        },
      });
    }

    request.log.error(
      { err: error },
      'Fallo interno al procesar la solicitud',
    );

    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'No se pudo procesar la solicitud.',
      },
    });
  });
}
