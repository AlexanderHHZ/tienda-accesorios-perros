import {
  promises as fs
} from "node:fs";

import path from "node:path";

import {
  randomBytes,
  createHash
} from "node:crypto";

import bcrypt from "bcryptjs";

import {
  sendPasswordResetEmail
} from "./email.service.js";


/*
 * =========================================================
 * RUTA DE LA BASE DE DATOS
 * =========================================================
 */

const DB_PATH = path.resolve(
  "data/db.json"
);


/*
 * =========================================================
 * INTERFACES
 * =========================================================
 */

interface Usuario {

  id: number;

  nombre: string;

  correo: string;

  telefono: string;

  password_hash: string;

  id_rol: number;

  estado: string;

}


interface TokenRecuperacion {

  id: number;

  id_usuario: number;

  token: string;

  fecha_expiracion: string;

  usado: boolean;

}


interface Database {

  roles: unknown[];

  usuarios: Usuario[];

  tokens_recuperacion:
    TokenRecuperacion[];

}


/*
 * =========================================================
 * LEER BASE DE DATOS
 * =========================================================
 */

async function readDatabase():
  Promise<Database> {

  const content =
    await fs.readFile(
      DB_PATH,
      "utf-8"
    );

  return JSON.parse(
    content
  );

}


/*
 * =========================================================
 * ESCRIBIR BASE DE DATOS
 * =========================================================
 */

async function writeDatabase(
  database: Database
): Promise<void> {

  await fs.writeFile(

    DB_PATH,

    JSON.stringify(
      database,
      null,
      2
    ),

    "utf-8"

  );

}


/*
 * =========================================================
 * GENERAR HASH DEL TOKEN
 * =========================================================
 *
 * El token real nunca se guarda directamente
 * en la base de datos.
 *
 * Solamente guardamos su SHA-256.
 *
 * =========================================================
 */

function hashToken(
  token: string
): string {

  return createHash("sha256")
    .update(token)
    .digest("hex");

}


/*
 * =========================================================
 * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * =========================================================
 *
 * Busca al usuario por correo.
 *
 * Si existe:
 *
 * 1. Invalida tokens anteriores.
 * 2. Genera un token seguro.
 * 3. Genera su hash.
 * 4. Guarda el hash en la BD.
 * 5. Define una expiración de 1 hora.
 * 6. Envía el token real por correo.
 *
 * Si no existe:
 *
 * No devuelve ningún error.
 *
 * Esto evita revelar si un correo está registrado.
 *
 * =========================================================
 */

export async function
requestPasswordRecovery(
  email: string
): Promise<void> {

  const database =
    await readDatabase();


  /*
   * Normalizar correo.
   *
   * Ejemplo:
   *
   * JUAN@EXAMPLE.COM
   *
   * se convierte en:
   *
   * juan@example.com
   */

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();


  /*
   * Buscar usuario.
   */

  const usuario =
    database.usuarios.find(
      user =>
        user.correo
          .trim()
          .toLowerCase() ===
        normalizedEmail
    );


  /*
   * IMPORTANTE:
   *
   * No revelamos si el correo
   * existe o no.
   */

  if (!usuario) {

    return;

  }


  /*
   * =======================================================
   * INVALIDAR TOKENS ANTERIORES
   * =======================================================
   *
   * Si el usuario solicita otra recuperación,
   * cualquier token anterior que todavía esté activo
   * deja de ser válido.
   */

  database.tokens_recuperacion =
    database.tokens_recuperacion.map(
      token => {

        if (
          token.id_usuario ===
            usuario.id &&
          !token.usado
        ) {

          return {

            ...token,

            usado: true,

          };

        }

        return token;

      }
    );


  /*
   * =======================================================
   * GENERAR TOKEN
   * =======================================================
   *
   * 32 bytes = 256 bits.
   *
   * randomBytes utiliza un generador
   * criptográficamente seguro.
   */

  const rawToken =
    randomBytes(32)
      .toString("hex");


  /*
   * =======================================================
   * GENERAR HASH DEL TOKEN
   * =======================================================
   *
   * El token real se enviará por correo.
   *
   * La BD únicamente almacena el hash.
   */

  const hashedToken =
    hashToken(
      rawToken
    );


  /*
   * =======================================================
   * FECHA DE EXPIRACIÓN
   * =======================================================
   *
   * El token tendrá una duración
   * de 1 hora.
   */

  const expiration =
    new Date(
      Date.now() +
      60 * 60 * 1000
    );


  /*
   * =======================================================
   * GENERAR ID DEL TOKEN
   * =======================================================
   */

  const nextId =
    database.tokens_recuperacion.length
      ? Math.max(
          ...database.tokens_recuperacion
            .map(
              token =>
                token.id
            )
        ) + 1
      : 1;


  /*
   * =======================================================
   * CREAR REGISTRO DEL TOKEN
   * =======================================================
   */

  const recoveryToken:
    TokenRecuperacion = {

    id:
      nextId,

    id_usuario:
      usuario.id,

    token:
      hashedToken,

    fecha_expiracion:
      expiration.toISOString(),

    usado:
      false,

  };


  /*
   * =======================================================
   * GUARDAR TOKEN
   * =======================================================
   */

  database.tokens_recuperacion.push(
    recoveryToken
  );


  await writeDatabase(
    database
  );


  /*
   * =======================================================
   * ENVIAR CORREO
   * =======================================================
   *
   * Se envía el token REAL.
   *
   * La base de datos solamente
   * contiene el hash.
   */

  await sendPasswordResetEmail(

    usuario.correo,

    usuario.nombre,

    rawToken

  );

}


