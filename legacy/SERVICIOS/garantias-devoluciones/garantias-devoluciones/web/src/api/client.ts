import type { z } from 'zod';
import { apiErrorSchema } from './contracts';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 0,
    public readonly details: readonly { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: object;
  signal?: AbortSignal;
}

/** Valida el JSON recibido y conserva los mensajes y códigos públicos de la API. */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(15000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers: options.body
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      timeout.aborted
        ? 'La solicitud tardó demasiado. Inténtalo de nuevo.'
        : 'No se pudo conectar con el servicio. Comprueba que la API esté en ejecución.',
      'CONNECTION_ERROR',
    );
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(json);
    if (parsed.success) {
      const { message, code, details } = parsed.data.error;
      throw new ApiError(message, code, response.status, details ?? []);
    }
    throw new ApiError(
      'El servicio no pudo atender la solicitud. Inténtalo de nuevo.',
      'SERVICE_ERROR',
      response.status,
    );
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ApiError(
      'La respuesta del servicio no tiene el formato esperado.',
      'INVALID_RESPONSE',
      response.status,
    );
  }
  return result.data;
}

export function asApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError('No se pudo completar la operación.', 'UNEXPECTED_ERROR');
}
