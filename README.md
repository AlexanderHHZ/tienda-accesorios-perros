# Huella — Tienda de accesorios para perros

Proyecto local funcional basado en `SERVICIOS.zip`. Incluye catálogo dinámico, ficha de producto, registro/login, carrito persistente por usuario, domicilio, checkout, pagos simulados, reservas de inventario, pedidos, envíos locales, comprobante imprimible, reseñas de compradores y solicitudes de devolución.

**Alcance:** compras de demostración de extremo a extremo. No cobra dinero, no contrata transportistas y no emite facturas fiscales. El perfil integrado se ejecuta con Node.js y Python, con cinco bases SQLite independientes. No requiere MySQL, Docker, servicios externos ni descarga de paquetes de terceros. Los proyectos originales .NET, MySQL, FastAPI, React, Next y TypeScript se conservan en `legacy/` como referencia y módulos independientes; **no todos se ejecutan ni están conectados en este perfil**. La tabla de diagnóstico explica qué se reutilizó, adaptó o sustituyó.

## 1. Requisitos

- Node.js **24.4 o superior dentro de la rama 24**; probado con 24.22.1. Se utiliza `node:sqlite` integrado.
- Python **3.11 o superior**; probado con 3.12.14.
- Navegador moderno con JavaScript habilitado.
- Puertos libres 8080 y 4101–4105.

Comprueba `node --version`, `npm --version` y `python3 --version`. En Windows, usa `python --version` y cambia `PYTHON=python` en `.env` después de la preparación.

## 2. Arranque rápido

Descomprime el ZIP y abre una terminal en la carpeta `huella-shop` (la que contiene este README):

```bash
npm install
npm run setup
npm start
```

`npm install` no descarga dependencias: este perfil usa las bibliotecas estándar. `setup` genera una `.env` local con dos secretos aleatorios; no sobrescribe una configuración existente. Las bases se crean al arrancar cada servicio y el inventario se siembra una sola vez.

Abre **http://localhost:8080**. Usa “Crear cuenta”; no hay credenciales compartidas ni usuarios precargados. La contraseña debe tener al menos 10 caracteres. La sesión dura 8 horas; el token queda en `sessionStorage`, y el carrito en el servidor. Cierra con `Ctrl+C`; el lanzador detiene sus procesos.

Para Python puedes crear un entorno, aunque no es necesario:

```bash
python3 -m venv .venv
# Linux/macOS:
source .venv/bin/activate
python -m pip install -r services/payments/requirements.txt
```

En Windows: `python -m venv .venv`, luego `.venv\Scripts\activate` (CMD) o `.venv\Scripts\Activate.ps1` (PowerShell). El archivo de requisitos no contiene dependencias externas. No instales los requisitos de `legacy/` para arrancar Huella.

## 3. Arranque manual: orden exacto de terminales

Todas las terminales deben estar en `huella-shop`. Ejecuta antes `npm run setup`. **Elige este método o `npm start`, no ambos.**

| Orden | Terminal / servicio | Comando | Puerto |
|---|---|---|---:|
| 1 | Autenticación | `npm run auth` | 4101 |
| 2 | Inventario / catálogo | `npm run inventory` | 4102 |
| 3 | Pagos Python | `python3 services/payments/server.py` | 4103 |
| 4 | Preparación de envíos | `npm run fulfillment` | 4105 |
| 5 | Carrito / pedidos / coordinación | `npm run commerce` | 4104 |
| 6 | Frontend y gateway HTTP | `npm run web` | 8080 |

En Windows sustituye `python3` por `python`. Espera al mensaje “listo” antes de la siguiente terminal. Cada servicio tiene `GET /health`. El lanzador automático comprueba puertos y espera estas respuestas. Los servicios enlazan a `127.0.0.1` por defecto.

## 4. Configuración `.env`

| Variable | Valor local | Función |
|---|---|---|
| `HOST` | `127.0.0.1` | Dirección de escucha de los servicios |
| `WEB_PORT` | `8080` | Único origen del navegador |
| `AUTH_PORT` / `AUTH_URL` | `4101` / `http://127.0.0.1:4101` | Autenticación |
| `INVENTORY_PORT` / `INVENTORY_URL` | `4102` / `http://127.0.0.1:4102` | Productos y reservas |
| `PAYMENTS_PORT` / `PAYMENTS_URL` | `4103` / `http://127.0.0.1:4103` | Simulador persistente |
| `COMMERCE_PORT` / `COMMERCE_URL` | `4104` / `http://127.0.0.1:4104` | Carrito, pedidos, reseñas y devoluciones |
| `FULFILLMENT_PORT` / `FULFILLMENT_URL` | `4105` / `http://127.0.0.1:4105` | Registro de envíos |
| `DATA_DIR` | `./data` | Directorio de SQLite relativo al proyecto |
| `JWT_SECRET` | Generado por setup | Firma HS256 de sesión |
| `INTERNAL_SECRET` | Generado por setup | Autorización entre servicios |
| `PYTHON` | `python3` | Ejecutable usado por el lanzador |
| `PAYMENT_MODE` | `demo` | Único modo implementado |

