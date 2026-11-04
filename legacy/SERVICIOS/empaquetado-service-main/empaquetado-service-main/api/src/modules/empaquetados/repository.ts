import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { z } from 'zod';
import { empaquetadoSchema, summarySchema } from './schemas.js';
import type { CreateInput, Empaquetado, ListQuery, PatchInput } from './schemas.js';

const rowSchema = z.object({
  id: z.number(),
  peso: z.number(),
  tamano: z.string(),
  largo: z.number(),
  ancho: z.number(),
  alto: z.number(),
  tipo_empacado: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

function mapRow(value: unknown): Empaquetado {
  const row = rowSchema.parse(value);
  return empaquetadoSchema.parse({
    id: row.id,
    peso: row.peso,
    tamano: row.tamano,
    medidas: { largo: row.largo, ancho: row.ancho, alto: row.alto },
    tipoEmpacado: row.tipo_empacado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class EmpaquetadosRepository {
  constructor(private readonly db: DatabaseSync) {}

  create(input: CreateInput): Empaquetado {
    const now = new Date().toISOString();
    const row = this.db
      .prepare(
        `INSERT INTO empaquetados
      (peso, tamano, largo, ancho, alto, tipo_empacado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        input.peso,
        input.tamano,
        input.medidas.largo,
        input.medidas.ancho,
        input.medidas.alto,
        input.tipoEmpacado,
        now,
        now,
      );
    return mapRow(row);
  }

  findById(id: number): Empaquetado | undefined {
    const row = this.db.prepare('SELECT * FROM empaquetados WHERE id = ?').get(id);
    return row ? mapRow(row) : undefined;
  }

  list(query: ListQuery) {
    const clauses: string[] = [];
    const values: SQLInputValue[] = [];
    if (query.tamano) {
      clauses.push('tamano = ?');
      values.push(query.tamano);
    }
    if (query.tipoEmpacado) {
      clauses.push('tipo_empacado = ?');
      values.push(query.tipoEmpacado);
    }
    if (query.q) {
      const search = query.q.toLowerCase();
      const id = /^(?:emp-)?0*([1-9]\d*)$/.exec(search)?.[1];
      if (id) {
        clauses.push('id = ?');
        values.push(id);
      } else {
        clauses.push("(tamano LIKE ? ESCAPE '\\' OR tipo_empacado LIKE ? ESCAPE '\\')");
        const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
        values.push(term, term);
      }
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    // Solo identificadores de una lista cerrada se interpolan; todos los datos son parámetros.
    const columns = { createdAt: 'created_at', peso: 'peso', id: 'id' } as const;
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';
    // Una transacción de lectura mantiene coherentes los registros y sus totales.
    this.db.exec('BEGIN');
    try {
      const counts = z.object({ total: z.number(), ...summarySchema.shape }).parse(
        this.db
          .prepare(
            `SELECT COUNT(*) AS total,
          COALESCE(SUM(tipo_empacado = 'caja'), 0) AS cajas,
          COALESCE(SUM(tipo_empacado = 'bolsa'), 0) AS bolsas,
          COALESCE(SUM(peso), 0) AS pesoTotal FROM empaquetados ${where}`,
          )
          .get(...values),
      );
      const rows = this.db
        .prepare(
          `SELECT * FROM empaquetados ${where}
        ORDER BY ${columns[query.sortBy]} ${direction}, id ${direction} LIMIT ? OFFSET ?`,
        )
        .all(...values, query.limit, (query.page - 1) * query.limit);
      const data = rows.map(mapRow);
      this.db.exec('COMMIT');
      return {
        data,
        meta: {
          total: counts.total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(counts.total / query.limit),
          summary: { cajas: counts.cajas, bolsas: counts.bolsas, pesoTotal: counts.pesoTotal },
        },
      };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  update(current: Empaquetado, patch: PatchInput): Empaquetado | undefined {
    // Timestamp monótono: dos cambios en el mismo milisegundo tienen versiones diferentes.
    const now = new Date(Math.max(Date.now(), Date.parse(current.updatedAt) + 1)).toISOString();
    const row = this.db
      .prepare(
        `UPDATE empaquetados SET peso = ?, tamano = ?, largo = ?, ancho = ?, alto = ?,
      tipo_empacado = ?, updated_at = ? WHERE id = ? AND updated_at = ? RETURNING *`,
      )
      .get(
        patch.peso ?? current.peso,
        patch.tamano ?? current.tamano,
        patch.medidas?.largo ?? current.medidas.largo,
        patch.medidas?.ancho ?? current.medidas.ancho,
        patch.medidas?.alto ?? current.medidas.alto,
        patch.tipoEmpacado ?? current.tipoEmpacado,
        now,
        current.id,
        current.updatedAt,
      );
    return row ? mapRow(row) : undefined;
  }

  delete(current: Empaquetado): boolean {
    return (
      this.db
        .prepare('DELETE FROM empaquetados WHERE id = ? AND updated_at = ?')
        .run(current.id, current.updatedAt).changes === 1
    );
  }
}
