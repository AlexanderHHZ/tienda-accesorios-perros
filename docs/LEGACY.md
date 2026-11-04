# Módulos originales: instalación nativa y coexistencia

Estos comandos son para estudiar o continuar **los módulos independientes originales**. No se necesitan para arrancar Huella. No se verificó la instalación ni el arranque de todos sus frameworks; se derivan de los manifiestos y fuentes del ZIP. Mantienen sus contratos y datos separados. No apuntes `*_URL` de Huella a un original: no es intercambiable sin adaptar su contrato.

## Node.js / TypeScript

Abre una terminal en la ruta indicada bajo `legacy/SERVICIOS`. Usa la versión de Node indicada en su `package.json`; empaquetado y garantías solicitan Node 24. Después configura su `.env` desde `.env.example`, si existe. Los `.env` del ZIP se han excluido.

| Carpeta | Instalar | Arrancar según scripts del paquete |
|---|---|---|
| `CRUD INVENTARIO/inventario-service-main` | `npm install` | `npm run dev` |
| `DEVOLUCIONES  MATA/files` | `npm install` | `npm start` |
| `Inventario/Inventario` | `npm install` | `npm run dev` |
| `comentarios-resenas-service/comentarios-resenas-service` | `npm install` | `npm start` |
| `empaquetado-service-main/empaquetado-service-main/api` | `npm install` | `npm run dev` |
| `empaquetado-service-main/empaquetado-service-main` | `npm install` | `npm run dev` |
| `empaquetado-service-main/empaquetado-service-main/web` | `npm install` | `npm run dev` |
| `garantias-devoluciones/garantias-devoluciones` | `npm install` | `npm run dev` |
| `garantias-devoluciones/garantias-devoluciones/web` | `npm install` | `npm run dev` |
| `microservicio-login/microservicio-login` | `npm install` | `npm run dev` |
| `servicio-reporte-compras (2)/servicio-reporte-compras` | `npm install` | `npm run dev` |
| `servicio-reporte-compras (2)/servicio-reporte-compras/servicio-reporte-compras` | `npm install` | `npm run dev` |
| `servicio-roles/servicio-roles` | `npm install` | `npm run dev` |
| `servicio-verificacion-rol/servicio-verificacion-rol` | `npm install` | `npm run dev` |
| `servicio-verificacion-tarjeta/servicio-verificacion-tarjeta` | `npm install` | `npm run dev` |
| `soa-servicio-reset-password-main/soa-servicio-reset-password-main/api` | `npm install` | `npm run dev` |
| `soa-servicio-reset-password-main/soa-servicio-reset-password-main/frontend` | `npm install` | `npm run dev` |
| `verificacion-bot/verificacion-bot` | `npm install` | `Sin script de arranque; consultar README/server.js` |

Para proyectos TypeScript con script `build`, ejecuta `npm run build` antes de `npm start` si quieres el modo compilado. Los proyectos Prisma requieren configurar `DATABASE_URL`, luego `npm run prisma:generate` y `npm run prisma:migrate` contra su propia base vacía. No se presume compatibilidad entre modelos Prisma y los SQL de otros servicios.

Empaquetado es un workspace: instala desde su raíz y ejecuta `npm run setup`; este script corre la migración de su SQLite. Para garantías, los repositorios originales están en memoria: reiniciar pierde ese estado.

## Python

Crea un entorno virtual **por proyecto**, actívalo y ejecuta `python -m pip install -r requirements.txt` donde exista. Estos paquetes sí se descargan de Internet. Comandos orientativos desde cada carpeta:

| Proyecto / carpeta bajo SERVICIOS | Arranque aislado |
|---|---|
| `serviciopago/serviciopago` | `python -m uvicorn app:app --host 127.0.0.1 --port 5103` |
| `microservicio-historial-compras-main/microservicio-historial-compras-main` | Instalar `fastapi uvicorn` (no trae requirements); `python -m uvicorn main:app --port 5110` |
| `microservicio-validacion-entregas/microservicio-validacion-entregas` | `python -m uvicorn app.main:app --port 5112` |
| `ticket_service` | `python -m uvicorn app.main:app --port 5114` |
| `logistica_envios_python_arreglado/logistica_envios_python` | `python -m flask --app app run --host 127.0.0.1 --port 5111` |
| `servicio_proveedores_python_mysql_json/servicio_proveedores` | `python -m flask --app app run --host 127.0.0.1 --port 5115` |
| `modulo_comprobante` | `python -m flask --app app.main run --host 127.0.0.1 --port 5113` |

El requirements de validación de entregas viene codificado en UTF-16. Si tu pip no lo interpreta, conviértelo a UTF-8 antes de instalar (no cambies a mano los nombres de paquetes). El módulo ticket requiere PostgreSQL según sus dependencias/configuración; no basta con levantar MySQL.

## .NET

Entra en cada carpeta con `.csproj`. Ejecuta `dotnet restore`, luego `dotnet build` y `dotnet run --no-launch-profile --urls http://127.0.0.1:PUERTO`. Instala el SDK que corresponda al TargetFramework; no se modificaron las versiones NuGet del ZIP ni se verificó su restauración aquí.

