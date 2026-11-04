// =========================================================
// Servicio de Devoluciones - Backend (Node.js + Express + SQLite integrado)
// Protocolo: HTTPS (en local corre en HTTP; ver README) | Mensajes: JSON
// =========================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite'); // SQLite incluido en Node.js 22.5+

const PLAZO_DIAS = 30;               // regla de negocio: plazo máximo para devolver
const PORT = process.env.PORT || 3000;

// ---------- Base de datos ----------
const db = new DatabaseSync(path.join(__dirname, 'tienda.db'));
db.exec('PRAGMA foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Datos de prueba: se cargan en una transacción, así que si el seed falla
// no queda la base a medias (todo o nada). Solo se cargan si la BD está vacía.
if (db.prepare('SELECT COUNT(*) AS n FROM ventas').get().n === 0) {
  db.exec('BEGIN');
  try {
    db.exec("DELETE FROM clientes; DELETE FROM productos; DELETE FROM sqlite_sequence WHERE name IN ('clientes','productos');");
    db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    console.error('Error al cargar seed.sql:', e.message);
    throw e;
  }
}

// Ejecuta fn dentro de una transacción: o se guarda todo o no se guarda nada
function transaccion(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

// ---------- Pasarela de pago ----------
// IMPORTANTE: esta función SIMULA el reembolso. No mueve dinero real.
// Para reembolsar dinero de verdad hay que conectar aquí una pasarela
// (Stripe, Mercado Pago, PayPal...). Ejemplo con Stripe (modo de pruebas):
//   const refund = await stripe.refunds.create({ payment_intent: venta.referencia_pago,
//                                                amount: Math.round(monto * 100) });
//   return { ok: refund.status !== 'failed', referencia: refund.id };
function procesarReembolso({ monto, venta }) {
  const referencia = `RB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return { ok: true, referencia, metodo: `${venta.metodo_pago} (pago ${venta.referencia_pago || 's/n'})` };
}

// ---------- App ----------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const diasEntre = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
const hoy = () => new Date().toISOString().slice(0, 10);

// ===== Catálogos (para llenar listas en la página) =====
app.get('/api/clientes', (req, res) => res.json(db.prepare('SELECT id, nombre, email FROM clientes ORDER BY id').all()));
app.get('/api/productos', (req, res) => res.json(db.prepare('SELECT id, nombre, precio, stock FROM productos ORDER BY id').all()));

// ===== Agregar datos =====
app.post('/api/clientes', (req, res) => {
  const { nombre, email } = req.body || {};
  if (!nombre || String(nombre).trim().length < 2) return res.status(400).json({ error: 'Nombre obligatorio' });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Correo inválido' });
  try {
    const info = db.prepare('INSERT INTO clientes (nombre, email) VALUES (?, ?)').run(String(nombre).trim(), String(email).trim());
    res.status(201).json({ id: Number(info.lastInsertRowid), nombre, email });
  } catch (e) {
    res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
  }
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, stock } = req.body || {};
  if (!nombre || String(nombre).trim().length < 2) return res.status(400).json({ error: 'Nombre obligatorio' });
  if (!(Number(precio) > 0)) return res.status(400).json({ error: 'Precio debe ser mayor a 0' });
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ error: 'Stock debe ser un entero de 0 o más' });
  const info = db.prepare('INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)')
    .run(String(nombre).trim(), Number(precio), Number(stock));
  res.status(201).json({ id: Number(info.lastInsertRowid), nombre, precio: Number(precio), stock: Number(stock) });
});

// Crear una venta (queda pagada; descuenta inventario)
app.post('/api/ventas', (req, res) => {
  const { id_cliente, id_producto, cantidad, metodo_pago } = req.body || {};
  if (!Number.isInteger(id_cliente) || !Number.isInteger(id_producto) || !Number.isInteger(cantidad) || cantidad <= 0)
    return res.status(400).json({ error: 'Datos inválidos (cliente, producto y cantidad son obligatorios)' });

  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id_cliente);
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id_producto);
  if (!cliente) return res.status(404).json({ error: 'Cliente no existe' });
  if (!producto) return res.status(404).json({ error: 'Producto no existe' });
  if (producto.stock < cantidad) return res.status(409).json({ error: `Stock insuficiente (disponible: ${producto.stock})` });

  const idVenta = transaccion(() => {
    const referencia = `PAY-${Date.now()}`;
    const v = db.prepare(`INSERT INTO ventas (id_cliente, fecha, estado_pago, metodo_pago, referencia_pago)
                          VALUES (?, ?, 'pagada', ?, ?)`).run(id_cliente, hoy(), metodo_pago || 'tarjeta', referencia);
    db.prepare('INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES (?,?,?,?)')
      .run(v.lastInsertRowid, id_producto, cantidad, producto.precio);
    db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?').run(cantidad, id_producto);
    return Number(v.lastInsertRowid);
  });
  res.status(201).json({ id_venta: idVenta, total: +(cantidad * producto.precio).toFixed(2) });
});

// Consultar una venta (sirve para que el front muestre los productos)
app.get('/api/ventas/:id', (req, res) => {
  const venta = db.prepare(`
    SELECT v.id, v.fecha, v.estado_pago, c.nombre AS cliente, c.email
    FROM ventas v JOIN clientes c ON c.id = v.id_cliente
    WHERE v.id = ?`).get(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  venta.productos = db.prepare(`
    SELECT d.id_producto, p.nombre, d.cantidad AS comprada, d.precio_unitario,
           d.cantidad - COALESCE((SELECT SUM(dv.cantidad) FROM devoluciones_venta dv
              WHERE dv.id_venta = d.id_venta AND dv.id_producto = d.id_producto
                AND dv.estado = 'aceptada'), 0) AS disponible
    FROM detalle_venta d JOIN productos p ON p.id = d.id_producto
    WHERE d.id_venta = ?`).all(req.params.id);
  res.json(venta);
});

// ===== Registrar una devolución =====
app.post('/api/devoluciones', (req, res) => {
  const { id_venta, id_producto, cantidad, motivo, fecha_devolucion, cliente } = req.body || {};

  // 1) Validación de formato (400 = petición mal formada)
  const errores = [];
  if (!Number.isInteger(id_venta) || id_venta <= 0) errores.push('id_venta inválido');
  if (!Number.isInteger(id_producto) || id_producto <= 0) errores.push('id_producto inválido');
  if (!Number.isInteger(cantidad) || cantidad <= 0) errores.push('cantidad debe ser un entero mayor a 0');
  if (!motivo || String(motivo).trim().length < 5) errores.push('motivo obligatorio (mínimo 5 caracteres)');
  if (!fecha_devolucion || isNaN(new Date(fecha_devolucion))) errores.push('fecha_devolucion inválida (YYYY-MM-DD)');
  if (!cliente || !cliente.email) errores.push('datos del cliente incompletos (email)');
  if (errores.length) return res.status(400).json({ error: 'Datos inválidos', detalles: errores });

  // 2) Reglas de negocio -> si fallan, la devolución se registra como RECHAZADA
  let rechazo = null;
  let venta, linea, cli;

  venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(id_venta);
  if (!venta) {
    rechazo = 'La venta no existe.';
  } else {
    cli = db.prepare('SELECT * FROM clientes WHERE id = ?').get(venta.id_cliente);
    linea = db.prepare('SELECT * FROM detalle_venta WHERE id_venta = ? AND id_producto = ?')
              .get(id_venta, id_producto);
    const dias = diasEntre(venta.fecha, fecha_devolucion);

    if (cli.email.toLowerCase() !== String(cliente.email).toLowerCase()) {
      rechazo = 'Los datos del cliente no coinciden con la venta.';
    } else if (venta.estado_pago !== 'pagada') {
      rechazo = 'La venta no está pagada, no hay nada que reembolsar.';
    } else if (!linea) {
      rechazo = 'El producto no pertenece a esa venta.';
    } else if (dias < 0) {
      rechazo = 'La fecha de devolución es anterior a la fecha de la venta.';
    } else if (dias > PLAZO_DIAS) {
      rechazo = `Fuera del plazo de devolución (${PLAZO_DIAS} días).`;
    } else {
      const { ya } = db.prepare(`SELECT COALESCE(SUM(cantidad),0) AS ya FROM devoluciones_venta
        WHERE id_venta = ? AND id_producto = ? AND estado = 'aceptada'`).get(id_venta, id_producto);
      const disponible = linea.cantidad - ya;
      if (cantidad > disponible) rechazo = `Cantidad excede lo disponible para devolver (${disponible}).`;
    }
  }

  const aceptada = !rechazo;
  const monto = aceptada ? +(cantidad * linea.precio_unitario).toFixed(2) : 0;
  const procesamiento = new Date().toISOString();
  const motivoTxt = String(motivo).trim();

  // 3a) RECHAZADA: se guarda el intento (si venta y producto existen) y se responde
  if (!aceptada) {
    const mensaje = `Devolución rechazada: ${rechazo}`;
    let numero = null;
    const prodExiste = db.prepare('SELECT 1 FROM productos WHERE id = ?').get(id_producto);
    if (venta && prodExiste) {
      const info = db.prepare(`INSERT INTO devoluciones_venta
        (id_venta, id_producto, cantidad, estado, motivo, fecha_devolucion, fecha_procesamiento, id_cliente, monto_reembolso, mensaje)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id_venta, id_producto, cantidad, 'rechazada', motivoTxt,
        fecha_devolucion, procesamiento, venta.id_cliente, 0, mensaje);
      numero = Number(info.lastInsertRowid);
    }
    return res.status(200).json({ numero_devolucion: numero, estado: 'rechazada', mensaje, fecha_procesamiento: procesamiento });
  }

  // 3b) ACEPTADA: registrar devolución + reembolso + regresar producto al inventario (todo o nada)
  try {
    const r = transaccion(() => {
      const info = db.prepare(`INSERT INTO devoluciones_venta
        (id_venta, id_producto, cantidad, estado, motivo, fecha_devolucion, fecha_procesamiento, id_cliente, monto_reembolso, mensaje)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id_venta, id_producto, cantidad, 'aceptada', motivoTxt,
        fecha_devolucion, procesamiento, venta.id_cliente, monto, 'Devolución aceptada. Reembolso procesado.');
      const numero = Number(info.lastInsertRowid);

      const pago = procesarReembolso({ monto, venta });
      if (!pago.ok) throw new Error('La pasarela de pago rechazó el reembolso');

      db.prepare(`INSERT INTO reembolsos (id_devolucion, monto, metodo, referencia, estado, fecha)
                  VALUES (?,?,?,?, 'procesado', ?)`).run(numero, monto, pago.metodo, pago.referencia, procesamiento);
      db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?').run(cantidad, id_producto);
      return { numero, pago };
    });

    res.status(201).json({
      numero_devolucion: r.numero,
      estado: 'aceptada',
      mensaje: 'Devolución aceptada. Reembolso procesado.',
      fecha_procesamiento: procesamiento,
      reembolso: { monto, moneda: 'MXN', metodo: r.pago.metodo, referencia: r.pago.referencia, estado: 'procesado' }
    });
  } catch (e) {
    res.status(502).json({ error: 'No se pudo procesar el reembolso; la devolución no fue registrada.', detalle: e.message });
  }
});

// Listar devoluciones (historial)
app.get('/api/devoluciones', (req, res) => {
  const filas = db.prepare(`
    SELECT d.id AS numero_devolucion, d.id_venta, p.nombre AS producto, d.cantidad,
           d.estado, d.motivo, d.mensaje, d.fecha_devolucion, d.monto_reembolso,
           r.referencia AS referencia_reembolso
    FROM devoluciones_venta d
    JOIN productos p ON p.id = d.id_producto
    LEFT JOIN reembolsos r ON r.id_devolucion = d.id
    ORDER BY d.id DESC`).all();
  res.json(filas);
});

// Consultar una devolución
app.get('/api/devoluciones/:id', (req, res) => {
  const fila = db.prepare(`
    SELECT d.*, r.referencia AS referencia_reembolso, r.estado AS estado_reembolso
    FROM devoluciones_venta d LEFT JOIN reembolsos r ON r.id_devolucion = d.id
    WHERE d.id = ?`).get(req.params.id);
  if (!fila) return res.status(404).json({ error: 'Devolución no encontrada' });
  res.json(fila);
});

app.listen(PORT, () => console.log(`Servicio de Devoluciones en http://localhost:${PORT}`));

