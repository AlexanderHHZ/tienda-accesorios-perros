# Arquitectura

## Objetivo y dependencias

El servicio separa las reglas de garantías y devoluciones del transporte HTTP y de la persistencia. La implementación mantiene un tamaño acotado: dos servicios de aplicación, cuatro contratos de repositorio y una unidad de trabajo.

| Capa | Conoce | No conoce |
| --- | --- | --- |
| Dominio | Entidades, reglas y contratos | Fastify, Zod, memoria, SQL |
| Aplicación | Dominio y contratos | Servidor HTTP y adaptadores concretos |
| Infraestructura | Contratos y datos del dominio | Rutas y esquemas HTTP |
| HTTP | Casos de uso, Zod y serialización | Arreglos de almacenamiento y consultas SQL |
| Composición | Todas las piezas necesarias | No decide reglas del negocio |

`src/app.ts` construye Fastify, configura Swagger, selecciona `UnitOfWork` e inyecta los servicios. `src/server.ts` lee la configuración, escucha y cierra conexiones al recibir señales. Separar ambos permite construir una aplicación de prueba sin abrir puertos.

## Dominio

`SaleReturn` representa exclusivamente `DEVOLUCIONES_VENTA`; `Warranty` representa `GARANTIAS`. No heredan de una entidad genérica ni comparten un repositorio. Solo reutilizan el vocabulario y la matriz de estados.

`Product`, `Sale` y `SaleDetail` reproducen los campos de las tablas que el servicio consulta. Los contratos `ProductRepository` y `SaleRepository` son de solo lectura. La consulta de detalles pertenece al repositorio de ventas porque no hay un caso de uso independiente que escriba esos registros.

Las entidades usan propiedades `readonly`, nombres de columnas originales y fechas como strings. Los adaptadores devuelven copias. El dominio incluye errores con un código estable, sin códigos HTTP: una interfaz futura diferente puede interpretar los mismos errores.

Las reglas centrales están en funciones pequeñas:

- `assertReturnCapacity`: compara lo comprado con las unidades reservadas o completadas.
- `assertNoActiveWarranty`: bloquea solicitudes simultáneamente activas para la misma pareja.
- `assertStatusTransition`: aplica la matriz común y rechaza reaperturas o repeticiones.
- `changeWarrantyStatus`: conserva o actualiza la resolución y la exige al completar.

No se utilizan `caducidad` ni `fecha_solicitud` para inventar un vencimiento. Si se define una política de tiempo posteriormente, debe expresarse como regla del dominio con parámetros de negocio explícitos; el reloj ya se inyecta. No hay un plazo oculto de 30, 60 o 90 días.

## Aplicación

Cada servicio expone `create`, `list`, `getById` y `changeStatus`. Mantenerlos juntos facilita localizar un proceso completo sin crear una clase por método trivial. El tamaño y la responsabilidad de cada servicio permanecen acotados.

La función `getPurchasedQuantity` comprueba venta, producto y pertenencia mediante `DETALLE_VENTAS`. Suma todas las líneas coincidentes porque las fuentes no declaran una restricción de unicidad sobre la pareja venta/producto.

Cada caso de uso se ejecuta en `UnitOfWork.run`. El servicio recibe los repositorios de esa operación, aplica las reglas y solicita las escrituras. Nunca instancia un repositorio en memoria.

Los comandos de aplicación usan nombres como `saleId`; son entradas de casos de uso, no entidades almacenadas ni nuevas columnas. Los tipos de respuesta HTTP se derivan de los esquemas; la serialización expresa el mapeo sin duplicar una entidad completa para cada capa.

## Flujo de una petición

1. Fastify recibe la solicitud y Zod valida parámetros y cuerpo. Los campos desconocidos en los cuerpos se rechazan.
2. La ruta entrega la entrada validada al servicio correspondiente.
3. `UnitOfWork` abre el contexto aislado de la operación y proporciona los repositorios.
4. La aplicación verifica la compra, consulta solicitudes previas y aplica las reglas del dominio.
5. El repositorio asigna el ID al crear o guarda el estado actualizado. Un resultado exitoso confirma la operación; un error revierte sus cambios.
6. El adaptador HTTP transforma las columnas a JSON y responde con el código correcto. Los errores de negocio pasan por el manejador global.

El dominio valida las invariantes incluso cuando el caso de uso se invoca sin HTTP. Zod se ocupa además de tipos, estructura, límites de transporte y serialización. Esta separación evita depender de un controlador como única protección de las reglas.

## Persistencia y concurrencia

Los métodos de repositorio son asíncronos aunque la implementación inicial utilice arreglos. El contrato puede implementarse mediante un controlador de base de datos sin cambiar las firmas de aplicación.

`InMemoryUnitOfWork` mantiene una cola de promesas por instancia. Una operación espera a la anterior, copia las cinco colecciones, ejecuta el callback y publica una copia del snapshot únicamente si termina correctamente. La cola continúa también después de un error.

Esta atomicidad evita dos carreras concretas:

- Dos devoluciones podrían leer simultáneamente la misma cantidad disponible y superar juntas la compra.
- Dos garantías podrían comprobar simultáneamente que no existe una activa y crear ambas.

