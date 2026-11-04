import http from 'node:http';
import {existsSync,readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
export const root=path.resolve(import.meta.dirname,'..');
if(existsSync(path.join(root,'.env'))) for(const line of readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/)){ const m=line.match(/^([A-Z_]+)=(.*)$/); if(m && !(m[1] in process.env)) process.env[m[1]]=m[2]; }
export const env=process.env;
export function fail(status,message){throw Object.assign(new Error(message),{status});}
export function check(ok,message='Datos inválidos',status=400){if(!ok)fail(status,message);}
export function db(name,schema){const dir=path.resolve(root,env.DATA_DIR||'data');mkdirSync(dir,{recursive:true});const d=new DatabaseSync(path.join(dir,name+'.sqlite'));d.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');d.exec(schema);return d;}
export function transaction(d,fn){d.exec('BEGIN IMMEDIATE');try{const r=fn();d.exec('COMMIT');return r;}catch(e){d.exec('ROLLBACK');throw e;}}
export function internal(req){check(env.INTERNAL_SECRET && req.headers['x-internal-key']===env.INTERNAL_SECRET,'Acceso interno requerido',403);}
export async function call(service,route,method='GET',body,headers={}){
 const url=env[service+'_URL'];check(url,'URL del servicio ausente',503);
 let r;try{r=await fetch(url+route,{method,headers:{'content-type':'application/json','x-internal-key':env.INTERNAL_SECRET,...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(7000)});}catch{fail(503,`Servicio ${service} no disponible; puedes reintentar`);}
 const result=await r.json();if(!r.ok)fail(r.status,result.message||result.detail||'Error de servicio');return result;
}
export async function user(req){return call('AUTH','/api/auth/me','GET',undefined,{authorization:req.headers.authorization||''});}
export function text(v,min=1,max=200){check(typeof v==='string' && v.trim().length>=min && v.length<=max);return v.trim();}
export function integer(v,min=1,max=99999999){check(Number.isSafeInteger(v)&&v>=min&&v<=max);return v;}
export function serve(name,handler,{maxBody=32768}={}){
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  try{
   const pathname=new URL(req.url,'http://local').pathname;
   if(req.method==='GET'&&pathname==='/health'){res.end(JSON.stringify({ok:true,service:name}));return;}
   let raw='';for await(const chunk of req){raw+=chunk;check(Buffer.byteLength(raw)<maxBody,'Solicitud demasiado grande',413);}
   let body={};if(raw){try{body=JSON.parse(raw);}catch{fail(400,'JSON inválido');}check(body&&typeof body==='object'&&!Array.isArray(body));}
   const result=await handler({req,res,path:pathname,method:req.method,body,query:new URL(req.url,'http://local').searchParams});
   if(result===undefined)fail(404,'Ruta no encontrada');res.end(JSON.stringify(result));
  }catch(e){res.statusCode=e.status||500;res.end(JSON.stringify({message:e.status?e.message:'Error interno'}));if(!e.status)console.error(name,e.code||e.name);}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;server.listen(Number(env[name.toUpperCase()+'_PORT']),env.HOST||'127.0.0.1',()=>console.log(`${name}: listo`));return server;
}
