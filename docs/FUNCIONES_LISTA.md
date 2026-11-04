# Funciones de la lista

Novedades: Administración → Reportes y envíos.

- 7: reporte de existencias y descarga CSV.
- 8 y 9: límites mínimo/máximo persistentes por producto y alertas visuales. Predeterminados: 5 y 100. El exceso permite decidir ofertas; el precio se ajusta en Inventario. No hay descuentos automáticos ni alertas por correo.
- 11: eliminación de proveedores sin compras; los históricos se conservan. Alta, consulta y edición ya existían.
- 13: reporte de compras con proveedor, fecha, importe y estado; descarga CSV.
- 23 y 24: avance manual Preparando → En camino → Entregado. Se registra receptor y fecha, visibles en el historial. No contrata transportista ni prueba identidad del receptor.

Ya disponibles: 1 login; 2 registro con validaciones de formato (sin comprobar propiedad del correo); 5 roles; 6 CRUD de inventario; 10 reseñas de compradores; 12 registro de compras/pedidos; 14 y 25 devoluciones/garantías completas; 15 permisos; 16 carrito; 17 domicilio; 20 recibo imprimible; 22 historial.

Pendientes: 3 protección antibot dedicada; 4 recuperación segura de contraseña; verificación de correo/teléfono del punto 2; 18 y 19 pagos y validación bancaria reales; 21 envío de comprobantes por correo. Requieren definir proveedores y configuración, o un diseño de seguridad adicional. La pasarela actual permanece simulada.

## Actualizar

Detén la tienda. Copia `web/` y `services/commerce/server.mjs` del ZIP sobre tu instalación. Conserva `.env` y `data/`. Ejecuta `npm start` y recarga con Ctrl+Shift+R. La tabla de límites se crea automáticamente en commerce.sqlite.

En Windows configura PYTHON=python en .env si ese es el comando instalado. Usa Node 24.4 o superior dentro de la rama 24.
