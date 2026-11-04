/**
 * Limitador de intentos fallidos con tarjeta (en memoria).
 *
 * Frena el "card testing": alguien que prueba números de tarjeta uno tras
 * otro hasta dar con uno válido. Cada fallo (tarjeta inválida o rechazada)
 * cuenta contra el USUARIO; al pasar el máximo se bloquea temporalmente.
 *
 * Configurable en .env:
 *   MAX_INTENTOS_TARJETA   (por defecto 10)
 *   VENTANA_INTENTOS_MIN   (por defecto 10 minutos)
 *
 * Nota: al vivir en memoria se reinicia al reiniciar el servidor. Con varias
 * instancias en producción habría que moverlo a Redis o a una tabla de BD.
 */

const fallos = new Map<number, number[]>(); // idUsuario -> marcas de tiempo

function configuracion() {
  const max = Number(process.env.MAX_INTENTOS_TARJETA) || 10;
  const ventanaMs = (Number(process.env.VENTANA_INTENTOS_MIN) || 10) * 60_000;
  return { max, ventanaMs };
}

function fallosVigentes(idUsuario: number): number[] {
  const { ventanaMs } = configuracion();
  const limite = Date.now() - ventanaMs;
  const vigentes = (fallos.get(idUsuario) || []).filter((t) => t > limite);
  fallos.set(idUsuario, vigentes);
  return vigentes;
}

export function registrarFallo(idUsuario: number): void {
  const vigentes = fallosVigentes(idUsuario);
  vigentes.push(Date.now());
  fallos.set(idUsuario, vigentes);
}

export function estadoBloqueo(idUsuario: number): { bloqueado: boolean; reintentarEnSeg: number } {
  const { max, ventanaMs } = configuracion();
  const vigentes = fallosVigentes(idUsuario);
  if (vigentes.length < max) return { bloqueado: false, reintentarEnSeg: 0 };

  // Se libera cuando el fallo más antiguo salga de la ventana
  const liberaEn = vigentes[0] + ventanaMs - Date.now();
  return { bloqueado: true, reintentarEnSeg: Math.max(1, Math.ceil(liberaEn / 1000)) };
}
