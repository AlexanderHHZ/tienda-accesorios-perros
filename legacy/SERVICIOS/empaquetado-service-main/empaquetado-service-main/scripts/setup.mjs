import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Las rutas dependen del script, no del directorio desde el que se invoque.
for (const [source, target] of [
  ['../api/.env.example', '../api/.env'],
  ['../web/.env.example', '../web/.env.local'],
]) {
  const destination = fileURLToPath(new URL(target, import.meta.url));
  if (!existsSync(destination)) {
    copyFileSync(new URL(source, import.meta.url), destination);
    console.log(`Configuración creada: ${destination}`);
  } else {
    console.log(`Configuración existente conservada: ${destination}`);
  }
}
