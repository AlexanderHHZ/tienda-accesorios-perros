# Empaquetado Service

Aplicación independiente para registrar y administrar empaquetados: peso, tamaño, largo, ancho, alto y tipo de empacado. Incluye API REST, persistencia SQLite, interfaz web responsive, documentación OpenAPI y pruebas automatizadas.

## Inicio rápido

Instala **Node.js 24 LTS, versión 24.4 o superior dentro de la rama 24**, con npm 11 o 12. Descomprime el ZIP y abre una terminal en `empaquetado-service/`.

```bash
npm ci
npm run setup
npm run dev
```

`npm ci` instala los dos proyectos usando las versiones del lockfile. `setup` crea `api/.env` y `web/.env.local` a partir de sus ejemplos, conserva cualquier configuración existente y aplica las migraciones. La base comienza vacía. No necesitas instalar SQLite, Docker ni un servidor de base de datos.

| Servicio                     | Dirección local                 |
| ---------------------------- | ------------------------------- |
| Frontend                     | http://localhost:3000           |
| API                          | http://localhost:4000/api/v1    |
| Swagger interactivo          | http://localhost:4000/docs      |
| OpenAPI JSON                 | http://localhost:4000/docs/json |
| Salud de API y base de datos | http://localhost:4000/health    |

Opcionalmente, antes de iniciar, ejecuta `npm run db:seed` para insertar seis ejemplos **persistidos en SQLite**. Solo funciona si la tabla está vacía; nunca borra datos ni se ejecuta automáticamente.

Los comandos funcionan en PowerShell, CMD, macOS y Linux. Para detener ambos procesos, usa `Ctrl+C`.

## Qué incluye

- Crear, consultar, editar parcialmente y eliminar empaquetados.
- Validación independiente en frontend, API y restricciones SQL.
- Búsqueda por ID, tamaño o tipo; filtros combinables, ordenamiento y paginación.
- Totales calculados por la API para todos los resultados filtrados.
- Tabla en escritorio y tarjetas en pantallas pequeñas, sin desplazamiento horizontal.
- Diálogos accesibles, confirmación de eliminación, mensajes de éxito, errores y carga.
- Protección contra sobrescritura de registros modificados por otro cliente.
- Swagger con OpenAPI **3.0.3**, ejemplos y prueba de solicitudes.

## Arquitectura y tecnologías

El frontend se comunica exclusivamente mediante **HTTP y JSON** con la API. Solamente la API abre el archivo SQLite. No hay imports del backend dentro del frontend ni dependencia de un framework de cliente en el contrato HTTP.

| Área         | Tecnologías y responsabilidad                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `api/`       | Node.js 24, TypeScript estricto, Fastify 5, Zod 4, Swagger y Vitest                                                    |
| Persistencia | SQLite incluido en Node mediante `node:sqlite`, SQL parametrizado, tablas estrictas, migraciones transaccionales y WAL |
| `web/`       | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 y Lucide React                                             |
| Interacción  | Radix Dialog para foco y modales; SWR para solicitudes, caché y revalidación                                           |
| Tipografía   | Manrope Variable servida localmente desde el paquete instalado; sin peticiones a Google Fonts                          |
| Calidad      | ESLint, Prettier, Vitest y Playwright con Chromium                                                                     |

Las versiones exactas quedan fijadas en los `package.json` y en `package-lock.json`. ESLint se fija a una versión compatible con los plugins de cada proyecto; no se desactivan reglas para ocultar incompatibilidades.

No se implementa autenticación porque está fuera del alcance solicitado. Por defecto los servidores solo escuchan en la interfaz local. CORS controla qué navegadores pueden consumir la API, **no sustituye autorización**. Antes de una publicación pública, deben definirse acceso, HTTPS, copias de seguridad y límites operativos.

## Organización

