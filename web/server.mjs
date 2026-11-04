import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {env,root} from '../shared/core.mjs';
const web=path.join(root,'web');
const types={'.woff2':'font/woff2','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/uploads/')){const filename=path.basename(url.pathname.slice('/uploads/'.length));if(!/^product-[0-9a-f-]{36}\.(png|jpg|webp)$/.test(filename)){res.writeHead(404);res.end();return;}const file=path.resolve(root,env.DATA_DIR||'data','product-images',filename);const data=await readFile(file);res.setHeader('Content-Type',filename.endsWith('.png')?'image/png':filename.endsWith('.jpg')?'image/jpeg':'image/webp');res.setHeader('Cache-Control','public, max-age=86400, immutable');res.end(data);return;}
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end('{"ok":true}');return;}
  if(url.pathname.startsWith('/api/')){
   if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`){res.writeHead(403);res.end('{"message":"Origen no permitido"}');return;}
   const segment=url.pathname.split('/')[2];const service=segment==='auth'?'AUTH':segment==='productos'?'INVENTORY':'COMMERCE';
   // El gateway solo permite API pública; nunca propaga la clave interna del cliente.
   if(!['auth','productos','cart','checkout','orders','reviews','returns','admin'].includes(segment)){res.writeHead(404);res.end('{}');return;}
   let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>3000000){res.writeHead(413);res.end('{}');return;}}
   const response=await fetch(env[service+'_URL']+url.pathname+url.search,{method:req.method,headers:{'content-type':'application/json',authorization:req.headers.authorization||'','idempotency-key':req.headers['idempotency-key']||''},body:['GET','HEAD'].includes(req.method)?undefined:body,signal:AbortSignal.timeout(30000)});
   res.writeHead(response.status,{'Content-Type':'application/json; charset=utf-8'});res.end(await response.text());return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const p=path.resolve(web,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!p.startsWith(web+path.sep)||p.endsWith('server.mjs')){res.writeHead(404);res.end();return;}
  const data=await readFile(p);res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:data);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:502,{'Content-Type':'application/json'});res.end(JSON.stringify({message:e.code==='ENOENT'?'Archivo no encontrado':'Servicio no disponible. Reintenta en unos segundos.'}));}
}).listen(Number(env.WEB_PORT),env.WEB_HOST||env.HOST||'127.0.0.1',()=>console.log(`Tienda: http://localhost:${env.WEB_PORT}`));
