# Decisiones de arquitectura

## Dos aplicaciones, un workspace

`api/` y `web/` tienen sus propios scripts, configuración y dependencias. El workspace de npm facilita una instalación reproducible con un solo lockfile; no introduce dependencia de ejecución entre los proyectos. Un cliente externo puede sustituir por completo al frontend.

Las páginas y componentes React viven en archivos `.tsx`. Contratos, cliente HTTP, hooks y utilidades del frontend se organizan en directorios de archivos `.ts`. No se colocan llamadas a SQLite dentro de componentes ni rutas de Next.js.

## Backend por responsabilidades

- **Schemas:** definen entradas y respuestas con Zod, validan HTTP y alimentan OpenAPI.
- **Rutas:** declaran el contrato, los códigos HTTP y conectan solicitudes con operaciones.
- **Servicio:** gestiona existencia y concurrencia de registros. No añade envoltorios vacíos para operaciones que ya son una única consulta.
- **Repositorio:** concentra SQL parametrizado, transacciones y la conversión de columnas SQL a JSON.
- **Plugins:** centralizan errores, cabeceras y adaptación de documentación.

`buildApp()` no abre un puerto. Esto permite probar la misma aplicación con Fastify `inject` y SQLite real. `server.ts` es el punto de entrada HTTP y gestiona el cierre ordenado.

## SQLite y alternativas

Se eligió SQLite porque el dominio es pequeño, independiente y debe ejecutarse después de descargar un ZIP. Ofrece persistencia transaccional sin credenciales ni instalaciones adicionales. El driver viene incluido en Node.js 24. Las tablas `STRICT` y los `CHECK` añaden una defensa ante escrituras fuera de la API.

Las migraciones se ejecutan dentro de una transacción `BEGIN IMMEDIATE`; se guarda un checksum por archivo. WAL permite coexistencia de lecturas y escrituras y se limita a cinco segundos la espera por bloqueo. La consulta paginada y sus totales comparten una transacción de lectura, de modo que describen la misma instantánea.

El driver es síncrono: es una solución adecuada para esta aplicación local o un servicio pequeño con un archivo persistente. Una instalación con alta concurrencia, múltiples réplicas o almacenamiento efímero debe cambiar el repositorio y migraciones a PostgreSQL u otro servidor relacional. El contrato HTTP y los componentes no necesitan depender de ese cambio. No se presenta esta instalación como almacenamiento compartido para funciones serverless.

No se añadió un ORM porque aquí no reduce complejidad: hay una entidad, consultas breves, validación explícita de filas y SQL centralizado. La separación del repositorio mantiene localizado un cambio posterior de motor.

## Contrato y precisión

La API recibe y devuelve `medidas: { largo, ancho, alto }`; en SQLite son tres columnas numéricas. Todas las entradas son finitas, positivas y con un máximo técnico de mil millones. Los IDs se validan como enteros positivos seguros.

Se almacenan las medidas como números de coma flotante, sin redondeos impuestos por el servicio. El formato visual limita dígitos significativos para facilitar la lectura; abrir el editor recupera el número completo. Tamaño y tipo son enums independientes. No se infieren tamaños a partir de dimensiones ni se calculan tarifas inexistentes.

La búsqueda no simula un nombre de paquete que el modelo no tiene: consulta su ID, tamaño o tipo. Los valores se pasan como parámetros SQL; orden y columna se seleccionan de listas cerradas. Los comodines introducidos por el usuario se escapan.

## Concurrencia

`updatedAt` actúa como versión del registro. Su valor crece incluso si dos cambios ocurren en el mismo milisegundo. El frontend envía `X-Expected-Updated-At` al editar o eliminar. Una versión obsoleta produce `409` y conserva los datos del otro cliente.

Además del control inicial, UPDATE y DELETE incluyen `WHERE id = ? AND updated_at = ?`. La comprobación final es atómica frente a otro proceso conectado al mismo archivo. Si no se envía el encabezado, no se promete detectar que el cliente leyó una versión antigua: se opera sobre la versión disponible al comenzar.

## Frontend y accesibilidad

Se utiliza una única pantalla de operación con componentes pequeños para filtros, resumen, listado, paginación y diálogos. El cliente HTTP centraliza URL, timeout, errores, encabezados y respuestas vacías. Las respuestas del servidor se validan en tiempo de ejecución con Zod antes de mostrarse.

Los contratos del frontend son locales al cliente. Esta pequeña duplicación deliberada evita acoplarlo al código ejecutable del backend; la especificación OpenAPI permite generar SDK externos si el proyecto crece.

SWR identifica las consultas por todos sus filtros y administra revalidación y respuestas fuera de orden. La búsqueda espera 300 ms tras escribir. Las mutaciones no se reintentan automáticamente y bloquean doble envío. Una escritura confirmada no se presenta como fallida si una recarga posterior del listado falla.

Radix Dialog gestiona el foco, Escape y el contenido modal. Los formularios etiquetan campos y errores; las acciones de icono incluyen nombres accesibles. Hay foco visible, enlace para saltar al contenido y mensajes de estado. Los indicadores de carga respetan la preferencia de movimiento reducido.

Los estados vacíos y de desconexión forman parte del flujo real. Los valores del resumen provienen de SQLite, sin cifras de demostración insertadas en los componentes.

## Seguridad y alcance

La configuración valida orígenes CORS exactos y no habilita credenciales. Los consumidores HTTP que no envían `Origin` pueden usar la API. Se limita el cuerpo a 16 KiB, se requieren solicitudes JSON para las escrituras y se usan cabeceras de seguridad con Helmet.

Los errores operativos tienen mensajes controlados. Los detalles técnicos permanecen en el logger del servidor. Las respuestas del dominio usan `Cache-Control: no-store` para evitar lecturas obsoletas después de editar.

La ausencia de autenticación es una decisión de alcance. Escuchar en `127.0.0.1` es el valor inicial para ejecución local. El servicio no está conectado a otros proyectos ni requiere servicios de nube.

## Referencias técnicas

- [Instalación de Next.js](https://nextjs.org/docs/app/getting-started/installation).
- [SQLite en Node.js 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).
- [Fastify y Zod](https://github.com/turkerdev/fastify-type-provider-zod).
- [Generación de Swagger en Fastify](https://github.com/fastify/fastify-swagger).

También hay documentación de la versión instalada de Next.js en `node_modules/next/dist/docs/` después de instalar dependencias.
