import { Request, Response, NextFunction } from "express";
import { estadoBloqueo } from "../utils/limiteIntentos";

/**
 * limitarIntentosTarjeta
 * -----------------------
 * Se coloca DESPUÉS de verificarAutenticacion en las rutas que validan
 * tarjetas. Si el usuario acumuló demasiados fallos recientes, responde 429
 * sin procesar la solicitud.
 */
export function limitarIntentosTarjeta(req: Request, res: Response, next: NextFunction): void {
  if (!req.usuario) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  const { bloqueado, reintentarEnSeg } = estadoBloqueo(req.usuario.idUsuario);
  if (bloqueado) {
    res.setHeader("Retry-After", String(reintentarEnSeg));
    res.status(429).json({
      error: "Demasiados intentos fallidos con tarjeta. Intenta de nuevo más tarde.",
      reintentarEnSegundos: reintentarEnSeg,
    });
    return;
  }

  next();
}