Si cambias un puerto, cambia también su URL y reinicia. Las variables del proceso prevalecen sobre `.env`. No publiques `.env`. Cambiar `JWT_SECRET` invalida sesiones. Todos los servicios deben compartir `INTERNAL_SECRET`; nunca se envía al navegador. El gateway descarta claves internas suministradas por clientes.

## 5. Bases de datos locales

SQLite viene con Node y Python. No se instala ni arranca un servidor SQL. La primera ejecución crea:

| Archivo | Propietario | Datos |
|---|---|---|
| `data/auth.sqlite` | Auth | Usuarios, hash scrypt, intentos y bloqueos |
| `data/inventory.sqlite` | Inventario | Productos y reservas de stock |
| `data/payments.sqlite` | Pagos | Resultado de pago de prueba, importe, últimos cuatro dígitos |
| `data/commerce.sqlite` | Comercio | Carrito, pedidos, reseñas, solicitudes de devolución |
| `data/fulfillment.sqlite` | Envíos | Dirección, estado y referencia local |

Los precios son **centavos enteros de MXN**: `54900` significa `$549.00`. El envío cuesta `7900` centavos y es gratis desde `99900`. El backend recalcula el total con su catálogo, ignorando importes enviados por el navegador.

- Los ocho productos iniciales están en `services/inventory/seed.json`. Edita ese archivo **antes del primer arranque** para cambiar el catálogo inicial. No se reimporta encima de datos existentes.
- Consultar productos: `node scripts/catalog.mjs list`.
- Ajustar stock (operador local): `node scripts/catalog.mjs stock 1 25`. Este comando usa HTTP y la clave interna de `.env`.
- Haz ajustes de stock cuando no haya compras en curso: el stock almacenado es el disponible, después de reservas.
- Para respaldar: detén todos los procesos y copia **la carpeta `data` completa**, junto con `.env` en un lugar privado. No copies solo una base de un pedido distribuido.
- Para una nueva demostración, detén los procesos y **renombra** `data` a `data-backup`; el próximo arranque crea bases vacías. Conserva el respaldo si necesitas los pedidos anteriores.
- No hay migraciones desde los distintos esquemas MySQL originales. La configuración y comandos nativos de estos módulos se explican en `docs/LEGACY.md`.

## 6. Prueba una compra completa

1. Abre `http://localhost:8080` y crea una cuenta.
2. Busca un accesorio, filtra por categoría y abre su ficha.
3. Añade productos; cambia cantidades o elimina líneas en el carrito.
4. Continúa a checkout y completa el domicilio. Código postal: 5 dígitos; teléfono: 10 dígitos; número exterior: solo dígitos.
5. Elige **Pago aprobado** para confirmar o **Pago rechazado** para probar la liberación de stock. No introduzcas una tarjeta real.
6. En “Mis pedidos” consulta importes, resultado, referencia y envío. Puedes imprimir un comprobante local y solicitar devolución.
7. Vuelve a la ficha de un producto comprado y publica una reseña.

Si un servicio falla durante la compra, el pedido conserva su estado y el coordinador reintenta cada 4 segundos. Pulsa “Actualizar estado” en Mis pedidos. No modifiques un carrito con compra pendiente. Un rechazo deja el carrito intacto; una compra confirmada lo vacía.

## 7. Probar el panel de dueño

La tienda no crea un administrador público automáticamente. Primero registra una cuenta normal en el sitio. Con `npm start` todavía funcionando, abre otra terminal en `huella-shop` y eleva **tu usuario exacto**:

```bash
npm run admin -- promote mi_usuario
```

La consola confirmará el cambio de rol. Cierra sesión desde la tienda y vuelve a entrar. La opción **Administrar catálogo** aparecerá en el menú; también puedes abrir `http://localhost:8080/#admin`. Si ya tenías una sesión abierta, vuelve a entrar para refrescar la cabecera.

En el panel prueba **Agregar producto**; cambia nombre, precio en MXN, stock, categoría y descripción; selecciona una ilustración o sube un PNG/JPG/WebP. La imagen se reduce en el navegador y queda en `data/product-images/`. Guarda cambios para editar un producto existente. **Retirar** lo oculta del catálogo; se bloquea si hay carritos o pedidos que dependan de ese producto. En pedidos completados se conserva el nombre y el precio históricos.

Solo una persona con acceso local a la terminal del proyecto puede promover una cuenta. No promociones una cuenta en un equipo compartido. Para quitar los permisos, desde la raíz del proyecto ejecuta `node --input-type=module -e "import{db}from'./shared/core.mjs';db('auth','').prepare(\"UPDATE users SET rol='CLIENTE' WHERE nombreUsuario=?\").run('mi_usuario')"` (sustituye `mi_usuario`).

## 8. Pruebas y diagnóstico

```bash
npm test
```

La suite arranca procesos reales con bases temporales y puertos 14101–14105/18080, y elimina únicamente sus propios datos temporales. No necesita que la tienda esté arrancada. Cubre compra aprobada, idempotencia, rechazo, validación, sobreventa, aislamiento por usuario, reseñas, devoluciones, persistencia y recuperación al reiniciar servicios.

