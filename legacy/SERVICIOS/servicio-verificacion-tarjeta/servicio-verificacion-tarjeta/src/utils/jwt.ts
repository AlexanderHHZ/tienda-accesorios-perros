import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "8h") as SignOptions["expiresIn"];

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no esta definido en las variables de entorno");
}

export function generarToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
