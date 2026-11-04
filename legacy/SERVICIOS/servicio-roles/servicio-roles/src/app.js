require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ servicio: 'roles', ok: true }));
app.use('/auth', require('./routes/auth'));
app.use('/roles', require('./routes/roles'));
app.use('/usuarios', require('./routes/usuarios'));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servicio de roles en http://localhost:${PORT}`));
