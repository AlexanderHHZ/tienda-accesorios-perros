import {serve,db,internal,transaction,check,text,integer} from '../../shared/core.mjs';
import adapter from './config/database.cjs';
import products from './services/producto.service.cjs';
import {writeFile,mkdir,unlink} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import nodePath from 'node:path';
import {root,env} from '../../shared/core.mjs';
const d=db('inventory',`CREATE TABLE IF NOT EXISTS proveedores(id INTEGER PRIMARY KEY,nombre TEXT);
CREATE TABLE IF NOT EXISTS productos(id INTEGER PRIMARY KEY,nombre TEXT NOT NULL,lote TEXT,serie TEXT,caducidad TEXT,id_proveedor INTEGER,costo INTEGER DEFAULT 0,precio INTEGER NOT NULL CHECK(precio>=0),stock INTEGER NOT NULL DEFAULT 0 CHECK(stock>=0),categoria TEXT DEFAULT 'Paseo',descripcion TEXT DEFAULT '',imagen TEXT DEFAULT 'collar',activo INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS reservas(id TEXT PRIMARY KEY,items TEXT NOT NULL,status TEXT NOT NULL);`);
d.exec('CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,items TEXT NOT NULL)');
adapter.attach(d);
if(!d.prepare('PRAGMA table_info(productos)').all().some(c=>c.name==='activo'))d.exec('ALTER TABLE productos ADD COLUMN activo INTEGER NOT NULL DEFAULT 1');
const imageDir=nodePath.resolve(root,env.DATA_DIR||'data','product-images');await mkdir(imageDir,{recursive:true});
if(!d.prepare('SELECT id FROM productos LIMIT 1').get()) transaction(d,()=>{for(const p of JSON.parse(readFileSync(new URL('./seed.json',import.meta.url))))d.prepare('INSERT INTO productos(id,nombre,precio,stock,categoria,descripcion,imagen) VALUES(?,?,?,?,?,?,?)').run(p.id,p.nombre,p.precio,p.stock,p.categoria,p.descripcion,p.imagen);});
serve('inventory',async({req,path,method,body})=>{
 if(method==='GET'&&path==='/api/productos')return {success:true,data:(await products.obtenerTodos()).filter(p=>p.activo===1)};
 const match=path.match(/^\/api\/productos\/(\d+)$/);
 if(method==='GET'&&match){const p=await products.obtenerPorId(+match[1]);check(p&&p.activo===1,'Producto no encontrado',404);return {success:true,data:p};}
 if(method==='PUT'&&match){internal(req);const stock=integer(body.stock,0);d.prepare('UPDATE productos SET stock=? WHERE id=?').run(stock,+match[1]);return {ok:true};}
 if(method==='POST'&&path==='/internal/products'){
  internal(req);const p=await normalize(body);const image=await saveImage(p.imageData)||p.imagen;let result;
  try{const r=d.prepare('INSERT INTO productos(nombre,precio,stock,categoria,descripcion,imagen,activo) VALUES(?,?,?,?,?,?,1)').run(p.nombre,p.precio,p.stock,p.categoria,p.descripcion,image||p.imagen);result=await products.obtenerPorId(Number(r.lastInsertRowid));}catch(e){if(p.imageData&&image.startsWith('product-'))await unlink(nodePath.join(imageDir,image)).catch(()=>{});throw e;}return {data:result};
 }
 const adminMatch=path.match(/^\/internal\/products\/(\d+)$/);
 if(adminMatch&&method==='PUT'){
  internal(req);const id=Number(adminMatch[1]);const before=await products.obtenerPorId(id);check(before&&before.activo===1,'Producto no encontrado',404);const p=await normalize(body);check(!d.prepare("SELECT items FROM reservas WHERE status='reserved'").all().some(r=>JSON.parse(r.items).some(i=>i.id===id)),'Hay una compra pendiente para este producto; espera a que termine',409);const image=await saveImage(p.imageData)||(p.imagen==='custom'?before.imagen:p.imagen);
  d.prepare('UPDATE productos SET nombre=?,precio=?,stock=?,categoria=?,descripcion=?,imagen=? WHERE id=?').run(p.nombre,p.precio,p.stock,p.categoria,p.descripcion,image,id);if(image!==before.imagen&&before.imagen.startsWith('product-'))await unlink(nodePath.join(imageDir,before.imagen)).catch(()=>{});return {data:await products.obtenerPorId(id)};
 }
 if(adminMatch&&method==='DELETE'){
  internal(req);const id=Number(adminMatch[1]);const before=await products.obtenerPorId(id);check(before&&before.activo===1,'Producto no encontrado',404);
  const refs=d.prepare('SELECT items FROM reservas').all().some(r=>JSON.parse(r.items).some(i=>i.id===id));check(!refs,'Este producto forma parte de una compra; desactívalo desde el catálogo futuro',409);
  d.prepare('UPDATE productos SET activo=0 WHERE id=?').run(id);if(before.imagen.startsWith('product-'))await unlink(nodePath.join(imageDir,before.imagen)).catch(()=>{});return {ok:true};
 }
 if(method==='POST'&&path==='/internal/receipts'){
  internal(req);const id=text(body.id,10,100);check(Array.isArray(body.items)&&body.items.length>0&&body.items.length<=50);
  return transaction(d,()=>{const items=JSON.stringify(body.items);const old=d.prepare('SELECT items FROM receipts WHERE id=?').get(id);if(old){check(old.items===items,'Recepción incompatible',409);return {ok:true};}for(const i of body.items){integer(i.id);integer(i.qty,1,999999);check(d.prepare('UPDATE productos SET stock=stock+? WHERE id=?').run(i.qty,i.id).changes===1,'Producto inexistente',404);}d.prepare('INSERT INTO receipts VALUES(?,?)').run(id,items);return {ok:true};});
 }
 if(method==='POST'&&path==='/internal/reservations'){
  internal(req);const id=text(body.id,10,100);check(Array.isArray(body.items)&&body.items.length>0&&body.items.length<=50);
  return transaction(d,()=>{
   const old=d.prepare('SELECT * FROM reservas WHERE id=?').get(id);if(old){check(old.items===JSON.stringify(body.items),'Reserva incompatible',409);return old;}
   const seen=new Set();for(const item of body.items){integer(item.id);integer(item.qty,1,99);check(!seen.has(item.id));seen.add(item.id);const r=d.prepare('UPDATE productos SET stock=stock-? WHERE id=? AND activo=1 AND stock>=?').run(item.qty,item.id,item.qty);check(r.changes===1,'Stock insuficiente',409);}
   d.prepare("INSERT INTO reservas VALUES(?,?,'reserved')").run(id,JSON.stringify(body.items));return {id,status:'reserved'};
  });
 }
 const reservation=path.match(/^\/internal\/reservations\/([a-zA-Z0-9-]+)\/(commit|release)$/);
 if(method==='POST'&&reservation){internal(req);return transaction(d,()=>{const r=d.prepare('SELECT * FROM reservas WHERE id=?').get(reservation[1]);check(r,'Reserva no encontrada',404);const next=reservation[2]==='commit'?'committed':'released';if(r.status===next)return {ok:true};check(r.status==='reserved','Reserva finalizada',409);if(next==='released')for(const i of JSON.parse(r.items))d.prepare('UPDATE productos SET stock=stock+? WHERE id=?').run(i.qty,i.id);d.prepare('UPDATE reservas SET status=? WHERE id=?').run(next,r.id);return {ok:true};});}
}, {maxBody:3000000});

