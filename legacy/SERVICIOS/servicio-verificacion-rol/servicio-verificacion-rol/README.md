# Servicio de Control de Acceso — Verificación de Rol

Primer servicio programado de la tienda en línea, correspondiente al módulo
**Control de Acceso** del diseño de base de datos (BD02), específicamente
al punto *"Verificación de roles – tipos de usuarios"*.

---

## 1. Stack tecnológico y por qué se eligió

| Tecnología | Rol en el proyecto |
|---|---|
| **Node.js + TypeScript** | Runtime y tipado estático. TS evita errores de "campo mal escrito" al mapear las tablas de BD02 (id_rol, nombre_rol, etc.) en objetos JS. |
| **Express** | Framework HTTP minimalista, ideal para encadenar middlewares — que es exactamente el patrón que necesita "verificar rol antes de cada servicio". |
| **Prisma ORM** | Genera un cliente tipado a partir de `schema.prisma`. Las relaciones FK (USUARIOS.id_rol → ROLES.id) quedan como objetos anidados (`usuario.rol.nombreRol`) sin escribir SQL a mano. |
| **JWT (jsonwebtoken)** | El rol se "embebe" dentro del token al hacer login. Así, verificar el rol en rutas protegidas **no requiere consultar la BD en cada request** — se lee directamente del token verificado. |
| **bcrypt** | Hash de contraseñas (nunca se guarda texto plano en `password_hash`). |

---

## 2. Estructura del proyecto

```
servicio-verificacion-rol/
├── prisma/
│   └── schema.prisma          # Modelos ROLES y USUARIOS (subconjunto de BD02)
├── src/
│   ├── config/
│   │   └── prisma.ts          # Cliente Prisma (singleton)
│   ├── controllers/
│   │   └── auth.controller.ts # Lógica de login y verificación de sesión
│   ├── middleware/
│   │   ├── auth.middleware.ts # Valida el JWT (autenticación)
│   │   └── role.middleware.ts # Valida el ROL del usuario (autorización)
│   ├── routes/
│   │   └── auth.routes.ts     # Endpoints /auth/*
│   ├── types/
│   │   └── auth.types.ts      # Tipos compartidos (payload del JWT)
│   ├── app.ts                 # Configuración de Express
│   └── server.ts              # Arranque del servidor
├── .env.example
├── package.json
└── tsconfig.json
```

**Por qué esta separación:** cada carpeta corresponde a una responsabilidad
distinta (config / lógica de negocio / seguridad / rutas / tipos), de modo
que cuando programemos los siguientes servicios (inventario, compras,
ventas) solo se agregan controladores y rutas nuevas — **los middlewares
`auth.middleware.ts` y `role.middleware.ts` se reutilizan tal cual**, ya
que el análisis previo mostró que casi todos los 25 servicios necesitan
esta misma verificación antes de ejecutarse.

---

## 3. Cómo funciona (flujo completo)

### Paso 1 — Login (`POST /auth/login`)
1. El cliente envía `correo` y `password`.
2. Se busca al usuario en la tabla `USUARIOS` **incluyendo su rol**
   (`include: { rol: true }`), gracias a la relación FK definida en Prisma.
3. Se compara el password con `bcrypt.compare()` contra `password_hash`.
4. Si es válido, se firma un JWT que contiene:
   ```json
   { "idUsuario": 12, "correo": "ana@correo.com", "idRol": 2, "nombreRol": "ADMIN" }
   ```
5. Se devuelve el token al cliente. A partir de aquí, **el rol viaja
   embebido en cada request** vía el header `Authorization`.

Efecto colateral incluido: si el password es incorrecto, se incrementa
`intentos_fallidos` y al llegar a 5 la cuenta pasa a `estado = bloqueado`
(base para el servicio de verificación de bots / fuerza bruta).

### Paso 2 — Autenticación (`auth.middleware.ts`)
En cada request a una ruta protegida:
1. Lee el header `Authorization: Bearer <token>`.
2. Verifica firma y expiración con `jwt.verify()`.
3. Si es válido, adjunta los datos del usuario a `req.usuario`.
4. Si no, responde `401 Token inválido o expirado`.

### Paso 3 — Verificación de Rol (`role.middleware.ts`) — el servicio pedido
1. Es una **función que genera middlewares**: `verificarRol("ADMIN", "VENTAS")`.
2. Lee `req.usuario.nombreRol` (ya puesto ahí por el paso 2).
3. Si el rol está en la lista permitida → `next()` (continúa a la ruta real).
4. Si no → `403 No tienes permisos`, indicando el rol actual y los permitidos.

### Ejemplo de uso combinado en una ruta futura (inventario):
```ts
router.post(
  "/productos",
  verificarAutenticacion,        // ¿quién eres?
  verificarRol("ADMIN", "INVENTARIO"), // ¿tienes permiso?
  crearProducto                  // lógica del servicio 6 (Registrar producto)
);
```

Este mismo patrón se repetirá para **compras**, **ventas/carrito**, y
**reportes** — solo cambia la lista de roles permitidos según el servicio.

---

## 4. Endpoints incluidos en este entregable

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Verifica credenciales y devuelve JWT con rol |
| GET | `/auth/verificar-rol` | Requiere token | Confirma sesión activa y devuelve el rol detectado |
| GET | `/auth/solo-admin` | Requiere token + rol ADMIN | Ejemplo de ruta restringida por rol |
| GET | `/health` | Público | Verifica que el servicio esté arriba |

---

## 5. Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# editar DATABASE_URL y JWT_SECRET

# 3. Generar el cliente de Prisma y aplicar el esquema
npm run prisma:generate
npm run prisma:migrate

# 4. Levantar en modo desarrollo
npm run dev
```

Prueba rápida con curl:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"ana@correo.com","password":"1234"}'

curl http://localhost:3000/auth/solo-admin \
  -H "Authorization: Bearer <TOKEN_OBTENIDO>"
```

---

## 6. Notas de seguridad para producción
- `JWT_SECRET` debe ser un valor largo y aleatorio, nunca el del `.env.example`.
- Considerar `refresh tokens` si el tiempo de expiración (`JWT_EXPIRES_IN`) es corto.
- El campo `password_hash` nunca se expone en las respuestas (no se incluye en el `select`/`json` de salida).
- El bloqueo por intentos fallidos es una base simple; para "verificación de bots" real se recomienda sumar reCAPTCHA/hCaptcha en el frontend antes de llegar a este endpoint.

---

## 7. Siguiente paso sugerido
Con este middleware ya reutilizable, el siguiente servicio lógico a programar
sería **Nuevo usuario** (registro con verificación de usuario/contraseña/correo)
o directamente **Inventario CRUD**, aplicando `verificarRol("ADMIN", "INVENTARIO")`
sobre las rutas de PRODUCTOS.
