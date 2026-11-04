import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('.env')) writeFileSync('.env',readFileSync('.env.example','utf8').replaceAll('GENERATED_BY_SETUP',()=>randomBytes(32).toString('hex')),{mode:0o600});
mkdirSync('data',{recursive:true});
console.log('Configuración lista. Ejecuta npm start. No se sobrescribieron datos ni .env.');