async function normalize(body){
 const nombre=text(body.nombre,2,100),descripcion=text(body.descripcion,3,1000),categoria=text(body.categoria,2,30);
 check(['Paseo','Juego','Descanso','Hogar'].includes(categoria),'Categoría inválida');
 const precio=integer(body.precio,1,99999999),stock=integer(body.stock,0,999999);
 check(typeof body.imagen==='string'&&/^(collar|harness|leash|ball|bed|bowl|rope|bag|custom)$/.test(body.imagen),'Elige una imagen de catálogo');
 return {nombre,descripcion,categoria,precio,stock,imagen:body.imagen,imageData:body.imageData||null};
}
async function saveImage(data){
 if(!data)return null;check(typeof data==='string'&&data.length<=2100000,'Imagen demasiado grande',413);
 const m=data.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);check(m,'Usa una imagen PNG, JPEG o WebP');
 const bytes=Buffer.from(m[2],'base64');check(bytes.length>0&&bytes.length<=1500000,'La imagen supera 1.5 MB',413);
 const valid=m[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):m[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 check(valid,'La imagen no coincide con su formato');const ext=m[1]==='jpeg'?'jpg':m[1];const file=`product-${randomUUID()}.${ext}`;await writeFile(nodePath.join(imageDir,file),bytes,{flag:'wx'});return file;
}
