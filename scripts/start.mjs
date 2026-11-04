import {spawn} from 'node:child_process';
import net from 'node:net';
import {env,root} from '../shared/core.mjs';
if(!env.INTERNAL_SECRET||!env.JWT_SECRET){console.error('Ejecuta npm run setup primero.');process.exit(1);}
const names=['auth','inventory','payments','fulfillment','commerce','web'];
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const c of children)c.kill();setTimeout(()=>process.exit(code),200);}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
try{
 for(const name of names){const port=Number(env[name.toUpperCase()+'_PORT']);await new Promise((ok,no)=>{const s=net.createServer();s.once('error',no);s.listen(port,env.HOST||'127.0.0.1',()=>s.close(ok));});}
 for(const name of names){const isPy=name==='payments';const file=name==='web'?'web/server.mjs':`services/${name}/server.${isPy?'py':'mjs'}`;const c=spawn(isPy?(env.PYTHON||'python3'):process.execPath,[file],{cwd:root,env,stdio:'inherit'});children.push(c);c.on('error',()=>stop(1));c.on('exit',code=>{if(!stopping)stop(code||1);});
  let ready=false;for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${env[name.toUpperCase()+'_PORT']}/health`);if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw new Error(`${name} no pudo arrancar`);
 }
 console.log('Todos los servicios están listos. Ctrl+C para detener.');
}catch(e){console.error('No se pudo arrancar:',e.message);stop(1);}
