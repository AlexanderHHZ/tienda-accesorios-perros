import { prisma } from "../config/prisma";

/**
 * Un USUARIO con rol CLIENTE tiene su perfil comercial en la tabla CLIENTES
 * (relación 1 a 1 por id_usuario). Devuelve null si aún no tiene perfil.
 */
export async function obtenerClienteDeUsuario(idUsuario: number) {
  return prisma.cliente.findUnique({ where: { idUsuario } });
}