| Ruta                                      | Contenido                                                            |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `api/src/app.ts`                          | Construcción de Fastify y registro de plugins; separada del arranque |
| `api/src/server.ts`                       | Inicio HTTP y cierre ordenado                                        |
| `api/src/config/`                         | Carga y validación de configuración                                  |
| `api/src/db/`                             | Conexión, migraciones y datos de demostración opcionales             |
| `api/migrations/`                         | Historial SQL verificable mediante checksum                          |
| `api/src/modules/empaquetados/`           | Schemas, rutas, servicio y repositorio del dominio                   |
| `api/src/errors/` y `api/src/plugins/`    | Errores controlados, manejo central y adaptación de OpenAPI          |
| `api/tests/`                              | Integración HTTP y persistencia real con Vitest                      |
| `web/src/app/`                            | Páginas, layout, estilos globales y límites de error                 |
| `web/src/components/`                     | Presentación, formularios, listado y diálogos en archivos `.tsx`     |
| `web/src/services/`                       | Cliente HTTP y operaciones de la API                                 |
| `web/src/hooks/`                          | Consulta con filtros y búsqueda diferida                             |
| `web/src/types/`, `validations/` y `lib/` | Tipos, contratos y utilidades en archivos `.ts`                      |
| `tests/e2e/`                              | Flujos de navegador contra la API real                               |
| `scripts/`                                | Preparación y arranque aislado de pruebas                            |
| `docs/`                                   | Integración, decisiones técnicas, OpenAPI exportado y verificación   |

## Variables de entorno

### Backend: `api/.env`

| Variable        | Ejemplo                                       | Función                                                       |
| --------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `NODE_ENV`      | `development`                                 | `development`, `test` o `production`                          |
| `HOST`          | `127.0.0.1`                                   | Interfaz donde escucha la API                                 |
| `PORT`          | `4000`                                        | Puerto HTTP                                                   |
| `DATABASE_PATH` | `./data/empaquetados.db`                      | Archivo SQLite; relativo a `api/` o ruta absoluta             |
| `CORS_ORIGINS`  | `http://localhost:3000,http://127.0.0.1:3000` | Orígenes exactos separados por coma, sin rutas ni barra final |
| `LOG_LEVEL`     | `info`                                        | Nivel del logger; `silent` para pruebas                       |

No hay credenciales de base de datos porque SQLite es un archivo local. Los ejemplos no contienen secretos. Las variables proporcionadas al proceso tienen precedencia sobre el archivo `.env`.

### Frontend: `web/.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Debe contener la URL versionada completa. No es un secreto: se incluye en el código que recibe el navegador. Después de cambiarla, reinicia desarrollo o vuelve a generar el build de producción. La aplicación muestra un error claro si falta la configuración.

## Base de datos

La tabla `empaquetados` contiene:

| Columna                    | Tipo SQLite | Regla                                |
| -------------------------- | ----------- | ------------------------------------ |
| `id`                       | INTEGER     | Clave primaria autoincremental       |
| `peso`                     | REAL        | Kilogramos, mayor que cero           |
| `tamano`                   | TEXT        | `chico`, `mediano` o `grande`        |
| `largo`, `ancho`, `alto`   | REAL        | Centímetros, cada uno mayor que cero |
| `tipo_empacado`            | TEXT        | `caja` o `bolsa`                     |
| `created_at`, `updated_at` | TEXT        | Fechas ISO 8601 UTC                  |

Las magnitudes tienen un límite técnico de `1 000 000 000`; no se interpretan como límites de un transportista. No se redondean al guardarse. Se usa precisión de coma flotante de SQLite/JavaScript, apropiada para estas medidas; no es un modelo contable.

Las categorías de tamaño se eligen manualmente: no se inventan umbrales ni reglas comerciales. Las dimensiones nunca se almacenan como texto combinado.

```bash
npm run db:migrate
```

Las migraciones también se aplican al iniciar la API. Son repetibles sin duplicar tablas ni datos. No modifiques una migración aplicada: agrega otro archivo con prefijo numérico. El checksum detecta alteraciones del historial.

Para respaldar una instalación local, detén la API y copia la carpeta `api/data/` completa, incluidos los archivos auxiliares si existen. Restaurar consiste en colocar la copia con la API detenida. Para respaldos en caliente utiliza la API de backup de SQLite; no copies únicamente el `.db` mientras hay escrituras activas.

## Ejecución y scripts

Desde la raíz:

