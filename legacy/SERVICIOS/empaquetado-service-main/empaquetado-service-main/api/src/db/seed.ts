import { readConfig } from '../config/env.js';
import { openDatabase } from './database.js';
import { EmpaquetadosRepository } from '../modules/empaquetados/repository.js';

const db = openDatabase(readConfig().DATABASE_PATH);
try {
  db.exec('BEGIN IMMEDIATE');
  const count = db.prepare('SELECT COUNT(*) AS count FROM empaquetados').get();
  if (count?.count !== 0) {
    console.log('La base ya contiene registros. No se añadieron ejemplos.');
  } else {
    const repo = new EmpaquetadosRepository(db);
    // Datos de demostración optativos. Nunca se ejecutan durante el inicio normal.
    repo.create({
      peso: 4.5,
      tamano: 'mediano',
      medidas: { largo: 40, ancho: 30, alto: 20 },
      tipoEmpacado: 'caja',
    });
    repo.create({
      peso: 0.8,
      tamano: 'chico',
      medidas: { largo: 25, ancho: 18, alto: 5 },
      tipoEmpacado: 'bolsa',
    });
    repo.create({
      peso: 12,
      tamano: 'grande',
      medidas: { largo: 60, ancho: 45, alto: 40 },
      tipoEmpacado: 'caja',
    });
    repo.create({
      peso: 2.35,
      tamano: 'mediano',
      medidas: { largo: 35, ancho: 28, alto: 8 },
      tipoEmpacado: 'bolsa',
    });
    repo.create({
      peso: 1.2,
      tamano: 'chico',
      medidas: { largo: 20, ancho: 15, alto: 12 },
      tipoEmpacado: 'caja',
    });
    repo.create({
      peso: 7.8,
      tamano: 'grande',
      medidas: { largo: 55, ancho: 40, alto: 32 },
      tipoEmpacado: 'caja',
    });
    console.log('Se guardaron 6 ejemplos reales en SQLite.');
  }
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
} finally {
  db.close();
}
