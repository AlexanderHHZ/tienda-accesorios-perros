import {scrypt as raw,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(raw);
export async function generarHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+(await scrypt(password,salt,64)).toString('hex');}
export async function verificarPassword(password,stored){const [salt,hash]=stored.split(':');return timingSafeEqual(Buffer.from(hash,'hex'),await scrypt(password,salt,64));}
