import type { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const directory = new URL('../../migrations/', import.meta.url);

export function migrate(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL
  ) STRICT`);
  // El bloqueo cubre la lectura y la escritura del historial, incluso con dos procesos arrancando.
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const name of readdirSync(directory)
      .filter((file) => /^\d+_.*\.sql$/.test(file))
      .sort()) {
      const sql = readFileSync(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const applied = db.prepare('SELECT checksum FROM schema_migrations WHERE name = ?').get(name);
      if (applied) {
        if (applied.checksum !== checksum)
          throw new Error(`La migración aplicada ${name} fue modificada.`);
        continue;
      }
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?)').run(
        name,
        checksum,
        new Date().toISOString(),
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
