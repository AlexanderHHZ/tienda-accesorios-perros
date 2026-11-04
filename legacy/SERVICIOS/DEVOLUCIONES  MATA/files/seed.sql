INSERT INTO clientes (nombre, email) VALUES
  ('Ana López',                 'ana@correo.com'),                 -- 1
  ('Carlos Ruiz',               'carlos@correo.com'),              -- 2
  ('Jesus Ramon Mata',          '04ramon54@gmail.com'),            -- 3
  ('María Fernanda Torres',     'maria.torres@correo.com'),        -- 4
  ('Luis Alberto Hernández',    'luis.hernandez@correo.com'),      -- 5
  ('Sofía Ramírez Castillo',    'sofia.ramirez@correo.com'),       -- 6
  ('Diego Armando Morales',     'diego.morales@correo.com'),       -- 7
  ('Valeria Guzmán Ibarra',     'valeria.guzman@correo.com'),      -- 8
  ('Javier Ortega Solís',       'javier.ortega@correo.com'),       -- 9
  ('Daniela Vega Rentería',     'daniela.vega@correo.com'),        -- 10
  ('Roberto Chávez Núñez',      'roberto.chavez@correo.com'),      -- 11
  ('Paola Mendoza Ochoa',       'paola.mendoza@correo.com');       -- 12
 
INSERT INTO productos (nombre, precio, stock) VALUES
  ('Audífonos Bluetooth JBL Tune 510BT',        450.00, 20),   -- 1
  ('Mouse inalámbrico Logitech M170',           250.00, 30),   -- 2
  ('Teclado mecánico Redragon Kumara K552',     900.00, 10),   -- 3
  ('Memoria USB Kingston DataTraveler 64 GB',   180.00, 50),   -- 4
  ('Disco duro externo Seagate 1 TB',          1150.00, 15),   -- 5
  ('Monitor LG 24" Full HD 24MK430H',          2899.00,  8),   -- 6
  ('Cámara web Logitech C270 HD',               699.00, 18),   -- 7
  ('Bocina Bluetooth Sony SRS-XB13',           1499.00, 12),   -- 8
  ('Cargador rápido Anker 20W USB-C',           349.00, 40),   -- 9
  ('Cable HDMI UGREEN 2 m',                     199.00, 60),   -- 10
  ('Silla gamer Cougar Explore',               3899.00,  5),   -- 11
  ('Smartwatch Xiaomi Redmi Watch 3 Active',   1299.00, 14),   -- 12
  ('Tablet Samsung Galaxy Tab A9',             4199.00,  6),   -- 13
  ('Router TP-Link Archer C6 AC1200',           899.00, 16),   -- 14
  ('Mochila para laptop Targus 15.6"',          799.00, 22);   -- 15
 
INSERT INTO ventas (id_cliente, fecha, estado_pago, metodo_pago, referencia_pago) VALUES
  (1,  date('now', '-5 days'),  'pagada',    'tarjeta',       'PAY-1001'),  -- 1  Ana, reciente
  (2,  date('now', '-60 days'), 'pagada',    'tarjeta',       'PAY-1002'),  -- 2  Carlos, fuera de plazo
  (3,  date('now', '-3 days'),  'pagada',    'tarjeta',       'PAY-1003'),  -- 3  Jesus, reciente
  (1,  date('now', '-2 days'),  'pendiente', 'transferencia', NULL),        -- 4  Ana, sin pagar
  (4,  date('now', '-10 days'), 'pagada',    'tarjeta',       'PAY-1005'),  -- 5  María, reciente
  (5,  date('now', '-25 days'), 'pagada',    'efectivo',      'PAY-1006'),  -- 6  Luis, cerca del límite
  (6,  date('now', '-1 days'),  'pagada',    'tarjeta',       'PAY-1007'),  -- 7  Sofía, muy reciente
  (7,  date('now', '-45 days'), 'pagada',    'tarjeta',       'PAY-1008'),  -- 8  Diego, fuera de plazo
  (8,  date('now', '-15 days'), 'pagada',    'transferencia', 'PAY-1009'),  -- 9  Valeria, reciente
  (9,  date('now', '-7 days'),  'pagada',    'tarjeta',       'PAY-1010'),  -- 10 Javier, reciente
  (10, date('now', '-4 days'),  'pendiente', 'transferencia', NULL),        -- 11 Daniela, sin pagar
  (11, date('now', '-29 days'), 'pagada',    'tarjeta',       'PAY-1012'),  -- 12 Roberto, último día del plazo
  (12, date('now', '-31 days'), 'pagada',    'tarjeta',       'PAY-1013'),  -- 13 Paola, un día fuera de plazo
  (3,  date('now', '-12 days'), 'pagada',    'tarjeta',       'PAY-1014');  -- 14 Jesus, segunda compra
 
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
  (1,  1, 2,  450.00),
  (1,  2, 1,  250.00),
  (2,  3, 1,  900.00),
  (3,  1, 1,  450.00),
  (4,  2, 1,  250.00),
  (5,  6, 1, 2899.00),
  (5, 10, 2,  199.00),
  (6,  5, 1, 1150.00),
  (6,  4, 2,  180.00),
  (7,  8, 1, 1499.00),
  (7,  9, 1,  349.00),
  (8, 11, 1, 3899.00),
  (9, 12, 1, 1299.00),
  (9,  7, 1,  699.00),
  (10,13, 1, 4199.00),
  (11,14, 1,  899.00),
  (12,15, 2,  799.00),
  (13, 9, 3,  349.00),
  (14, 7, 1,  699.00),
  (14,10, 1,  199.00);
