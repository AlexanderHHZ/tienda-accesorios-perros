const express = require('express');
const db = require('../db');
const { autenticar, requiereRol } = require('../middleware/auth');

const router = express.Router();

// GET /usuarios/:id/rol  (admin, o el propio usuario)
router.get('/:id/rol', autenticar, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.usuario.rol !== 'admin' && req.usuario.id !== id) {
      return res.status(403).json({ error: 'Solo puedes consultar tu propio rol' });
    }
    const [rows] = await db.query(
      `SELECT u.id, u.nombre, u.estado, r.nombre_rol AS rol
         FROM USUARIOS u JOIN ROLES r ON r.id = u.id_rol WHERE u.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /usuarios/:id/rol  { nombre_rol }  (solo admin)
router.put('/:id/rol', autenticar, requiereRol('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre_rol } = req.body || {};
    if (!nombre_rol) return res.status(400).json({ error: 'nombre_rol es obligatorio' });

    const [rol] = await db.query('SELECT id FROM ROLES WHERE nombre_rol = ?', [nombre_rol]);
    if (rol.length === 0) return res.status(400).json({ error: 'Rol inexistente' });

    const [r] = await db.query('UPDATE USUARIOS SET id_rol = ? WHERE id = ?', [rol[0].id, id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Rol actualizado', id, nombre_rol });
  } catch (err) {
    next(err);
  }
});

// POST /usuarios/:id/desbloquear  (solo admin)
router.post('/:id/desbloquear', autenticar, requiereRol('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [r] = await db.query(
      "UPDATE USUARIOS SET estado = 'activo', intentos_fallidos = 0 WHERE id = ?",
      [id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario desbloqueado', id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
