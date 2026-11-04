CREATE TABLE empaquetados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peso REAL NOT NULL CHECK (peso > 0 AND peso <= 1000000000),
  tamano TEXT NOT NULL CHECK (tamano IN ('chico', 'mediano', 'grande')),
  largo REAL NOT NULL CHECK (largo > 0 AND largo <= 1000000000),
  ancho REAL NOT NULL CHECK (ancho > 0 AND ancho <= 1000000000),
  alto REAL NOT NULL CHECK (alto > 0 AND alto <= 1000000000),
  tipo_empacado TEXT NOT NULL CHECK (tipo_empacado IN ('caja', 'bolsa')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_empaquetados_tamano ON empaquetados(tamano);
CREATE INDEX idx_empaquetados_tipo ON empaquetados(tipo_empacado);
CREATE INDEX idx_empaquetados_fecha ON empaquetados(created_at DESC, id DESC);
