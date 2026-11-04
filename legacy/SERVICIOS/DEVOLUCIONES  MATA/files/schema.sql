CREATE TABLE IF NOT EXISTS clientes (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,
  email   TEXT NOT NULL UNIQUE
);
 
CREATE TABLE IF NOT EXISTS productos (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,
  precio  REAL NOT NULL,
  stock   INTEGER NOT NULL DEFAULT 0
);
 
CREATE TABLE IF NOT EXISTS ventas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente       INTEGER NOT NULL,
  fecha            TEXT NOT NULL,                       -- YYYY-MM-DD
  estado_pago      TEXT NOT NULL DEFAULT 'pagada' CHECK (estado_pago IN ('pagada','pendiente')),
  metodo_pago      TEXT NOT NULL DEFAULT 'tarjeta',
  referencia_pago  TEXT,                                -- folio/ID de la transacción original
  FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);
 
CREATE TABLE IF NOT EXISTS detalle_venta (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  id_venta         INTEGER NOT NULL,
  id_producto      INTEGER NOT NULL,
  cantidad         INTEGER NOT NULL,
  precio_unitario  REAL NOT NULL,
  FOREIGN KEY (id_venta) REFERENCES ventas(id),
  FOREIGN KEY (id_producto) REFERENCES productos(id)
);
 
-- Tabla del diagrama: DEVOLUCIONES_VENTA
CREATE TABLE IF NOT EXISTS devoluciones_venta (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  id_venta             INTEGER NOT NULL,
  id_producto          INTEGER NOT NULL,
  cantidad             INTEGER NOT NULL,
  estado               TEXT NOT NULL CHECK (estado IN ('aceptada','rechazada')),
  motivo               TEXT NOT NULL,
  fecha_devolucion     TEXT NOT NULL,
  fecha_procesamiento  TEXT NOT NULL,
  id_cliente           INTEGER,
  monto_reembolso      REAL DEFAULT 0,
  mensaje              TEXT,
  FOREIGN KEY (id_venta) REFERENCES ventas(id),
  FOREIGN KEY (id_producto) REFERENCES productos(id)
);
 
-- Registro de cada reembolso emitido (uno por devolución aceptada)
CREATE TABLE IF NOT EXISTS reembolsos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  id_devolucion  INTEGER NOT NULL UNIQUE,
  monto          REAL NOT NULL,
  metodo         TEXT NOT NULL,
  referencia     TEXT NOT NULL,
  estado         TEXT NOT NULL CHECK (estado IN ('procesado','fallido')),
  fecha          TEXT NOT NULL,
  FOREIGN KEY (id_devolucion) REFERENCES devoluciones_venta(id)
);
 
-- Tabla del diagrama: DEVOLUCIONES_COMPRA (devoluciones a proveedor)
CREATE TABLE IF NOT EXISTS devoluciones_compra (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  id_compra    INTEGER NOT NULL,
  id_producto  INTEGER NOT NULL,
  cantidad     INTEGER NOT NULL,
  FOREIGN KEY (id_producto) REFERENCES productos(id)
);
