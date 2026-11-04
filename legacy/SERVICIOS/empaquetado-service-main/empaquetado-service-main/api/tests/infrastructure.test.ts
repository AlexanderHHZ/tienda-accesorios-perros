import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';
import { fixture } from './helpers.js';
import { buildApp } from '../src/app.js';
import { itemResponseSchema } from '../src/modules/empaquetados/schemas.js';

describe('Persistencia, seguridad y documentación', () => {
  let context: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    context = await fixture();
  });
  afterEach(async () => {
    await context.close();
  });

  it('conserva los registros al reiniciar y no repite migraciones', async () => {
    const item = await context.create();
    await context.app.close();
    const restarted = await buildApp(context.config);
    try {
      const response = await restarted.inject(`/api/v1/empaquetados/${item.id}`);
      expect(itemResponseSchema.parse(response.json<unknown>()).data).toEqual(item);
      const db = new DatabaseSync(context.config.DATABASE_PATH);
      try {
        expect(db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get()?.count).toBe(1);
      } finally {
        db.close();
      }
    } finally {
      await restarted.close();
    }
  });

  it('SQLite también impide valores negativos aunque se evite la API', () => {
    const db = new DatabaseSync(context.config.DATABASE_PATH);
    try {
      expect(() =>
        db
          .prepare(
            `INSERT INTO empaquetados (peso,tamano,largo,ancho,alto,tipo_empacado,created_at,updated_at)
        VALUES (-1,'chico',1,1,1,'caja','2026-10-06','2026-10-06')`,
          )
          .run(),
      ).toThrow();
    } finally {
      db.close();
    }
  });

  it('admite preflight del frontend y rechaza otro origen', async () => {
    const preflight = await context.app.inject({
      method: 'OPTIONS',
      url: '/api/v1/empaquetados',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'content-type,x-expected-updated-at',
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    const blocked = await context.app.inject({
      method: 'POST',
      url: '/api/v1/empaquetados',
      headers: { origin: 'https://other.example' },
      payload: {},
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sirve Swagger y una especificación OpenAPI 3.0.3 válida', async () => {
    const spec = context.app.swagger();
    expect(spec).toHaveProperty('openapi', '3.0.3');
    expect(spec.paths?.['/api/v1/empaquetados']).toHaveProperty('post');
    expect(spec.paths?.['/api/v1/empaquetados/{id}']).toHaveProperty('patch');
    expect(
      spec.paths?.['/api/v1/empaquetados/{id}']?.delete?.responses?.['204'],
    ).not.toHaveProperty('content');
    await expect(SwaggerParser.validate(JSON.parse(JSON.stringify(spec)))).resolves.toBeDefined();
    const html = await context.app.inject('/docs/');
    expect(html.statusCode).toBe(200);
    expect(html.body).toContain('swagger-ui');
    expect((await context.app.inject('/docs/json')).statusCode).toBe(200);
  });

  it('distingue errores de base de datos sin filtrar SQL o stack', async () => {
    const db = new DatabaseSync(context.config.DATABASE_PATH);
    db.exec('DROP TABLE empaquetados');
    db.close();
    const response = await context.app.inject('/api/v1/empaquetados');
    expect(response.statusCode).toBe(500);
    expect(response.json<unknown>()).toMatchObject({
      success: false,
      error: { code: 'DATABASE_ERROR' },
    });
    expect(response.body).not.toMatch(/SELECT|stack|SQLITE|no such table/);
  });

  it('comprueba salud y maneja rutas desconocidas', async () => {
    expect((await context.app.inject('/health')).statusCode).toBe(200);
    const response = await context.app.inject('/not-found');
    expect(response.statusCode).toBe(404);
    expect(response.json<unknown>()).toMatchObject({
      success: false,
      error: { code: 'ROUTE_NOT_FOUND' },
    });
  });
});
