import {randomUUID,createHash} from 'node:crypto';
import {serve,db,call,user,check,text,integer,transaction} from '../../shared/core.mjs';
const d=db('commerce',`CREATE TABLE IF NOT EXISTS cart(user_id INTEGER NOT NULL,product_id INTEGER NOT NULL,qty INTEGER NOT NULL,PRIMARY KEY(user_id,product_id));
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,idem TEXT NOT NULL,fingerprint TEXT NOT NULL,items TEXT NOT NULL,address TEXT NOT NULL,total INTEGER NOT NULL,shipping INTEGER NOT NULL,token TEXT NOT NULL,state TEXT NOT NULL,created TEXT NOT NULL,payment TEXT,shipment TEXT,error TEXT,UNIQUE(user_id,idem));
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY,user_id INTEGER,product_id INTEGER,rating INTEGER,comment TEXT,author TEXT,UNIQUE(user_id,product_id));
CREATE TABLE IF NOT EXISTS returns(id TEXT PRIMARY KEY,order_id TEXT UNIQUE,user_id INTEGER,reason TEXT,status TEXT);`);
d.exec(`CREATE TABLE IF NOT EXISTS suppliers(id INTEGER PRIMARY KEY,nombre TEXT,email TEXT,telefono TEXT);
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY,supplier_id INTEGER,detalle TEXT,total INTEGER,created TEXT);`);
if(!d.prepare('PRAGMA table_info(returns)').all().some(c=>c.name==='kind'))d.exec("ALTER TABLE returns ADD COLUMN kind TEXT NOT NULL DEFAULT 'Devolución'");
for(const [table,columns]of Object.entries({purchases:{items:"TEXT",state:"TEXT DEFAULT 'LEGACY'",idem:'TEXT',error:'TEXT'},returns:{error:'TEXT',refund:'TEXT',restocked:'INTEGER NOT NULL DEFAULT 0'}}))for(const [name,type]of Object.entries(columns))if(!d.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name===name))d.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
d.exec('CREATE UNIQUE INDEX IF NOT EXISTS purchase_idem ON purchases(idem)');
async function receivePurchase(id){const p=d.prepare('SELECT * FROM purchases WHERE id=?').get(id);if(p.state!=='PENDING')return p;try{await call('INVENTORY','/internal/receipts','POST',{id:'purchase-'+id,items:JSON.parse(p.items).map(i=>({id:i.id,qty:i.qty}))});d.prepare("UPDATE purchases SET state='RECEIVED',error=NULL WHERE id=?").run(id);}catch(e){d.prepare('UPDATE purchases SET error=? WHERE id=?').run(e.message,id);}return d.prepare('SELECT * FROM purchases WHERE id=?').get(id);}
async function refundReturn(id){const r=d.prepare('SELECT * FROM returns WHERE id=?').get(id);if(!['Reembolsando','Reembolsada'].includes(r.status)||r.restocked)return r;try{const payment=await call('PAYMENTS','/internal/refunds','POST',{id:r.order_id});const order=get(r.order_id);await call('INVENTORY','/internal/receipts','POST',{id:'return-'+r.id,items:JSON.parse(order.items).map(i=>({id:i.id,qty:i.qty}))});transaction(d,()=>{d.prepare("UPDATE orders SET state='REFUNDED',payment=? WHERE id=?").run(JSON.stringify(payment),r.order_id);d.prepare("UPDATE returns SET status='Reembolsada',refund=?,error=NULL,restocked=1 WHERE id=?").run(JSON.stringify(payment),id);});}catch(e){d.prepare('UPDATE returns SET error=? WHERE id=?').run(e.message,id);}return d.prepare('SELECT * FROM returns WHERE id=?').get(id);}
const get=id=>d.prepare('SELECT * FROM orders WHERE id=?').get(id);
const publicOrder=o=>({...o,items:JSON.parse(o.items),address:JSON.parse(o.address),payment:o.payment?JSON.parse(o.payment):null,shipment:o.shipment?JSON.parse(o.shipment):null,token:undefined,fingerprint:undefined,idem:undefined});
d.exec('CREATE TABLE IF NOT EXISTS stock_limits(product_id INTEGER PRIMARY KEY,minimum INTEGER NOT NULL,maximum INTEGER NOT NULL)');
const locks=new Map();
async function serial(key,fn){const previous=locks.get(key)||Promise.resolve();const current=previous.catch(()=>{}).then(fn);locks.set(key,current);try{return await current;}finally{if(locks.get(key)===current)locks.delete(key);}}
async function cart(uid){const rows=d.prepare('SELECT * FROM cart WHERE user_id=?').all(uid);const all=(await call('INVENTORY','/api/productos')).data;return rows.map(r=>{const p=all.find(p=>p.id===r.product_id);check(p,'Producto retirado del catálogo',409);return {...p,qty:r.qty};});}
const update=(id,state,extra={})=>{check(Object.keys(extra).every(k=>['payment','shipment'].includes(k)));const keys=Object.keys(extra);d.prepare('UPDATE orders SET state=?,error=NULL'+keys.map(k=>','+k+'=?').join('')+' WHERE id=?').run(state,...keys.map(k=>JSON.stringify(extra[k])),id);};
async function processOrder(id){
 let o=get(id);
 try{
  if(o.state==='CREATED'){
   try{await call('INVENTORY','/internal/reservations','POST',{id,items:JSON.parse(o.items).map(i=>({id:i.id,qty:i.qty}))});}
   catch(e){if(e.status===409){update(id,'OUT_OF_STOCK');return publicOrder(get(id));}throw e;}
   update(id,'RESERVED');o=get(id);
  }
  if(o.state==='RESERVED'){
   const payment=await call('PAYMENTS','/internal/payments','POST',{id,amount:o.total,token:o.token});
   update(id,payment.status==='APPROVED'?'PAID':'RELEASING',{payment});o=get(id);
  }
  if(o.state==='RELEASING'){await call('INVENTORY',`/internal/reservations/${id}/release`,'POST',{});update(id,'DECLINED');o=get(id);}
  if(o.state==='PAID'){
   await call('INVENTORY',`/internal/reservations/${id}/commit`,'POST',{});
   const shipment=await call('FULFILLMENT','/internal/shipments','POST',{id,address:JSON.parse(o.address)});
   transaction(d,()=>{update(id,'COMPLETED',{shipment});d.prepare('DELETE FROM cart WHERE user_id=?').run(o.user_id);});
  }
 }catch(e){d.prepare('UPDATE orders SET error=? WHERE id=?').run(e.status?e.message:'Error de coordinación',id);}
 return publicOrder(get(id));
}
const pending=uid=>d.prepare("SELECT id FROM orders WHERE user_id=? AND state IN ('CREATED','RESERVED','PAID','RELEASING')").get(uid);
serve('commerce',async({req,path,method,body,query})=>{
 if(path==='/api/reviews'&&method==='GET'){const id=integer(Number(query.get('product')));return d.prepare('SELECT rating,comment,author FROM reviews WHERE product_id=? ORDER BY id DESC').all(id);}
 const u=await user(req);
 if(path==='/api/admin/reports'&&method==='GET'){
 check(u.rol==='ADMIN','Acceso denegado',403);
 const products=(await call('INVENTORY','/api/productos')).data.map(p=>{const l=d.prepare('SELECT minimum,maximum FROM stock_limits WHERE product_id=?').get(p.id)||{minimum:5,maximum:100};return {...p,...l,alert:p.stock<=l.minimum?'Stock bajo':p.stock>=l.maximum?'Exceso de stock':'Normal'};});
 return {products,purchases:d.prepare('SELECT p.*,s.nombre AS proveedor FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id ORDER BY p.id DESC').all(),orders:d.prepare('SELECT * FROM orders ORDER BY created DESC').all().map(publicOrder)};
 }
 const limits=path.match(/^\/api\/admin\/stock-limits\/(\d+)$/);
 if(limits&&method==='PUT'){check(u.rol==='ADMIN','Acceso denegado',403);const min=integer(body.minimum,0,999998),max=integer(body.maximum,1,999999);check(max>min,'El máximo debe superar al mínimo');await call('INVENTORY','/api/productos/'+limits[1]);d.prepare('INSERT INTO stock_limits VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET minimum=excluded.minimum,maximum=excluded.maximum').run(+limits[1],min,max);return {ok:true};}
 const delivery=path.match(/^\/api\/admin\/delivery\/([a-zA-Z0-9-]+)$/);
 if(delivery&&method==='PUT'){check(u.rol==='ADMIN','Acceso denegado',403);const o=get(delivery[1]);check(o&&o.state==='COMPLETED','Pedido no elegible',409);const shipment=JSON.parse(o.shipment);const next={'Preparando':'En camino','En camino':'Entregado'};check(body.status===next[shipment.status],'Transición de envío inválida',409);shipment.status=body.status;shipment.updated=new Date().toISOString();if(body.status==='Entregado')shipment.receivedBy=text(body.receivedBy,2,120);d.prepare('UPDATE orders SET shipment=? WHERE id=?').run(JSON.stringify(shipment),o.id);return {ok:true};}
 const removeSupplier=path.match(/^\/api\/admin\/suppliers\/(\d+)$/);
 if(removeSupplier&&method==='DELETE'){check(u.rol==='ADMIN','Acceso denegado',403);check(!d.prepare('SELECT 1 FROM purchases WHERE supplier_id=?').get(+removeSupplier[1]),'El proveedor tiene compras registradas y debe conservarse',409);const result=d.prepare('DELETE FROM suppliers WHERE id=?').run(+removeSupplier[1]);check(result.changes,'Proveedor inexistente',404);return {ok:true};}

 if(path==='/api/admin/suppliers'){check(u.rol==='ADMIN','Acceso denegado',403);if(method==='GET')return d.prepare('SELECT * FROM suppliers').all();if(method==='POST'){d.prepare('INSERT INTO suppliers(nombre,email,telefono) VALUES(?,?,?)').run(text(body.nombre),text(body.email),text(body.telefono));return {ok:true};}}
 const supplier=path.match(/^\/api\/admin\/suppliers\/(\d+)$/);if(supplier&&method==='PUT'){check(u.rol==='ADMIN','Acceso denegado',403);d.prepare('UPDATE suppliers SET nombre=?,email=?,telefono=? WHERE id=?').run(text(body.nombre),text(body.email),text(body.telefono),+supplier[1]);return {ok:true};}
 if(path==='/api/admin/purchases'){check(u.rol==='ADMIN','Acceso denegado',403);if(method==='GET')return d.prepare('SELECT * FROM purchases ORDER BY id DESC').all();if(method==='POST')return serial('purchases',async()=>{
 const idem=text(req.headers['idempotency-key'],10,100);const supplier=integer(body.supplier_id);check(d.prepare('SELECT id FROM suppliers WHERE id=?').get(supplier),'Proveedor inexistente');check(Array.isArray(body.items)&&body.items.length>0&&body.items.length<=50,'Indica productos y cantidades');const seen=new Set();const items=[];for(const i of body.items){const id=integer(i.id);check(!seen.has(id),'Producto repetido');seen.add(id);items.push({id,qty:integer(i.qty,1,999999),unit_cost:integer(i.unit_cost,1,99999999)});}const total=items.reduce((n,i)=>n+i.qty*i.unit_cost,0);integer(total);const detail=text(body.detalle,3,1000);const old=d.prepare('SELECT * FROM purchases WHERE idem=?').get(idem);if(old){check(old.items===JSON.stringify(items)&&old.supplier_id===supplier&&old.detalle===detail,'Clave reutilizada con otros datos',409);return receivePurchase(old.id);}for(const i of items)await call('INVENTORY','/api/productos/'+i.id);const result=d.prepare("INSERT INTO purchases(supplier_id,detalle,total,created,items,state,idem) VALUES(?,?,?,?,?,'PENDING',?)").run(supplier,detail,total,new Date().toISOString(),JSON.stringify(items),idem);return receivePurchase(Number(result.lastInsertRowid));
 });}
 if(path==='/api/admin/returns'&&method==='GET'){check(u.rol==='ADMIN','Acceso denegado',403);return d.prepare('SELECT * FROM returns').all();}
 const ret=path.match(/^\/api\/admin\/returns\/([a-zA-Z0-9-]+)$/);if(ret&&method==='PUT'){check(u.rol==='ADMIN','Acceso denegado',403);check(['Aprobada','Rechazada'].includes(body.status));return serial('return-'+ret[1],async()=>{const r=d.prepare('SELECT * FROM returns WHERE id=?').get(ret[1]);check(r,'Solicitud inexistente',404);if(body.status==='Rechazada'){check(r.status==='Solicitada'||r.status==='Rechazada','Solicitud ya aprobada',409);d.prepare("UPDATE returns SET status='Rechazada' WHERE id=?").run(r.id);return {status:'Rechazada'};}check(['Solicitada','Aprobada','Reembolsando','Reembolsada'].includes(r.status),'Solicitud rechazada',409);if(r.status==='Reembolsada')return r;d.prepare("UPDATE returns SET status='Reembolsando' WHERE id=?").run(r.id);return refundReturn(r.id);});}

 if(path==='/api/admin/products'&&method==='GET'){check(u.rol==='ADMIN','Se requiere una cuenta administradora',403);return (await call('INVENTORY','/api/productos')).data;}
 if(path==='/api/admin/products'&&method==='POST'){check(u.rol==='ADMIN','Se requiere una cuenta administradora',403);return call('INVENTORY','/internal/products','POST',body);}
 const adminProduct=path.match(/^\/api\/admin\/products\/(\d+)$/);
 if(adminProduct&&method==='PUT'){check(u.rol==='ADMIN','Se requiere una cuenta administradora',403);return call('INVENTORY',`/internal/products/${adminProduct[1]}`,'PUT',body);}
 if(adminProduct&&method==='DELETE'){
  check(u.rol==='ADMIN','Se requiere una cuenta administradora',403);const id=Number(adminProduct[1]);
  check(!d.prepare('SELECT 1 FROM cart WHERE product_id=? LIMIT 1').get(id),'Elimina este producto de los carritos de clientes antes de retirarlo',409);
  const historical=d.prepare('SELECT items FROM orders').all().some(o=>JSON.parse(o.items).some(i=>i.id===id));check(!historical,'Un producto con pedidos históricos no se puede retirar',409);
  return call('INVENTORY',`/internal/products/${id}`,'DELETE',{});
 }
 if(path==='/api/cart'&&method==='GET'){const items=await cart(u.id);const subtotal=items.reduce((s,i)=>s+i.precio*i.qty,0);const shipping=subtotal>=99900||!items.length?0:7900;return {items,subtotal,shipping,total:subtotal+shipping,currency:'MXN'};}
 if(path==='/api/cart'&&method==='PUT')return serial(u.id,async()=>{
  check(!pending(u.id),'Hay una compra en proceso; espera su resultado',409);
  const id=integer(body.id),qty=integer(body.qty,0,99);
  if(!qty){d.prepare('DELETE FROM cart WHERE user_id=? AND product_id=?').run(u.id,id);return {ok:true};}
  const p=(await call('INVENTORY',`/api/productos/${id}`)).data;check(qty<=p.stock,'Stock insuficiente',409);
  d.prepare('INSERT INTO cart VALUES(?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET qty=excluded.qty').run(u.id,id,qty);return {ok:true};
 });
 if(path==='/api/checkout'&&method==='POST')return serial(u.id,async()=>{
  const idem=text(req.headers['idempotency-key'],10,100);check(/^[a-zA-Z0-9-]+$/.test(idem),'Idempotency-Key inválida');
  check(body.address&&typeof body.address==='object','Domicilio requerido');const a={};
  for(const field of ['nombre','calle','numero_casa','colonia','ciudad','estado','cp','telefono'])a[field]=text(body.address[field],1,120);
  check(/^\d{5}$/.test(a.cp),'Código postal: 5 dígitos');check(/^\d{1,8}$/.test(a.numero_casa),'Número de casa inválido');check(/^\d{10}$/.test(a.telefono),'Teléfono: 10 dígitos');
  check(['demo_approved','demo_declined'].includes(body.token),'Selecciona un medio de prueba');
  const fingerprint=createHash('sha256').update(JSON.stringify({a,token:body.token})).digest('hex');
  const old=d.prepare('SELECT * FROM orders WHERE user_id=? AND idem=?').get(u.id,idem);
  if(old){check(old.fingerprint===fingerprint,'La clave ya pertenece a otra solicitud',409);return processOrder(old.id);}
  check(!pending(u.id),'Ya tienes una compra en proceso',409);
  const items=await cart(u.id);check(items.length>0,'El carrito está vacío');const subtotal=items.reduce((s,i)=>s+i.precio*i.qty,0);const shipping=subtotal>=99900?0:7900;integer(subtotal+shipping,1,99999999);
  const id=randomUUID();d.prepare('INSERT INTO orders(id,user_id,idem,fingerprint,items,address,total,shipping,token,state,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,u.id,idem,fingerprint,JSON.stringify(items),JSON.stringify(a),subtotal+shipping,shipping,body.token,'CREATED',new Date().toISOString());
  return processOrder(id);
 });
 if(path==='/api/orders'&&method==='GET')return d.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC').all(u.id).map(publicOrder);
 const orderMatch=path.match(/^\/api\/orders\/([a-zA-Z0-9-]+)$/);
 if(orderMatch&&method==='GET'){const o=get(orderMatch[1]);check(o&&o.user_id===u.id,'Pedido no encontrado',404);return publicOrder(o);}
 if(path==='/api/reviews'&&method==='POST'){
  const product=integer(body.product_id),rating=integer(body.rating,1,5),comment=text(body.comment,3,1000);
  const purchased=d.prepare("SELECT items FROM orders WHERE user_id=? AND state='COMPLETED'").all(u.id).some(o=>JSON.parse(o.items).some(p=>p.id===product));check(purchased,'Solo puedes reseñar productos comprados',403);
  d.prepare('INSERT INTO reviews(user_id,product_id,rating,comment,author) VALUES(?,?,?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment').run(u.id,product,rating,comment,u.nombreUsuario);return {ok:true};
 }
 if(path==='/api/returns'&&method==='GET')return d.prepare('SELECT * FROM returns WHERE user_id=?').all(u.id);
 if(path==='/api/returns'&&method==='POST'){
  const o=get(text(body.order_id));check(o&&o.user_id===u.id&&o.state==='COMPLETED','Pedido no elegible',400);
  const reason=text(body.reason,10,1000);const kind=body.kind||'Devolución';check(['Devolución','Garantía'].includes(kind));d.prepare("INSERT OR IGNORE INTO returns(id,order_id,user_id,reason,status,kind) VALUES(?,?,?,?,'Solicitada',?)").run(randomUUID(),o.id,u.id,reason,kind);return d.prepare('SELECT * FROM returns WHERE order_id=?').get(o.id);
 }
}, {maxBody:3000000});
// Recuperación durable: cada paso remoto es idempotente. Se ejecuta también tras reinicios.
setInterval(()=>{for(const o of d.prepare("SELECT id,user_id FROM orders WHERE state IN ('CREATED','RESERVED','PAID','RELEASING')").all())serial(o.user_id,()=>processOrder(o.id)).catch(()=>{});},4000).unref();

setInterval(()=>{for(const p of d.prepare("SELECT id FROM purchases WHERE state='PENDING'").all())serial('purchases',()=>receivePurchase(p.id)).catch(()=>{});for(const r of d.prepare("SELECT id FROM returns WHERE status IN ('Reembolsando','Reembolsada') AND restocked=0").all())serial('return-'+r.id,()=>refundReturn(r.id)).catch(()=>{});},4000).unref();
