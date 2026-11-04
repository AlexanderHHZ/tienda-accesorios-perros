import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { AppError } from '../errors/app-error.js';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    let failure = new AppError(
      500,
      'INTERNAL_ERROR',
      'Ocurrió un error interno. Inténtalo de nuevo.',
    );
    if (error instanceof AppError) failure = error;
    else if (hasZodFastifySchemaValidationErrors(error)) {
      failure = new AppError(
        400,
        'VALIDATION_ERROR',
        'Los datos proporcionados no son válidos.',
        error.validation.map((issue) => ({
          path:
            issue.instancePath.replace(/^\//, '').replaceAll('/', '.') ||
            error.validationContext ||
            'body',
          message: issue.message ?? 'Valor no válido.',
        })),
      );
    } else if (error instanceof Error && 'code' in error) {
      if (
        error.code === 'FST_ERR_CTP_INVALID_JSON_BODY' ||
        error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY'
      ) {
        failure = new AppError(400, 'INVALID_JSON', 'El cuerpo debe contener JSON válido.');
      } else if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
        failure = new AppError(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Utiliza Content-Type: application/json.',
        );
      } else if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
        failure = new AppError(413, 'PAYLOAD_TOO_LARGE', 'El cuerpo supera el límite de 16 KiB.');
      } else if (String(error.code).startsWith('ERR_SQLITE')) {
        const sqliteCode =
          'errcode' in error && typeof error.errcode === 'number' ? error.errcode : 0;
        if ((sqliteCode & 255) === 5 || (sqliteCode & 255) === 6) {
          failure = new AppError(
            503,
            'DATABASE_BUSY',
            'La base de datos está ocupada. Inténtalo de nuevo.',
          );
        } else if ([1555, 2067].includes(sqliteCode)) {
          failure = new AppError(
            409,
            'DATABASE_CONFLICT',
            'El registro entra en conflicto con uno existente.',
          );
        } else {
          failure = new AppError(
            500,
            'DATABASE_ERROR',
            'No se pudo completar la operación de datos.',
          );
        }
      }
    }
    if (failure.statusCode >= 500) request.log.error({ err: error }, 'Error al procesar solicitud');
    void reply.status(failure.statusCode).send({
      success: false,
      error: {
        code: failure.code,
        message: failure.message,
        requestId: request.id,
        ...(failure.details ? { details: failure.details } : {}),
      },
    });
  });
  app.setNotFoundHandler(() => {
    throw new AppError(404, 'ROUTE_NOT_FOUND', 'La ruta solicitada no existe.');
  });
}
