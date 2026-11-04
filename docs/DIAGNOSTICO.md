# Diagnóstico de SERVICIOS.zip

Se inspeccionaron 29 carpetas principales. El ZIP tiene 863 entradas (incluidos directorios), 592 archivos; se preservan 493 archivos de fuentes/documentación en `legacy/SERVICIOS`. Se excluyen 99 archivos de entorno o ejecución, incluidos `.env`, bases de prueba, binarios y archivos personales de IDE. El manifiesto incluye rutas, tamaños y SHA-256. El ZIP original no se modifica.

## Qué existe y cómo se trata

“Reutilizado” significa que hay código del componente ejecutándose en Huella. “Adaptado” describe cambios de transporte o persistencia. “Referencia” significa que se conserva el original, pero no participa en el flujo integrado.

| Carpeta original | Hallazgo | Decisión en Huella |
|---|---|---|
| `CRUD INVENTARIO` | Node/Express/MySQL; CRUD de productos, proveedor, costo/precio; no reserva transaccional de checkout | Reutilizado `producto.service.js` con adaptador SQLite; añadidos stock, catálogo de perros y reservas |
| `Inventario` | Node/Express/MySQL; reportes, no el mismo CRUD | Referencia; no arrancar como segundo catálogo |
| `microservicio-login` | Node/Express/MySQL, JWT, bcrypt, bloqueo por intentos | Reutilizado servicio de autenticación; adaptados repositorio, HTTP, hash scrypt y firma de sesión |
| `servicio-roles` | Node/MySQL; roles y verificación con JWT | Referencia; perfil local registra solo CLIENTE y protege operaciones internas con secreto |
| `servicio-verificacion-rol` | TypeScript/Prisma/JWT; otra autenticación/roles | Referencia; evitar identidades y claves divergentes |
| `servicio-verificacion-tarjeta` | TypeScript/Prisma; tarjetas, roles y pedidos pendientes | Referencia; no almacenar ni recibir tarjetas reales en el perfil demo |
| `serviciopago` | FastAPI; evaluación Visa/Mastercard y Luhn, pagos/reembolsos en memoria, simulados | Reutilizadas reglas puras; nuevo servidor Python con SQLite e idempotencia, solo tokens de prueba |
| `RegistroPedidosService-main` | .NET 10; EF InMemory en Development y MySQL fuera de Development | Referencia; sustituido en perfil local por coordinador durable que enlaza carrito, stock y pagos |
| `microservicio-historial-compras-main` | FastAPI; devuelve seis compras fijas de libros | Sustituido por historial real de los pedidos locales |
| `servicio-reporte-compras (2)` | Node/MySQL, proyecto duplicado dentro de sí mismo | Referencia; no arrancar dos copias |
| `logistica_envios_python_arreglado` | Flask/MySQL con vistas HTML de envíos y cambios de estado | Referencia; nuevo servicio HTTP de envíos locales tras pago |
| `microservicio-validacion-entregas` | FastAPI/SQLAlchemy/MySQL y simulador de paquetería | Referencia; no afirmar una entrega real |
| `empaquetado-service-main` | API Fastify/TypeScript con migraciones SQLite y frontend Next | Referencia; herramienta administrativa independiente |
| `modulo_comprobante` | Flask/MySQL, generación PDF y envío por email | Referencia; Huella imprime un comprobante local sin SMTP |
| `ticket_service` | FastAPI/SQLAlchemy, dependencias PostgreSQL y PDF | Referencia; constituye una tercera familia de persistencia, no compatible directamente con MySQL/SQLite |
| `comentarios-resenas-service` | Node/Express/MySQL; reseñas independientes | Referencia; nueva persistencia local con verificación de comprador |
| `DEVOLUCIONES  MATA` | Node/Express/SQLite; ventas, devoluciones y reembolso simulado | Referencia; no utilizar su tienda.db precargada ni duplicar ventas |
| `garantias-devoluciones` | Fastify/TypeScript, repositorios en memoria y frontend React/Vite | Referencia; solicitudes locales persistentes nuevas, sin automatizar aprobación/reembolso |
| `servicio_proveedores_python_mysql_json` | Flask/MySQL; administración de proveedores | Referencia; no necesario para el checkout del catálogo inicial |
| `soa-agregar-producto` | .NET 8/MySQL, alternativa para altas de producto | Referencia; evitar un segundo escritor con esquema distinto |
| `AlertaStockMinimo` | .NET 10 Windows Forms; compara cantidad con mínimo | Referencia; es aplicación de escritorio, no API HTTP |
| `MicroservicioStockMaxOfertas` | .NET 8; calcula descuentos de 10/20% por stock | Referencia; descuentos no aplicados al catálogo local |
| `soa-servicio-reset-password-main` | API Node/TypeScript con SMTP y frontend Vite | Referencia; no se conectó a las nuevas identidades ni se envían correos |
| `verificacion-bot` | Express con limitación de peticiones | Referencia; limitador local en login; no CAPTCHA real |
| `Servicio_Fondo` | .NET 10; CRUD de configuración visual de fondo | Referencia; diseño local con CSS, sin API de fondo |
| `Encabezado` | Web Component con Shadow DOM y eventos | Reutilizado y conectado a cuenta/carrito/navegación |
| `biblioteca-menu` | Constructor DOM configurable y CSS | Reutilizado como navegación de categorías |
| `SOA - Pie de pagina` | Web Component con slots | Reutilizado con ayuda, pedidos e información de demo |
| `domicilio` | HTML con validación y persistencia en localStorage | Adaptados campos y regla numérica al checkout; guardado por pedido en backend |

## Relaciones originales: capacidades, no integración ya existente

Inventario/productos → carrito/pedidos → pago → empaquetado/envío → entrega → comprobante/historial → reseña o devolución sería el flujo comercial esperado. Login/roles autorizarían las operaciones; proveedores alimentarían productos, y reportes/ofertas consumirían inventario y ventas.

Los proyectos entregados no implementan esa cadena completa juntos: no comparten un contrato uniforme de identidad, importes, IDs de pedido, persistencia ni estados. Muchos vuelven a usar 3000, 5000 u 8000. El historial es un mock; pagos y garantías usan memoria; pedidos cambia de almacenamiento según el entorno. `AlertaStockMinimo` necesita Windows y no tiene puerto de API.

No es correcto arrancarlos todos contra una sola base y asumir consistencia: hay modelos como `productos`, `PRODUCTO`, `ventas`, IDs enteros, estructuras de librería/repostería y distintas tablas de usuarios. El esquema SQLite de Huella es nuevo y explícito; no importa datos privados del ZIP.

## Piezas que faltaban para la tienda integrada

- Carrito persistente y aislado por usuario.
- Catálogo de accesorios para perros, detalle, búsqueda y filtros.
- Checkout con domicilio, cálculo de importes en servidor y snapshot de líneas.
- Reserva atómica de múltiples productos y recuperación de fallos distribuidos.
- Idempotencia en compra/pago/envío para prevenir duplicados.
- Gateway del navegador, contrato común de errores y configuración de puertos.
- Pagos persistentes, registro local de envíos y conexión al historial.
- Pruebas de integración y lanzador con cierre y comprobación de puertos.

Estas piezas se implementan en `services/commerce`, `services/fulfillment`, `shared`, `web` y `scripts`, con extensiones en inventario y pagos. La solución entrega una tienda local completa dentro del alcance demo descrito; no afirma integrar en ejecución los 29 proyectos originales ni incorporar servicios reales de terceros.
