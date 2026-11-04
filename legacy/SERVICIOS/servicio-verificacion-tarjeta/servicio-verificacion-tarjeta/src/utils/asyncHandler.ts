import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Express 4 no captura los errores de funciones async por sí solo.
 * Este envoltorio los manda al manejador de errores global (app.ts)
 * en lugar de dejar la petición colgada.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
