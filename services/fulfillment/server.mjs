import {serve,db,internal,text,check} from '../../shared/core.mjs';
const d=db('fulfillment',`CREATE TABLE IF NOT EXISTS shipments(order_id TEXT PRIMARY KEY,address TEXT NOT NULL,status TEXT NOT NULL,tracking TEXT NOT NULL);`);
serve('fulfillment',async({req,path,method,body})=>{
 internal(req);
 if(path==='/internal/shipments'&&method==='POST'){
  const id=text(body.id,10,100);check(body.address&&typeof body.address==='object');
  d.prepare("INSERT OR IGNORE INTO shipments VALUES(?,?,'Preparando','LOCAL-'||?)").run(id,JSON.stringify(body.address),id.slice(0,8).toUpperCase());
  return d.prepare('SELECT * FROM shipments WHERE order_id=?').get(id);
 }
 const m=path.match(/^\/internal\/shipments\/([a-zA-Z0-9-]+)$/);
 if(m&&method==='GET'){const s=d.prepare('SELECT * FROM shipments WHERE order_id=?').get(m[1]);check(s,'Envío no encontrado',404);return s;}
});
