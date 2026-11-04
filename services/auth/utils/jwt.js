import {createHmac,timingSafeEqual} from 'node:crypto';
import {env,check} from '../../../shared/core.mjs';
export const segundosDeVigencia=()=>28800;
const signature=s=>createHmac('sha256',env.JWT_SECRET).update(s).digest('base64url');
export function firmarToken(u){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify({sub:u.id,exp:Math.floor(Date.now()/1000)+28800})).toString('base64url');return `${h}.${p}.${signature(h+'.'+p)}`;}
export function verify(t){try{const [h,p,s,...extra]=t.split('.');const expected=signature(h+'.'+p);check(!extra.length&&s?.length===expected.length&&timingSafeEqual(Buffer.from(s),Buffer.from(expected)),'Sesión inválida',401);const data=JSON.parse(Buffer.from(p,'base64url'));check(data.exp>Date.now()/1000,'Sesión expirada',401);return data.sub;}catch{check(false,'Inicia sesión de nuevo',401);}}