/*
 * =========================================================
 * VALIDAR TOKEN DE RECUPERACIÓN
 * =========================================================
 *
 * Comprueba:
 *
 * 1. Que el token exista.
 * 2. Que no haya sido utilizado.
 * 3. Que no haya expirado.
 *
 * Devuelve:
 *
 * true  -> token válido.
 * false -> token inválido.
 *
 * =========================================================
 */

export async function
validatePasswordResetToken(
  token: string
): Promise<boolean> {

  const database =
    await readDatabase();


  /*
   * Generar hash del token recibido.
   *
   * El usuario envía el token REAL.
   *
   * Nosotros generamos nuevamente
   * su SHA-256 para compararlo
   * con el almacenado.
   */

  const hashedToken =
    hashToken(
      token
    );


  /*
   * Buscar token.
   */

  const recoveryToken =
    database.tokens_recuperacion.find(
      item =>
        item.token ===
        hashedToken
    );


  /*
   * El token no existe.
   */

  if (!recoveryToken) {

    return false;

  }


  /*
   * El token ya fue utilizado.
   */

  if (
    recoveryToken.usado
  ) {

    return false;

  }


  /*
   * Comprobar fecha de expiración.
   */

  const expiration =
    new Date(
      recoveryToken.fecha_expiracion
    );


  /*
   * El token ya expiró.
   */

  if (
    expiration.getTime() <=
    Date.now()
  ) {

    return false;

  }


  /*
   * Token válido.
   */

  return true;

}


/*
 * =========================================================
 * RESTABLECER CONTRASEÑA
 * =========================================================
 *
 * Recibe:
 *
 * token
 * nueva contraseña
 *
 * Comprueba el token y posteriormente:
 *
 * 1. Busca al usuario.
 * 2. Genera hash de la nueva contraseña.
 * 3. Actualiza password_hash.
 * 4. Marca el token como usado.
 * 5. Guarda los cambios.
 *
 * =========================================================
 */

export async function
resetPassword(
  token: string,
  newPassword: string
): Promise<void> {

  const database =
    await readDatabase();


  /*
   * Generar hash del token recibido.
   */

  const hashedToken =
    hashToken(
      token
    );


  /*
   * Buscar token.
   */

  const recoveryToken =
    database.tokens_recuperacion.find(
      item =>
        item.token ===
        hashedToken
    );


  /*
   * =======================================================
   * TOKEN NO ENCONTRADO
   * =======================================================
   */

  if (!recoveryToken) {

    throw new Error(
      "TOKEN_INVALID"
    );

  }


  /*
   * =======================================================
   * TOKEN YA UTILIZADO
   * =======================================================
   */

  if (
    recoveryToken.usado
  ) {

    throw new Error(
      "TOKEN_USED"
    );

  }


  /*
   * =======================================================
   * TOKEN EXPIRADO
   * =======================================================
   */

  const expiration =
    new Date(
      recoveryToken.fecha_expiracion
    );


  if (
    expiration.getTime() <=
    Date.now()
  ) {

    throw new Error(
      "TOKEN_EXPIRED"
    );

  }


  /*
   * =======================================================
   * BUSCAR USUARIO
   * =======================================================
   */

  const usuario =
    database.usuarios.find(
      user =>
        user.id ===
        recoveryToken.id_usuario
    );


  /*
   * Usuario inexistente.
   */

  if (!usuario) {

    throw new Error(
      "USER_NOT_FOUND"
    );

  }


  /*
   * =======================================================
   * GENERAR HASH DE LA NUEVA CONTRASEÑA
   * =======================================================
   *
   * bcrypt se utiliza para almacenar
   * contraseñas de forma segura.
   *
   * 12 salt rounds.
   */

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    );


  /*
   * =======================================================
   * ACTUALIZAR CONTRASEÑA
   * =======================================================
   */

  usuario.password_hash =
    passwordHash;


  /*
   * =======================================================
   * INVALIDAR TOKEN
   * =======================================================
   *
   * Un token solamente puede utilizarse
   * una vez.
   */

  recoveryToken.usado =
    true;


  /*
   * =======================================================
   * GUARDAR CAMBIOS
   * =======================================================
   */

  await writeDatabase(
    database
  );

}