| Proyecto | SDK / plataforma | Puerto reservado |
|---|---|---:|
| `RegistroPedidosService-main/RegistroPedidosService-main` | .NET 10 | 5201 |
| `soa-agregar-producto/soa-agregar-producto/Backend` | .NET 8 | 5202 |
| `MicroservicioStockMaxOfertas/MicroservicioStockMaxOfertas/StockOfertasApi` | .NET 8 | 5203 |
| `Servicio_Fondo/FondoService-main` | .NET 10 | 5204 |
| `AlertaStockMinimo/AlertaStockMinimo` | .NET 10, Windows Forms, Windows | Sin puerto HTTP |

Para pedidos original, establece `ASPNETCORE_ENVIRONMENT=Development` si quieres su base EF en memoria. Fuera de Development usa MySQL y lee `ConnectionStrings__MySqlBDO2`. En PowerShell: `$env:ASPNETCORE_ENVIRONMENT="Development"`; en POSIX: `export ASPNETCORE_ENVIRONMENT=Development`. La memoria de desarrollo no conecta con los pedidos SQLite de Huella.

## MySQL local para los originales

1. Instala y arranca MySQL local en 3306.
2. Abre el SQL del proyecto elegido y comprueba `CREATE DATABASE`, `USE`, nombres de tablas y cualquier sentencia destructiva. Algunos scripts usan nombres de base ya fijados; no los ejecutes todos en la misma base.
3. Crea un usuario de aplicación sin privilegios globales para la base de ese proyecto. Usa una contraseña nueva.
4. Importa **solo su esquema** y después su seed, cuando exista. Los nombres de bases deben coincidir con el script y su `.env`.
5. Copia `.env.example` a `.env` en ese módulo y define `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y el `PORT` reservado. Usa los nombres exactos que declare su configuración si son diferentes.

Ejemplo genérico desde el cliente MySQL, sustituyendo nombre y contraseña:

```sql
CREATE DATABASE huella_legacy_inventario CHARACTER SET utf8mb4;
CREATE USER 'huella_legacy'@'localhost' IDENTIFIED BY 'SUSTITUIR_POR_CLAVE_LOCAL';
GRANT SELECT, INSERT, UPDATE, DELETE ON huella_legacy_inventario.* TO 'huella_legacy'@'localhost';
```

El usuario que importa un esquema necesita privilegios de creación; usa una cuenta de administración solo para ese paso. Si el SQL contiene `USE otra_base`, ajusta la base elegida conscientemente antes de importar. No hay un `schema.sql` universal válido para todos.

Esquemas disponibles:

- `CRUD INVENTARIO/inventario-service-main/database/schema.sql`
- `DEVOLUCIONES  MATA/files/schema.sql`
- `DEVOLUCIONES  MATA/files/seed.sql`
- `Inventario/Inventario/sql/01-schema.sql`
- `Inventario/Inventario/sql/02-seed.sql`
- `empaquetado-service-main/empaquetado-service-main/api/migrations/001_create_empaquetados.sql`
- `logistica_envios_python_arreglado/logistica_envios_python/database.sql`
- `microservicio-login/microservicio-login/database/esquema.sql`
- `servicio-reporte-compras (2)/servicio-reporte-compras/servicio-reporte-compras/sql/01_base_datos.sql`
- `servicio-reporte-compras (2)/servicio-reporte-compras/servicio-reporte-compras/sql/02_usuario.sql`
- `servicio-reporte-compras (2)/servicio-reporte-compras/sql/01_base_datos.sql`
- `servicio-reporte-compras (2)/servicio-reporte-compras/sql/02_usuario.sql`
- `servicio-roles/servicio-roles/schema.sql`
- `servicio-verificacion-tarjeta/servicio-verificacion-tarjeta/database/bd02_tarjetas.sql`
- `servicio_proveedores_python_mysql_json/servicio_proveedores/schema.sql`
- `soa-agregar-producto/soa-agregar-producto/Database/schema.sql`

Login original incluye `npm run db:schema` y `npm run db:usuarios`; lee sus scripts antes de ejecutarlos, especialmente `db:reset`, que es destructivo. Para .NET/MySQL puedes establecer `ConnectionStrings__MySqlBDO2` con `Server=127.0.0.1;Port=3306;Database=...;User=...;Password=...;`. No uses el usuario root para operar la aplicación.

## Puertos reservados para evitar colisiones con Huella

Estas asignaciones son una propuesta para levantar originales de forma aislada. No significan que se haya cambiado el puerto en sus fuentes. En Node usa `PORT` donde lo soporte; en scripts con puertos fijos adáptalos. En Python/.NET utiliza los argumentos indicados arriba. Actualiza también CORS/URLs de cada frontend original.

| Original | Puerto |
|---|---:|
| Login | 5101 |
| CRUD inventario | 5102 |
| Pagos FastAPI | 5103 |
| Reportes de inventario | 5104 |
| Roles Node | 5105 |
| Verificación de rol TS | 5106 |
| Verificación de tarjeta TS | 5107 |
| Reseñas | 5108 |
| Reporte compras (solo una copia) | 5109 |
| Historial | 5110 |
| Logística | 5111 |
| Validación entregas | 5112 |
| Comprobante Flask | 5113 |
| Ticket FastAPI | 5114 |
| Proveedores | 5115 |
| Devoluciones MATA | 5116 |
| Garantías API / frontend | 5117 / 5317 |
| Empaquetado API / frontend | 5118 / 5318 |
| Reset password API / frontend | 5119 / 5319 |
| Verificación bot | 5120 |

Los cuatro componentes estáticos se sirven en 8080 en Huella. Los otros .NET utilizan 5201–5204 como se indicó. MySQL 3306 y PostgreSQL 5432 son puertos de base, no APIs.
