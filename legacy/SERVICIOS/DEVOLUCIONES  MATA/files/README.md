# Servicio de Devoluciones

## Cómo correrlo
1. Instala Node.js (v18 o superior).
2. En esta carpeta: `npm install`
3. `npm start`
4. Abre http://localhost:3000

Se crea sola la base de datos `tienda.db` (SQLite) con datos de prueba.
Prueba: venta 1, correo `ana@correo.com` (dentro del plazo) · venta 2, `carlos@correo.com` (fuera de plazo -> rechazada).

## API (JSON)
- POST /api/devoluciones
  Entrada:
  {"id_venta":1,"id_producto":1,"cantidad":1,"motivo":"Llegó dañado","fecha_devolucion":"2026-09-29","cliente":{"nombre":"Ana López","email":"ana@correo.com"}}
  Salida:
  {"numero_devolucion":1,"estado":"aceptada","mensaje":"...","fecha_procesamiento":"...","reembolso":{"monto":450,"moneda":"MXN","metodo":"..."}}
- GET /api/devoluciones · GET /api/devoluciones/:id · GET /api/ventas/:id

## HTTPS
En local corre en HTTP. En producción ponlo detrás de un proxy con certificado (Nginx, Render, Railway, etc.) o usa `https.createServer` con tu certificado.

## Para fusionarlo con el proyecto del equipo
- Si ya tienen tablas de clientes/productos/ventas, borra esas del `schema.sql` y ajusta los nombres de columnas en las consultas de `server.js`.
- Si el front va en otro servidor, cambia la constante `API` en `public/index.html`.