- `docs/VERIFICACION.md`: resultados y límites comprobados.
- `docs/DIAGNOSTICO.md`: inventario completo y decisiones sobre el ZIP.
- `docs/ARQUITECTURA.md`: flujo, estados, persistencia y contratos.
- `docs/API.md`: rutas y ejemplos HTTP.
- `docs/LEGACY.md`: instalación nativa de originales, MySQL y puertos reservados.
- `docs/source-manifest.json`: trazabilidad SHA-256 de las fuentes conservadas.

## 9. Problemas comunes

- **Puerto ocupado:** detén otra instancia o cambia `*_PORT` y `*_URL`. El lanzador comprueba los seis puertos antes de iniciar.
- **`node:sqlite` no existe:** revisa que realmente se ejecute Node 24.4+ (`node --version`).
- **Python no se encuentra:** modifica `PYTHON=python` o la ruta absoluta de tu ejecutable en `.env`.
- **401 / sesión expirada:** inicia sesión otra vez; el carrito persiste.
- **Servicio no disponible:** comprueba las terminales y `/health`; conserva los datos, arranca el servicio que falta y actualiza el pedido.
- **Otra pestaña no tiene sesión:** `sessionStorage` se limita a la pestaña; inicia sesión de nuevo.
- **Catálogo no refleja cambios en seed:** el seed solo se aplica a una base vacía.
- **Pruebas no arrancan:** libera los puertos 14101–14105/18080 y comprueba Python.

## 10. Despliegue y límites

Este paquete está listo para **ejecución local**. No se ha publicado en Internet. Para alojarlo, usa una máquina con Node/Python y discos persistentes; el frontend estático por sí solo no ejecuta los microservicios. Mantén los servicios internos en loopback o red privada y publica únicamente el gateway mediante un proxy HTTPS. La comparación de `Origin` del gateway está pensada para HTTP local: para un proxy TLS hay que configurar un origen público explícito y adaptar esa comprobación antes de exponerlo.

La implementación usa un solo proceso coordinador, colas por usuario en memoria y SQLite por servicio. No levantes varias réplicas del coordinador sin sustituir el bloqueo por un mecanismo distribuido. El JWT no dispone de revocación individual; “Cerrar sesión” borra el token del navegador. No hay recuperación de contraseña por correo ni panel de gestión accesible a cuentas normales; el panel de dueño local requiere elevar una cuenta desde la terminal. No se configuran impuestos jurisdiccionales, promociones, tallas como variantes, transportista real ni proveedor de pagos real. Las devoluciones aprobadas ejecutan reembolsos completos en la pasarela simulada. Los comprobantes son imprimibles, no fiscales. Estas funciones no se presentan como operativas.

Para cobros reales hace falta integrar un proveedor, usar tokenización/checkout alojado y webhooks verificados, definir conciliación y reembolsos y probar los fallos correspondientes. No basta con cambiar `PAYMENT_MODE`: el programa rechaza modos distintos de `demo`.

## Panel profesional ampliado

El panel incorpora proveedores (alta, consulta y edición), un registro de compras a proveedores, y decisiones de aprobación/rechazo de solicitudes. Las compras a proveedores registran mercancía recibida con producto, cantidad y costo unitario; incrementan stock automáticamente de forma idempotente. La aprobación ejecuta el reembolso completo simulado, incluido el envío; se refleja en el pedido y la solicitud. El recibo se abre en un modal con folio completo, domicilio, fecha, tabla de líneas y totales. Usa Imprimir / Guardar PDF para abrir el diálogo del navegador.

Auth devuelve también `role: customer|admin`, conservando `rol` por compatibilidad. Bootstrap estilizado se carga desde CDN; las reglas locales mantienen el diseño básico si no hay conexión.

Para actualizar desde el ZIP anterior, detén los servicios, respalda `data/` y `.env`, reemplaza únicamente archivos de código y conserva esos datos. Las nuevas tablas se crean al arrancar.

## Rediseño de tienda y reposición en devoluciones

La navegación superior permanece fija; el botón del carrito abre un panel lateral editable. Las vistas de administrador presentan tablas y formularios en modales. El recibo y las solicitudes de devolución usan modales. Las nuevas capas visuales son `web/premium.css` y `web/premium.js`.

Aprobar una devolución confirma que se recibieron los artículos: devuelve el pago y repone las cantidades completas del pedido una sola vez. Las solicitudes reembolsadas antes de esta actualización que todavía no tengan reposición se regularizan automáticamente al iniciar. Si Inventario falla, se conserva la operación pendiente y se reintenta sin duplicar pagos ni stock.

Para actualizar conserva `.env` y `data/`, sustituye el código con los servicios detenidos, arranca `npm start` y recarga el navegador.

## Identidad visual Studio

La actualización visual Studio usa marfil, azul tinta y mandarina, fotografía editorial y una nueva portada “Todo para su mejor vida.”. Ver docs/IDENTIDAD_VISUAL.md. Reemplaza la carpeta web completa, incluidos los nuevos assets y identity.css, manteniendo data/ y .env; reinicia y recarga el navegador.
