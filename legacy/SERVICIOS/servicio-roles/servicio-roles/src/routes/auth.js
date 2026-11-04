const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
const MAX_INTENTOS = parseInt(process.env.MAX_INTENTOS || '5', 10);

// POST /auth/login  { correo, password }
router.post('/login', async (req, res, next) => {
  try {
    const { correo, password } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ error: 'correo y password son obligatorios' });
    }

    const [rows] = await db.query(
      `SELECT u.id, u.password_hash, u.estado, u.intentos_fallidos, r.nombre_rol AS rol
         FROM USUARIOS u JOIN ROLES r ON r.id = u.id_rol
        WHERE u.correo = ?`,
      [correo]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (u.estado === 'bloqueado') {
      return res.status(403).json({ error: 'Usuario bloqueado por intentos fallidos' });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      const intentos = u.intentos_fallidos + 1;
      const bloquear = intentos >= MAX_INTENTOS;
      await db.query(
        'UPDATE USUARIOS SET intentos_fallidos = ?, estado = ? WHERE id = ?',
        [intentos, bloquear ? 'bloqueado' : 'activo', u.id]
      );
      return res.status(bloquear ? 403 : 401).json({
        error: bloquear ? 'Usuario bloqueado por intentos fallidos' : 'Credenciales incorrectas',
      });
    }

    await db.query('UPDATE USUARIOS SET intentos_fallidos = 0 WHERE id = ?', [u.id]);
    const token = jwt.sign({ sub: u.id, rol: u.rol }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });
    res.json({ token, rol: u.rol });
  } catch (err) {
    next(err);
  }
});

// POST /auth/verify  (Authorization: Bearer <token>)
// Lo usan los demás servicios para saber quién es el usuario y qué rol tiene.
router.post('/verify', autenticar, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

module.exports = router;
