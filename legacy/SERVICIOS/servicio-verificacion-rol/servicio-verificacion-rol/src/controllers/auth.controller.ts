import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { generarToken } from "../utils/jwt";

const MAX_INTENTOS_FALLIDOS = 5;

/**
 * POST /auth/login
 * Verifica usuario + password (servicio 1) y devuelve un JWT
 * con el rol embebido, listo para usarse en verificarRol.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { correo, password } = req.body;

  if (!correo || !password) {
    res.status(400).json({ error: "Correo y password son requeridos" });
    return;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { correo },
    include: { rol: true },
  });

  if (!usuario) {
    res.status(401).json({ error: "Credenciales invalidas" });
    return;
  }

  if (usuario.estado === "bloqueado") {
    res.status(403).json({ error: "Cuenta bloqueada, contacta al administrador" });
    return;
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordValido) {
    // Cuenta de intentos fallidos: soporte basico para el servicio
    // de "verificacion de bots" / bloqueo por fuerza bruta.
    const intentos = usuario.intentosFallidos + 1;
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: intentos,
        estado: intentos >= MAX_INTENTOS_FALLIDOS ? "bloqueado" : usuario.estado,
      },
    });
    res.status(401).json({ error: "Credenciales invalidas" });
    return;
  }

  // Login correcto: reiniciar contador de intentos fallidos
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { intentosFallidos: 0 },
  });

  const token = generarToken({
    idUsuario: usuario.id,
    correo: usuario.correo,
    idRol: usuario.idRol,
    nombreRol: usuario.rol.nombreRol,
  });

  res.status(200).json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol.nombreRol,
    },
  });
}

/**
 * GET /auth/verificar-rol
 * Endpoint de diagnostico: confirma que el token es valido y
 * devuelve el rol detectado. Util para que el frontend valide
 * la sesion sin tener que decodificar el JWT del lado del cliente.
 */
export async function verificarRolEndpoint(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    autenticado: true,
    idUsuario: req.usuario?.idUsuario,
    rol: req.usuario?.nombreRol,
  });
}