| Comando                | Resultado                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `npm ci`               | Instalación reproducible de API, frontend y herramientas    |
| `npm run setup`        | Preparar variables y aplicar migraciones                    |
| `npm run dev`          | API y frontend al mismo tiempo                              |
| `npm run dev:api`      | Solo API                                                    |
| `npm run dev:web`      | Solo frontend                                               |
| `npm run typecheck`    | Comprobación estricta de API, frontend y pruebas E2E        |
| `npm run lint`         | Lint sin advertencias permitidas                            |
| `npm test`             | Pruebas Vitest                                              |
| `npm run build`        | Compilar backend y frontend                                 |
| `npm start`            | Ejecutar ambos builds; requiere `npm run build` previamente |
| `npm run check`        | TypeScript, lint, tests y builds                            |
| `npm run test:e2e`     | Navegador contra API y base temporales                      |
| `npm run docs:export`  | Regenerar `docs/openapi.json` sin tocar datos de desarrollo |
| `npm run format`       | Formatear código y documentación                            |
| `npm run format:check` | Verificar formato                                           |

También puedes abrir dos terminales, ejecutar `cd api` / `cd web` y usar `npm run dev`, `npm run build` o `npm start` dentro de cada proyecto. Ejecuta la instalación inicial en la raíz para respetar el único lockfile del workspace.

Para producción local:

```bash
npm run build
npm start
```

Configura `NODE_ENV=production` en `api/.env` para una ejecución productiva. Next.js utiliza su modo de producción con `next start`. Para cambiar el puerto del frontend individualmente: `npm run dev -w web -- --port 3001`; actualiza también `CORS_ORIGINS`.

## Contrato HTTP

Envía `Content-Type: application/json` en POST y PATCH. Se rechazan strings numéricos, valores nulos, campos desconocidos, medidas no positivas y enums inválidos. Los IDs de ruta deben ser enteros positivos escritos en decimal, dentro del rango seguro de JavaScript.

| Método | Ruta                       | Éxito                                   |
| ------ | -------------------------- | --------------------------------------- |
| POST   | `/api/v1/empaquetados`     | `201`, registro y encabezado `Location` |
| GET    | `/api/v1/empaquetados`     | `200`, colección y metadatos            |
| GET    | `/api/v1/empaquetados/:id` | `200`, un registro                      |
| PATCH  | `/api/v1/empaquetados/:id` | `200`, registro actualizado             |
| DELETE | `/api/v1/empaquetados/:id` | `204`, sin cuerpo                       |
| GET    | `/health`                  | `200`, API y SQLite disponibles         |

Crear:

```http
POST /api/v1/empaquetados
Content-Type: application/json

{
  "peso": 4.5,
  "tamano": "mediano",
  "medidas": { "largo": 40, "ancho": 30, "alto": 20 },
  "tipoEmpacado": "caja"
}
```

Respuesta de ejemplo, con ID y fechas ilustrativos:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "peso": 4.5,
    "tamano": "mediano",
    "medidas": { "largo": 40, "ancho": 30, "alto": 20 },
    "tipoEmpacado": "caja",
    "createdAt": "2026-10-06T00:00:00.000Z",
    "updatedAt": "2026-10-06T00:00:00.000Z"
  }
}
```

Actualización parcial: `PATCH /api/v1/empaquetados/1` con `{"medidas":{"alto":22}}` conserva el resto del registro. Un objeto vacío o `{"medidas":{}}` devuelve `400`.

### Búsqueda y paginación

```http
GET /api/v1/empaquetados?tamano=mediano&tipoEmpacado=caja&page=1&limit=10&sortBy=peso&order=asc
```

| Parámetro      | Valores / comportamiento                                                                |
| -------------- | --------------------------------------------------------------------------------------- |
| `q`            | Máximo 80 caracteres; ID exacto (`1`, `EMP-0001`) o coincidencia parcial de tamaño/tipo |
| `tamano`       | Filtro exacto: `chico`, `mediano`, `grande`                                             |
| `tipoEmpacado` | Filtro exacto: `caja`, `bolsa`                                                          |
| `page`         | Desde 1; máximo técnico 1 000 000                                                       |
| `limit`        | 1 a 100; predeterminado 10                                                              |
| `sortBy`       | `createdAt`, `peso` o `id`; predeterminado `createdAt`                                  |
| `order`        | `asc` o `desc`; predeterminado `desc`                                                   |

La respuesta tiene `success`, `data` y `meta`. `meta` incluye `total`, `page`, `limit`, `totalPages` y `summary` con `cajas`, `bolsas` y `pesoTotal`. Los totales abarcan **todos los resultados filtrados**. Una colección vacía devuelve `200`, `data: []` y `totalPages: 0`. Una página fuera de rango devuelve una colección vacía, conservando los totales.

### Ediciones concurrentes

PATCH y DELETE admiten `X-Expected-Updated-At` con el `updatedAt` obtenido al consultar el registro. Si otro cliente lo cambió, responden `409 EDIT_CONFLICT`. El frontend siempre envía este encabezado. Sin él, la API permite la operación sobre la versión que encuentra al comenzar; la escritura final también compara versiones para detectar una carrera con otro proceso.

### Errores

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos.",
    "requestId": "req-1",
    "details": [{ "path": "peso", "message": "Debe ser mayor que 0." }]
  }
}
```

