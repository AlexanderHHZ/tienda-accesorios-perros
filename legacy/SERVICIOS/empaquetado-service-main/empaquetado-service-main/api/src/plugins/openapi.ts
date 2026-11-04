import type { SwaggerTransformObject } from '@fastify/swagger';
import { createJsonSchemaTransformObject } from 'fastify-type-provider-zod';

const transformSchemas = createJsonSchemaTransformObject({
  zodToJsonConfig: { target: 'openapi-3.0' },
});

export const transformOpenApi: SwaggerTransformObject = (context) => {
  const document = transformSchemas(context);
  if ('openapi' in document) {
    // HTTP 204 carece de representación: no documentar `null` como un cuerpo JSON.
    for (const path of Object.values(document.paths ?? {})) {
      for (const method of ['get', 'post', 'patch', 'put', 'delete', 'options', 'head'] as const) {
        const response = path?.[method]?.responses?.['204'];
        if (response && 'content' in response) delete response.content;
      }
    }
  }
  return document;
};
