# Contratos HTTP del perfil local

Base pública: `http://localhost:8080`. Todas las respuestas son JSON salvo archivos estáticos. Errores: `{ "message": "explicación" }`, con HTTP 400, 401, 403, 404, 409, 413, 429 o 5xx. Las rutas protegidas requieren `Authorization: Bearer TOKEN`.

| Método y ruta | Acceso | Cuerpo / respuesta |
|---|---|---|
| POST `/api/auth/register` | Público, limitado | `nombreUsuario, nombreCompleto, email, contrasena`; devuelve sesión/token |
| POST `/api/auth/login` | Público, limitado | `nombreUsuario, contrasena`; devuelve sesión/token |
| GET `/api/auth/me` | Sesión | Usuario actual sin hash |
| GET `/api/productos` | Público | `{success:true,data:[producto]}` |
| GET `/api/productos/:id` | Público | `{success:true,data:producto}` |
| GET `/api/cart` | Sesión | `items, subtotal, shipping, total, currency` |
| PUT `/api/cart` | Sesión | `{id:1,qty:2}`; cantidad absoluta, 0 elimina |
| POST `/api/checkout` | Sesión | `address,token`; cabecera `Idempotency-Key` obligatoria |
| GET `/api/orders` | Sesión | Pedidos del usuario |
| GET `/api/orders/:uuid` | Sesión | Solo pedido propio; si es ajeno: 404 |
| GET `/api/reviews?product=1` | Público | Reseñas del producto |
| POST `/api/reviews` | Comprador | `product_id,rating (1–5),comment`; crea/actualiza su reseña |
| GET `/api/returns` | Sesión | Solicitudes propias |
| GET `/api/admin/products` | Administrador | Lista productos activos para el panel |
| POST `/api/admin/products` | Administrador | Crea producto y puede cargar imagen |
| PUT `/api/admin/products/:id` | Administrador | Actualiza ficha, precio MXN, stock e imagen |
| DELETE `/api/admin/products/:id` | Administrador | Retiro lógico si no hay carritos/pedidos asociados |
| POST `/api/returns` | Comprador | `order_id,reason` (10–1000 caracteres) |
| GET `/health` | Local | Estado del proceso, disponible en los seis puertos |

Registro de ejemplo:

```bash
curl http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nombreUsuario":"ana","nombreCompleto":"Ana Pérez","email":"ana@example.test","contrasena":"UnaClaveDePrueba123!"}'
```

Guarda el `token` de respuesta en una variable de tu terminal. Ejemplo POSIX (sustituye el texto):

```bash
TOKEN='PEGA_AQUI_EL_TOKEN'
curl -X PUT http://localhost:8080/api/cart \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":1,"qty":1}'
curl http://localhost:8080/api/checkout \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: compra-prueba-0001' \
  -d '{"token":"demo_approved","address":{"nombre":"Ana","telefono":"5512345678","calle":"Parque","numero_casa":"10","colonia":"Centro","ciudad":"Ciudad de México","estado":"CDMX","cp":"06000"}}'
```

Repite la misma solicitud con la misma clave para comprobar que devuelve el mismo pedido. Usa una clave distinta para una nueva compra. El token `demo_declined` prueba un rechazo. Un 200 de checkout puede contener un estado pendiente o rechazado: comprueba siempre `state`, no solo el código HTTP.

Para administrar, registra una cuenta de cliente y promuévela con `npm run admin -- promote NOMBRE_USUARIO`; cierra sesión y vuelve a entrar. Nunca publiques esta función como registro abierto.

Primero registra una cuenta normal y promuévela desde la terminal con `npm run admin -- promote NOMBRE_USUARIO`; cierra sesión y vuelve a entrar para mostrar el panel.

## Rutas exclusivamente internas

Requieren `X-Internal-Key`, no son accesibles mediante el gateway:

- Inventario `POST /internal/reservations`: `{id, items:[{id,qty}]}`.
- Inventario `POST /internal/reservations/:id/commit` o `/release`: `{}`.
- Inventario `PUT /api/productos/:id`: `{stock}`; el gateway no pasa la clave interna, por lo que este método no se habilita para clientes.
- Pagos `POST /internal/payments`: `{id,amount,token}`; retorna `status`, `motivo`, `ultimos4`, importe e ID.
- Envíos `POST /internal/shipments`: `{id,address}`.
- Envíos `GET /internal/shipments/:id`.

`/health` comprueba vida del proceso, no toda la cadena de dependencias. La suite de integración comprueba la cadena completa.

### Proveedores, compras y decisiones

- GET/POST `/api/admin/suppliers`: lista o registra `nombre,email,telefono`.
- PUT `/api/admin/suppliers/:id`: actualiza esos datos.
- GET/POST `/api/admin/purchases`: lista o registra `supplier_id,detalle,items:[{id,qty,unit_cost}]` con `Idempotency-Key`; costo unitario en centavos y total calculado por el servidor.
- GET `/api/admin/returns`: todas las solicitudes.
- PUT `/api/admin/returns/:uuid`: `{status:"Aprobada"}` o `{status:"Rechazada"}`. Aprobar ejecuta el reembolso completo simulado; un reintento devuelve el resultado guardado.
- POST `/api/returns` acepta también `kind`: `Devolución` o `Garantía`.

Todas las rutas administrativas verifican el rol desde Auth. Las compras recibidas incrementan stock automáticamente. Aprobar devuelve el importe completo en la pasarela simulada. Ambas operaciones se recuperan tras fallos sin duplicar sus efectos.
