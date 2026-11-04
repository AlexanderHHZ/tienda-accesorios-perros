// Estructura de datos que viaja dentro del JWT.
// Se guarda el rol como texto (nombreRol) para poder verificarlo
// en cada request sin volver a consultar la tabla ROLES.
export interface JwtPayload {
  idUsuario: number;
  correo: string;
  idRol: number;
  nombreRol: string;
}

// Extiende el Request de Express para adjuntar el usuario decodificado del token.
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}
