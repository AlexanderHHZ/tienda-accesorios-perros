import { z } from 'zod';
import { errorResponseSchema } from '@/validations/empaquetado';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code = 'NETWORK_ERROR',
    public readonly details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  const result = z.url().safeParse(configured);
  if (!result.success || !/^https?:\/\//.test(result.data)) {
    throw new ApiError(
      'Falta configurar NEXT_PUBLIC_API_URL en web/.env.local.',
      0,
      'CONFIG_ERROR',
    );
  }
  return result.data.replace(/\/+$/, '');
}

export function getDocumentationUrl(): string | undefined {
  try {
    return new URL('/docs', getApiUrl()).href;
  } catch {
    return undefined;
  }
}

export async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${getApiUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal: options.signal ?? AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      'No pudimos conectar con la API. Comprueba que esté encendida y vuelve a intentarlo.',
    );
  }
  if (response.status === 204) return undefined;
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    if (parsed.success)
      throw new ApiError(
        parsed.data.error.message,
        response.status,
        parsed.data.error.code,
        parsed.data.error.details,
      );
    throw new ApiError(
      'El servidor no pudo completar la solicitud.',
      response.status,
      'HTTP_ERROR',
    );
  }
  return body;
}

export function parseResponse<T extends z.ZodType>(schema: T, payload: unknown): z.output<T> {
  const result = schema.safeParse(payload);
  if (!result.success)
    throw new ApiError(
      'La API devolvió una respuesta con formato inesperado.',
      502,
      'INVALID_RESPONSE',
    );
  return result.data;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'No fue posible completar la operación. Inténtalo de nuevo.';
}
