import { readConfig } from '../config/env.js';
import { openDatabase } from './database.js';

const config = readConfig();
const db = openDatabase(config.DATABASE_PATH);
db.close();
console.log('Base de datos lista. Migraciones aplicadas correctamente.');
