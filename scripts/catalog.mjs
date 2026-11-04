import {call} from '../shared/core.mjs';
const [command,id,value]=process.argv.slice(2);
try{
 if(command==='list')console.log(JSON.stringify((await call('INVENTORY','/api/productos')).data,null,2));
 else if(command==='stock')console.log(await call('INVENTORY','/api/productos/'+Number(id),'PUT',{stock:Number(value)}));
 else throw Error('Uso: node scripts/catalog.mjs list | stock ID CANTIDAD');
}catch(e){console.error(e.message);process.exitCode=1;}
