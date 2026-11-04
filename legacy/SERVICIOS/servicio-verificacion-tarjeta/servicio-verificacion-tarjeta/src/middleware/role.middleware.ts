import { Request, Response, NextFunction } from "express";

/**
 * verificarRol
 * -------------
 * Middleware "factory": recibe la lista de roles permitidos para una ruta
 * y devuelve el middleware real de Express.
 *
 * Requiere que verificarAutenticacion se haya ejecutado antes en la cadena,
 * ya que depende de req.usuario.nombreRol.
 *
 * Uso tipico en una ruta:
 *   router.post(
 *     "/productos",
 *     verificarAutenticacion,
 *     verificarRol("ADMIN", "INVENTARIO"),
 *     crearProducto
 *   );
 *
 * Esto cubre el servicio 5 (Verificacion de roles - tipos de usuarios) y
 * se reutiliza en el resto de los servicios (compras, ventas, inventario),
 * ya que todos requieren esta verificacion antes de ejecutarse.
 */
export function verificarRol(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = req.usuario;

    if (!usuario) {
      // No deberia pasar si verificarAutenticacion corrio antes,
      // pero se valida por seguridad ante cambios futuros en el orden de middlewares.
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }

    const tieneAcceso = rolesPermitidos.includes(usuario.nombreRol);

    if (!tieneAcceso) {
      res.status(403).json({
        error: "No tienes permisos para acceder a este recurso",
        rolActual: usuario.nombreRol,
        rolesPermitidos,
      });
      return;
    }

    next();
  };
}
