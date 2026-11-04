const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Valida el token y vuelve a consultar la BD para asegurar que el usuario
 * sigue existiendo, no está bloqueado y conserva el rol actual.
 */
async function autenticar(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token requerido (Authorization: Bearer <token>)' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const [rows] = await db.query(
      `SELECT u.id, u.nombre, u.correo, u.estado, r.nombre_rol AS rol,
              EXISTS(SELECT 1 FROM CLIENTES c WHERE c.id_usuario = u.id) AS es_cliente
         FROM USUARIOS u JOIN ROLES r ON r.id = u.id_rol
        WHERE u.id = ?`,
      [payload.sub]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no existe' });
    if (rows[0].estado === 'bloqueado') return res.status(403).json({ error: 'Usuario bloqueado' });

    req.usuario = { ...rows[0], es_cliente: !!rows[0].es_cliente };
    next();
  } catch (err) {
    next(err);
  }
}

/** Permite el paso solo si el rol del usuario está en la lista. */
function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        rol_actual: req.usuario.rol,
        roles_requeridos: rolesPermitidos,
      });
    }
    next();
  };
}

module.exports = { autenticar, requiereRol };
