import {serve,text,check,env} from '../../shared/core.mjs';
import {autenticar,registrar} from './services/autenticacion.service.js';
import {store} from './repositories/usuarios.repository.js';
import {verify} from './utils/jwt.js';
check(env.JWT_SECRET?.length>=32,'Ejecuta npm run setup');
const attempts=new Map();
serve('auth',async({req,path,method,body})=>{
 if(method==='GET'&&path==='/api/auth/me'){const id=verify((req.headers.authorization||'').replace(/^Bearer /,''));const u=store.prepare('SELECT id,nombreUsuario,email,nombreCompleto,rol FROM users WHERE id=? AND activo=1').get(id);check(u,'Usuario no disponible',401);return {...u,role:u.rol==='ADMIN'?'admin':'customer'};}
 if(method==='POST'&&['/api/auth/login','/api/auth/register'].includes(path)){
  const ip=req.socket.remoteAddress;const now=Date.now();const a=attempts.get(ip)||{start:now,n:0};if(now-a.start>60000){a.start=now;a.n=0;}check(++a.n<=40,'Demasiados intentos; espera un minuto',429);attempts.set(ip,a);
  const nombreUsuario=text(body.nombreUsuario,3,40).toLowerCase();check(/^[a-z0-9_.-]+$/.test(nombreUsuario),'Usuario: letras, números, punto o guion');const contrasena=text(body.contrasena,10,128);
  if(path.endsWith('/login'))return autenticar({nombreUsuario,contrasena});
  const email=text(body.email,5,150).toLowerCase();check(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),'Email inválido');return registrar({nombreUsuario,contrasena,email,nombreCompleto:text(body.nombreCompleto,2,100)});
 }
});
