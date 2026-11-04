import { Request, Response, NextFunction } from "express";
import { verificarToken } from "../utils/jwt";

/**
 * verificarAutenticacion
 * -----------------------
 * 1. Lee el header "Authorization: Bearer <token>".
 * 2. Verifica firma y expiracion del JWT.
 * 3. Si es valido, adjunta el payload (idUsuario, idRol, nombreRol) a req.usuario
 *    para que el siguiente middleware (verificarRol) o el controlador lo usen.
 *
 * Este middleware SOLO confirma "quien eres"; no decide permisos.
 * La decision de "que puedes hacer" la toma verificarRol (role.middleware.ts).
 */
export function verificarAutenticacion(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verificarToken(token);
    req.usuario = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalido o expirado" });
  }
}
