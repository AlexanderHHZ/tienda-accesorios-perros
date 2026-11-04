# Garantías y Devoluciones

Servicio independiente para registrar y consultar devoluciones de venta y garantías de un comercio electrónico. La simulación funciona con datos en memoria y se demuestra desde Swagger, sin frontend ni base de datos.

El contrato externo es **HTTP + JSON + OpenAPI**. Los tipos TypeScript son internos: un consumidor Java, PHP, Python, C#, Kotlin o Dart no necesita conocerlos.

## Inicio rápido

Requiere **Node.js 24.x** y npm. No necesitas Docker, credenciales ni un servidor de base de datos.

Después de extraer el proyecto, abre una terminal dentro de `garantias-devoluciones`:

```bash
npm install
npm run dev
```

Abre [Swagger UI](http://localhost:3000/docs/) y utiliza **Try it out → Execute**. El documento OpenAPI está en [http://localhost:3000/docs/json](http://localhost:3000/docs/json).

Para ejecutar la compilación, detén el servidor de desarrollo con `Ctrl+C` y ejecuta:

```bash
npm run build
npm start
```

En una instalación reproducible con el lockfile existente puedes utilizar `npm ci` en lugar de `npm install`.

## Alcance

Incluye dos procesos separados, validación de compras, cantidades acumuladas, estados, resolución de garantías, errores consistentes, documentación interactiva y pruebas.

No implementa autenticación, usuarios, inventario, pagos, reembolsos monetarios, envíos, comprobantes ni operaciones con proveedores. `COMPLETED` registra el cierre administrativo de una solicitud; no mueve existencias ni ejecuta un reembolso o reemplazo real.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Node.js 24.x y TypeScript 7 | Ejecución y tipado estricto |
| Fastify 5 | API REST |
| Zod 4 | Validación de entradas y respuestas |
| `fastify-type-provider-zod` | Integra los esquemas de Zod con Fastify y OpenAPI |
| `@fastify/swagger` y `@fastify/swagger-ui` | Contrato OpenAPI 3.0.3 y consola interactiva |
| Vitest 5 | Pruebas de dominio, aplicación, repositorios y HTTP |
| `tsx` | Carga TypeScript en desarrollo; la vigilancia usa `node --watch` |

Las versiones exactas resueltas están en `package-lock.json`. El código fuente y las pruebas son TypeScript; `npm run build` genera JavaScript en `dist/` para que Node lo ejecute.

## Estructura y arquitectura

| Ruta | Responsabilidad |
| --- | --- |
| `src/domain/returns/` | Entidad de devolución, capacidad y contrato de repositorio |
| `src/domain/warranties/` | Entidad de garantía, duplicados activos, resolución y contrato |
| `src/domain/products/product.ts` | Producto y contrato de consulta |
| `src/domain/sales/sale.ts` | Venta, detalle y contrato de consulta |
| `src/domain/process-status.ts` | Transiciones permitidas |
| `src/domain/errors.ts`, `validation.ts`, `unit-of-work.ts` | Errores, validaciones de negocio y atomicidad |
| `src/application/returns/return-service.ts` | Casos de uso de devoluciones |
| `src/application/warranties/warranty-service.ts` | Casos de uso de garantías |
| `src/application/purchase-context.ts` | Verificación de la compra y suma de sus líneas |
| `src/infrastructure/repositories/` | Cuatro repositorios en memoria y unidad de trabajo |
| `src/http/routes/`, `schemas/`, `errors/` | Endpoints, Zod/OpenAPI y traducción de errores |
| `src/http/serialization.ts` | Mapeo explícito del modelo a JSON |
| `src/mock/data.ts` | Las cinco colecciones de datos de ejemplo |
| `src/app.ts` | Composición e inyección de dependencias; no abre puertos |
| `src/config.ts`, `src/server.ts` | Configuración, escucha y cierre del servidor |
| `tests/` | Pruebas y fixture con reloj fijo |
| `docs/ARCHITECTURE.md` | Decisiones, límites del modelo y persistencia |
| `docs/INTEGRATION.md` | Contrato para otros equipos y tecnologías |

El dominio no importa Fastify, Zod ni adaptadores. La aplicación depende de interfaces. Las rutas validan, llaman al caso de uso y serializan; no deciden reglas del negocio. Los cuatro casos de uso de cada proceso se agrupan en un servicio pequeño para evitar archivos sin responsabilidad suficiente.

## Modelo de datos respetado

Se revisaron `Tablas y campos.docx` y el diagrama entidad-relación proporcionados. El diagrama es resumido: omite `PRODUCTOS.descripcion`, `DEVOLUCIONES_VENTA.motivo/fecha` y `GARANTIAS.fecha_solicitud/motivo/resolucion`, que sí están explícitos en el documento y en el requerimiento. Se conservaron esos campos del documento y las relaciones del diagrama.

| Tabla | Columnas representadas, sin adiciones |
| --- | --- |
| PRODUCTOS | id, nombre, descripcion, lote, serie, caducidad, id_proveedor, costo, precio |
| VENTAS | id, id_pedido, id_cliente, fecha, total |
| DETALLE_VENTAS | id, id_venta, id_producto, cantidad, precio_unitario |
| DEVOLUCIONES_VENTA | id, id_venta, id_producto, cantidad, motivo, fecha, estado |
| GARANTIAS | id, id_venta, id_producto, fecha_solicitud, motivo, estado, resolucion |

Los campos del dominio conservan los nombres originales. La API usa estos alias:

| JSON | Columna | Aplicación |
| --- | --- | --- |
| id | id | Ambos procesos |
| saleId | id_venta | Ambos procesos |
| productId | id_producto | Ambos procesos |
| reason | motivo | Ambos procesos |
| status | estado | Ambos procesos |
| quantity | cantidad | Solo devoluciones |
| date | fecha | Solo devoluciones |
| requestDate | fecha_solicitud | Solo garantías |
| resolution | resolucion | Solo garantías |

**GARANTIAS no contiene cantidad.** Un alias JSON no agrega una columna. Las referencias `id_proveedor`, `id_pedido` e `id_cliente` solo son números ficticios: este servicio no crea las tablas ni los módulos externos que las administran.

## Reglas de negocio

- La venta y el producto deben existir, y `DETALLE_VENTAS` debe vincularlos. Si hay varias líneas de un producto, sus cantidades se suman.
- Una devolución solicita una cantidad entera positiva. La disponibilidad es lo comprado menos las cantidades de devoluciones `PENDING`, `APPROVED` y `COMPLETED` de la misma pareja venta/producto.
- Rechazar una devolución libera sus unidades. Reservarlas desde `PENDING` evita admitir solicitudes que juntas excedan la compra.
- Una garantía `PENDING` o `APPROVED` bloquea otra garantía para la misma pareja. Después de `REJECTED` o `COMPLETED` se permite una nueva solicitud.
- Ambas solicitudes nacen en `PENDING`, con ID y fecha asignados por el servicio.
- La resolución inicial es `""`. Puede registrarse al aprobar o rechazar. Completar una garantía requiere una resolución previa o enviada en ese cambio de estado. Si se omite, se conserva la existente; enviar una cadena vacía es inválido.
- No se evalúa ningún plazo de garantía ni se usa `caducidad` como plazo de garantía.

| Estado actual | Estados siguientes permitidos |
| --- | --- |
| PENDING | APPROVED, REJECTED |
| APPROVED | COMPLETED |
| REJECTED | Ninguno |
| COMPLETED | Ninguno |

Repetir el mismo estado también produce `409`. No hay reapertura ni edición de solicitudes cerradas. La reserva de unidades, el criterio de garantía activa y la resolución al completar son decisiones explícitas de esta simulación; no se presentan como restricciones ya definidas en la base de datos.

## API disponible

| Método | Ruta | Éxito |
| --- | --- | --- |
| POST | `/api/v1/returns` | 201 y cabecera Location |
| GET | `/api/v1/returns` | 200, arreglo |
| GET | `/api/v1/returns/:id` | 200, objeto |
| PATCH | `/api/v1/returns/:id/status` | 200, objeto actualizado |
| POST | `/api/v1/warranties` | 201 y cabecera Location |
| GET | `/api/v1/warranties` | 200, arreglo |
| GET | `/api/v1/warranties/:id` | 200, objeto |
| PATCH | `/api/v1/warranties/:id/status` | 200, objeto actualizado |

Los listados se ordenan por ID ascendente, sin filtros ni paginación. Envían directamente un arreglo JSON. Los cuerpos de creación y actualización rechazan campos desconocidos. Las fechas son cadenas ISO 8601 en UTC y los IDs son enteros positivos seguros en JSON.

## Datos para la demostración

| Venta | Producto | Nombre | Unidades compradas | Disponibles para devolución al iniciar |
| --- | --- | --- | --- | --- |
| 1001 | 101 | Pintura acrílica blanca 1 L | 1 | 1 |
| 1001 | 102 | Sellador acrílico 1 L | 2 | 2 |
| 1002 | 103 | Adhesivo de contacto 500 ml | 3 | 2 |

La devolución `5001`, de venta `1002` y producto `103`, ya está `COMPLETED` por una unidad. La garantía `6001` de esa pareja está `REJECTED`. La venta `1001` está libre para la exposición. El producto `103` existe, pero no pertenece a la venta `1001`.

### Guion de seis pasos en Swagger

Inicia el servidor con los datos originales. Abre cada operación, pulsa **Try it out**, pega el JSON y pulsa **Execute**. Conserva los IDs devueltos; los valores `5002` y `6002` se obtienen si no has creado solicitudes antes.

**1. Crear una devolución — `POST /api/v1/returns`.**

```json
{
  "saleId": 1001,
  "productId": 102,
  "quantity": 1,
  "reason": "El envase presenta una fuga."
}
```

Resultado: `201`, `status: "PENDING"`. Ejemplo de respuesta; la fecha real será la del momento de ejecución:

```json
{
  "id": 5002,
  "saleId": 1001,
  "productId": 102,
  "quantity": 1,
  "reason": "El envase presenta una fuga.",
  "date": "2026-09-27T22:00:00.000Z",
  "status": "PENDING"
}
```

**2. Exceder la cantidad — repetir el POST con `quantity: 2`.**

Solo queda una unidad. Resultado: `409` y `RETURN_QUANTITY_EXCEEDED`.

**3. Crear una garantía — `POST /api/v1/warranties`.**

```json
{
  "saleId": 1001,
  "productId": 101,
  "reason": "La pintura no tiene la consistencia indicada."
}
```

Resultado: `201`, `status: "PENDING"`, `resolution: ""`, sin `quantity`. Utiliza el ID recibido en los siguientes pasos.

**4. Aprobar y registrar resolución — `PATCH /api/v1/warranties/6002/status`.**

```json
{
  "status": "APPROVED",
  "resolution": "Se autoriza reemplazo del producto."
}
```

Resultado: `200`, `status: "APPROVED"` y resolución guardada.

**5. Completar — misma ruta PATCH.**

```json
{
  "status": "COMPLETED"
}
```

Resultado: `200`, `status: "COMPLETED"` y resolución conservada.

**6. Intentar reabrir — misma ruta PATCH.**

```json
{
  "status": "PENDING"
}
```

Resultado: `409`, `INVALID_STATUS_TRANSITION`. Consulta por ID para mostrar que sigue `COMPLETED`.

Para repetir la demostración, detén y vuelve a iniciar el proceso. Los cambios de código con `npm run dev` también reinician los datos.

## Petición desde terminal

Ejemplo para Bash o Git Bash:

```bash
curl -i -X POST "http://localhost:3000/api/v1/returns" -H "Content-Type: application/json" --data-raw '{"saleId":1001,"productId":102,"quantity":1,"reason":"Producto danado"}'
```

El ejemplo evita caracteres acentuados para prevenir diferencias de codificación en algunas terminales de Windows. Swagger puede utilizar normalmente texto con acentos.

En PowerShell puedes usar Swagger o `Invoke-RestMethod`; los comandos `npm` funcionan igual. Los ejemplos HTTP independientes del lenguaje se encuentran en [INTEGRATION.md](docs/INTEGRATION.md).

## Errores

Todas las respuestas de error de la API conservan esta envoltura:

```json
{
  "error": {
    "code": "RETURN_QUANTITY_EXCEEDED",
    "message": "La cantidad solicitada supera la disponible para devolución. Unidades disponibles: 1."
  }
}
```

La validación HTTP puede añadir `error.details`, un arreglo de objetos `{ "path": "body/reason", "message": "..." }`. Los consumidores deben tomar decisiones por `code`, no por el texto del mensaje.

| HTTP | Códigos |
| --- | --- |
| 400 | VALIDATION_ERROR, INVALID_JSON, INVALID_URL, INVALID_CONTENT_LENGTH, INVALID_ID, INVALID_QUANTITY, INVALID_REASON, INVALID_RESOLUTION, RESOLUTION_REQUIRED, PRODUCT_NOT_IN_SALE |
| 404 | SALE_NOT_FOUND, PRODUCT_NOT_FOUND, RETURN_NOT_FOUND, WARRANTY_NOT_FOUND, ROUTE_NOT_FOUND |
| 409 | RETURN_QUANTITY_EXCEEDED, ACTIVE_WARRANTY_ALREADY_EXISTS, INVALID_STATUS_TRANSITION |
| 413 | PAYLOAD_TOO_LARGE |
| 415 | UNSUPPORTED_MEDIA_TYPE |
| 500 | INTERNAL_SERVER_ERROR |

Los códigos `INVALID_ID`, `INVALID_REASON` e `INVALID_RESOLUTION` protegen el dominio cuando se invoca directamente; Zod normalmente rechaza esos mismos datos HTTP antes con `VALIDATION_ERROR`. Las cantidades inválidas se identifican como `INVALID_QUANTITY` también en HTTP.

`INVALID_CONTENT_LENGTH` se utiliza cuando el tamaño declarado del cuerpo HTTP no coincide con el contenido realmente recibido. Este caso se trata como una solicitud incorrecta (`400`) y no como un fallo interno del servidor.

Los errores internos se registran en el servidor y no exponen stacks ni información de infraestructura en la respuesta.

## Configuración y scripts

El archivo `.env` es opcional. Puedes copiar `.env.example` y modificarlo. No contiene secretos ni depende de un servicio externo.

| Variable | Valor predeterminado | Uso |
| --- | --- | --- |
| HOST | 127.0.0.1 | Interfaz de escucha |
| PORT | 3000 | Puerto de 1 a 65535 |
| LOG_LEVEL | info | fatal, error, warn, info, debug, trace o silent |
| BODY_LIMIT | 16384 | Límite del cuerpo HTTP en bytes; entre 1024 y 1048576 |

El servidor falla al arrancar si la configuración es inválida. Si el puerto está ocupado, cambia `PORT`. Para una prueba en red local configura `HOST=0.0.0.0` y utiliza la IP del equipo servidor. El valor predeterminado escucha únicamente en la máquina local.

| Script | Efecto |
| --- | --- |
| `npm run dev` | Ejecuta TypeScript y reinicia al detectar cambios |
| `npm run typecheck` | Comprueba tipos de código y pruebas, sin generar archivos |
| `npm run build` | Compila únicamente `src/` hacia `dist/` |
| `npm start` | Ejecuta `dist/server.js`; requiere build previo |
| `npm test` | Ejecuta la suite una vez |
| `npm run test:watch` | Ejecuta Vitest en modo observación |

## Pruebas

```bash
npm run typecheck
npm test
npm run build
```

La suite incluye **89 pruebas**: reglas de compra, cantidades inválidas y acumuladas, liberación de reservas, garantías activas, resolución, matriz completa de estados, consultas, entradas HTTP, JSON y URL inválidos, `Content-Length` inconsistente, errores internos, concurrencia y rollback. El reloj fijo hace reproducibles las fechas. Cada aplicación de prueba recibe su propio almacenamiento.

Los tests HTTP usan `app.inject()` para recorrer Fastify, Zod, rutas y serialización sin abrir un puerto. También se comprobaron `npm run dev` y `npm start` mediante conexiones HTTP reales, el documento OpenAPI, los recursos estáticos de Swagger y los seis casos del guion.

La revisión en navegador confirmó las ocho operaciones visibles y una creación mediante **Try it out** con respuesta `201`, sin errores de consola.

## Memoria, persistencia futura e integración

`InMemoryUnitOfWork` crea una copia privada del fixture por instancia y serializa las operaciones. Trabaja sobre un snapshot y solo lo publica cuando la operación termina; un error descarta sus cambios. Los repositorios devuelven copias para evitar mutaciones accidentales.

Reiniciar el proceso pierde todas las solicitudes creadas y restablece los mocks. Esta implementación admite una instancia y un volumen pequeño; no sirve como persistencia compartida entre servidores.

Para integrar una base de datos, implementa los contratos de repositorios y `UnitOfWork`, e inyecta el adaptador desde `src/app.ts`. No se necesitan cambios en las reglas de negocio. La sustitución debe conservar la atomicidad y la exclusión de solicitudes concurrentes, no limitarse a cambiar arreglos por consultas.

[ARCHITECTURE.md](docs/ARCHITECTURE.md) explica el contrato; [INTEGRATION.md](docs/INTEGRATION.md) presenta el caso conceptual de MySQL y las consideraciones de otros motores. No hay ORM, conexiones ni adaptadores vacíos.

Gracias a este diseño, la API no depende del lenguaje utilizado por los consumidores ni de una base de datos concreta. Cualquier sistema capaz de realizar peticiones HTTP y procesar JSON puede utilizar el servicio.

## Límites conocidos del modelo y de la simulación

- La garantía se asocia a venta y producto, sin cantidad ni identificador de unidad. No puede distinguir dos unidades del mismo producto dentro de esa venta.
- No existe vínculo entre una devolución y una garantía. No se inventa una prohibición cruzada ni se afirma que correspondan a la misma unidad.
- No hay políticas de vencimiento, auditoría ni historial de estados en las tablas disponibles. Se conserva únicamente el estado y la resolución actuales.
- Las fuentes no son un DDL completo: no especifican longitudes, precisión decimal ni toda la nulabilidad. La simulación utiliza strings y números para sus fixtures, sin afirmar que esos sean los tipos definitivos de la base de datos. No modifica el esquema original.
- Los límites de 2000 caracteres para `reason`, 4000 para `resolution` y el tamaño del body son límites técnicos de la API, no supuestas restricciones de columnas.
- No hay autenticación, autorización, CORS para orígenes externos, rate limiting, idempotencia de POST ni paginación. Son límites explícitos del alcance académico; la API puede consumirse entre servidores y Swagger funciona en su propio origen.
- Las colecciones y transacciones en memoria se copian completas; la simplicidad prima sobre el rendimiento a gran escala.

## Referencias técnicas

- [Fastify: validación y serialización](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Proveedor Zod para Fastify](https://github.com/turkerdev/fastify-type-provider-zod)
- [Swagger UI para Fastify](https://github.com/fastify/fastify-swagger-ui)

Las reglas de negocio proceden del requerimiento y las decisiones aquí documentadas; estas referencias solo orientan la integración de las herramientas.