La generación de IDs ocurre dentro del mismo contexto serializado. En memoria se usa el máximo ID más uno; un adaptador real debe utilizar el mecanismo de generación que corresponda al esquema, nunca trasladar `MAX(id) + 1` a escrituras SQL concurrentes.

Todos los repositorios entregan copias; el snapshot inicial y el confirmado también son independientes. No deben retenerse repositorios fuera del callback de `run` ni anidarse operaciones `run` sobre la misma unidad de trabajo. Los servicios actuales cumplen esa condición.

La implementación copia todo y serializa incluso lecturas. Es una decisión razonable para una simulación pequeña, no una estrategia de alto rendimiento. No proporciona exclusión entre procesos ni almacenamiento duradero.

## Contrato de un adaptador real

Un futuro `MySqlUnitOfWork`, `PostgresUnitOfWork` o equivalente debe:

1. Crear un contexto transaccional compartido por los repositorios de una operación.
2. Proteger las lecturas y escrituras que deciden disponibilidad, duplicados y estado actual.
3. Confirmar solo si el callback termina; revertir ante errores.
4. Resolver conflictos concurrentes también entre distintas instancias del servidor.
5. Mantener los nombres y relaciones existentes, mapear fechas y decimales y devolver copias o valores independientes.

Una transacción con aislamiento insuficiente no basta. Para SQL puede utilizarse aislamiento serializable con manejo acotado de conflictos, o bloqueos consistentes sobre filas existentes de venta y solicitud. La opción concreta depende del motor. No es necesario inventar columnas de versión ni tablas nuevas para explicar este contrato.

El adaptador debe cargar registros válidos y traducir errores específicos del motor a resultados del contrato o fallos internos. El API no debe revelar mensajes SQL. Todos los equipos que escriban en esas mismas tablas deben respetar el mismo mecanismo de concurrencia.

Ver [INTEGRATION.md](INTEGRATION.md) para el ejemplo conceptual de sustitución de memoria por MySQL. No se incluyen adaptadores vacíos ni un ORM.

## Modelo y decisiones explícitas

El documento de tablas contiene el detalle de campos y el diagrama confirma las relaciones. Las omisiones visuales del diagrama no se interpretan como una instrucción para eliminar los campos expresamente incluidos en el documento y en el requerimiento.

`resolucion` se representa inicialmente como cadena vacía para evitar inferir una nulabilidad que no está especificada. En los mocks todos los productos tienen valores para sus campos, incluida caducidad; los ejemplos de consumibles evitan asignar fechas de vencimiento ficticias a artículos que normalmente no las tienen.

Se seleccionó la reserva desde `PENDING` para evitar sobreaceptar unidades. `REJECTED` libera capacidad y `COMPLETED` la consume permanentemente. `APPROVED → REJECTED` no se permite porque el requerimiento no define revocación de aprobaciones.

Una garantía finalizada permite una nueva solicitud para la pareja, sin reabrir ni sobrescribir la anterior. El esquema no distingue unidades, intentos ni periodos. No se agrega un límite de garantías históricas.

Una devolución y una garantía pueden coexistir para la misma pareja. El esquema no ofrece un vínculo que permita atribuirlas a la misma unidad. Establecer exclusiones entre procesos requeriría una política de negocio explícita; aquí se documenta la limitación.

## HTTP y documentación

Zod es la fuente de validación y de generación del contrato OpenAPI mediante el proveedor de Fastify. Se documentan parámetros, cuerpos, estados HTTP, ejemplos y respuestas. Generar el documento desde las rutas reduce divergencias con Swagger.

Swagger lleva una política CSP en sus rutas. Se permiten sus estilos en línea porque la interfaz genera CSS dinámicamente; la restricción de scripts se conserva. Esta configuración está limitada a la documentación.

El manejador global traduce errores de dominio a `400`, `404` o `409`, controla JSON inválido, tipos de contenido no admitidos, tamaño del body y discrepancias de `Content-Length`, y oculta fallos internos. La respuesta de error no incluye el stack. Los detalles de validación describen rutas de campos, sin reflejar el cuerpo completo.

Los límites de texto y body protegen el transporte. No se presentan como longitudes de columnas que las fuentes nunca definieron. Los importes de los mocks no intervienen en cálculos de reembolso; un adaptador definitivo deberá tratar los decimales según el motor y el contrato acordado.

## Estrategia de pruebas

Las pruebas ejercitan resultados observables: límites acumulados, errores de compra, reservas liberadas, transiciones, resolución, atomicidad, aislamiento y solicitudes simultáneas. La matriz de estados cubre las 16 combinaciones posibles.

Las pruebas HTTP recorren la aplicación completa con `inject`, validan los códigos y verifican el contrato publicado. No se mockean las reglas del negocio. Un adaptador que falla se inyecta únicamente para verificar la respuesta segura de error interno.

La revisión de ejecución abre conexiones HTTP reales para comprobar los scripts de desarrollo y producción y los seis casos de la demostración. El README contiene las instrucciones reproducibles para ejecutarlos en otro equipo.
