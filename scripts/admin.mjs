import {db,check} from '../shared/core.mjs';
const [action,username]=process.argv.slice(2);
if(action!=='promote'||!username){console.log('Uso: node scripts/admin.mjs promote NOMBRE_USUARIO');process.exit(2);}
const d=db('auth',`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, nombreUsuario TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, nombreCompleto TEXT, passwordHash TEXT NOT NULL, rol TEXT NOT NULL, activo INTEGER DEFAULT 1, ultimoAcceso TEXT, intentos INTEGER DEFAULT 0, bloqueadoHasta TEXT);`);
const u=d.prepare('SELECT id,nombreUsuario,rol FROM users WHERE nombreUsuario=? COLLATE NOCASE').get(username);
check(u,'No existe esa cuenta. Regístrala primero desde la tienda.');
d.prepare("UPDATE users SET rol='ADMIN' WHERE id=?").run(u.id);
console.log(`La cuenta ${u.nombreUsuario} ahora puede administrar el catálogo. Cierra sesión y vuelve a iniciarla.`);