| HTTP | Códigos principales                        |
| ---- | ------------------------------------------ |
| 400  | `VALIDATION_ERROR`, `INVALID_JSON`         |
| 403  | `ORIGIN_NOT_ALLOWED`                       |
| 404  | `NOT_FOUND`, `ROUTE_NOT_FOUND`             |
| 409  | `EDIT_CONFLICT`, `DATABASE_CONFLICT`       |
| 413  | `PAYLOAD_TOO_LARGE` (cuerpo máximo 16 KiB) |
| 415  | `UNSUPPORTED_MEDIA_TYPE`                   |
| 500  | `DATABASE_ERROR`, `INTERNAL_ERROR`         |
| 503  | `DATABASE_BUSY`                            |

Las respuestas no exponen SQL, stack traces ni mensajes internos del motor. El logger del servidor conserva el diagnóstico y un identificador de solicitud. Las magnitudes inválidas se rechazan antes de escribir. No hay una restricción artificial que impida registrar dos empaquetados con las mismas características.

## Pruebas

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Vitest utiliza archivos SQLite temporales y solicitudes a Fastify con `inject`, sin sustituir el repositorio por arrays. Comprueba CRUD, entradas inválidas, búsquedas, paginación, conflictos, persistencia tras reinicio, restricciones SQL, CORS, errores y validez de OpenAPI.

Para los recorridos completos de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

En Linux, si faltan librerías del sistema, utiliza `npx playwright install --with-deps chromium`. En CI se admite `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para un Chromium ya instalado.

Las pruebas E2E levantan la API en `4100` y Next.js en `3100`, y eliminan su base temporal al finalizar. Detén otros procesos `next dev` de este mismo proyecto antes de ejecutarlas: Next.js mantiene un bloqueo por directorio. Los resultados se generan en `playwright-report/` y `test-results/`, excluidos del control de versiones y del ZIP de entrega.

Consulta [docs/VERIFICACION.md](docs/VERIFICACION.md) para los resultados de esta entrega.

## Integración y decisiones

- [Ejemplos en JavaScript, Python, Java y C#](docs/INTEGRACION.md).
- [Decisiones de arquitectura, persistencia y frontend](docs/ARQUITECTURA.md).
- [Especificación OpenAPI exportada](docs/openapi.json).

Para integrar cualquier otro lenguaje basta un cliente HTTP capaz de enviar JSON; no necesita React, Next.js ni acceso directo a SQLite.

## Problemas frecuentes

| Síntoma                                  | Acción                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Node informa que no existe `node:sqlite` | Instala Node.js 24.4 o posterior de la rama 24 y verifica `node --version`                         |
| El frontend no conecta                   | Confirma que la API está activa, abre `/health`, revisa `NEXT_PUBLIC_API_URL` y reinicia Next.js   |
| El navegador informa un bloqueo CORS     | Añade su origen exacto a `CORS_ORIGINS`; `localhost` y `127.0.0.1` son orígenes distintos          |
| El puerto está ocupado                   | Detén el proceso anterior o cambia puertos y variables asociadas                                   |
| Conflicto al editar                      | Cierra el formulario, actualiza el listado y vuelve a abrir el registro                            |
| Error al crear la base                   | Asegura permisos de escritura en la carpeta indicada por `DATABASE_PATH`                           |
| Migración modificada                     | Conserva intacta la migración histórica y agrega una nueva; no borres datos para evitar el control |

El ZIP contiene código, configuración de ejemplo, lockfile, migraciones, pruebas y documentación. Excluye dependencias instaladas, builds, bases de datos, archivos `.env` reales y resultados temporales.

Después de instalar y verificar tu copia, inicializa tu repositorio y realiza un **commit y push** del código estable. `.gitignore` protege los archivos de entorno y los datos locales.
