const express = require('express');
const db = require('../db');
const { autenticar, requiereRol } = require('../middleware/auth');

const router = express.Router();

// GET /roles  -> lista de roles (solo admin)
router.get('/', autenticar, requiereRol('admin'), async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, nombre_rol, descripcion FROM ROLES');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /roles/check?rol=admin,empleado
// 200 si el usuario tiene alguno de esos roles, 403 si no.
router.get('/check', autenticar, (req, res) => {
  const pedidos = String(req.query.rol || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  if (pedidos.length === 0) {
    return res.status(400).json({ error: 'Indica ?rol=nombre[,nombre2]' });
  }
  const permitido = pedidos.includes(req.usuario.rol);
  res.status(permitido ? 200 : 403).json({
    permitido,
    rol_actual: req.usuario.rol,
    roles_consultados: pedidos,
  });
});

module.exports = router;
