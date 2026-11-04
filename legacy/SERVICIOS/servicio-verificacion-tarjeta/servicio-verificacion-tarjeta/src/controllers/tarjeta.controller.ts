import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { verificarDatosTarjeta, mascararNumero, validarExpiracion } from "../utils/tarjeta";
import { autorizarTarjeta, tokenizarTarjeta } from "../services/pasarelaSimulada";
import { registrarFallo } from "../utils/limiteIntentos";
import { obtenerClienteDeUsuario } from "../utils/cliente";

/** Lo único que se le muestra al cliente de una tarjeta guardada (jamás el token). */
function presentarTarjeta(t: {
  id: number;
  marca: string;
  ultimosDigitos: string;
  mesExpiracion: number;
  anioExpiracion: number;
  verificada: boolean;
}) {
  return {
    id: t.id,
    marca: t.marca,
    ultimosDigitos: t.ultimosDigitos,
    mascara: mascararNumero(t.marca, t.ultimosDigitos),
    mesExpiracion: t.mesExpiracion,
    anioExpiracion: t.anioExpiracion,
    verificada: t.verificada,
    vencida: !validarExpiracion(t.mesExpiracion, t.anioExpiracion).valida,
  };
}

/**
 * POST /tarjetas/verificar
 * Solo VALIDA los datos (Luhn, marca, longitud, vencimiento, CVV).
 * No guarda nada ni consulta a la pasarela. Sirve para dar feedback
 * inmediato en el formulario de pago.
 */
export async function verificarTarjeta(req: Request, res: Response): Promise<void> {
  const resultado = verificarDatosTarjeta(req.body || {});
  if (!resultado.valida) registrarFallo(req.usuario!.idUsuario);
  res.status(200).json(resultado);
}

/**
 * POST /tarjetas
 * Valida, pide verificación a la pasarela y, si todo sale bien, guarda la
 * tarjeta del cliente (solo token + últimos 4 + marca + vencimiento).
 */
export async function registrarTarjeta(req: Request, res: Response): Promise<void> {
  const idUsuario = req.usuario!.idUsuario;

  const cliente = await obtenerClienteDeUsuario(idUsuario);
  if (!cliente) {
    res.status(403).json({ error: "El usuario no tiene perfil de cliente" });
    return;
  }

  const v = verificarDatosTarjeta(req.body || {});
  if (!v.valida) {
    registrarFallo(idUsuario);
    res.status(422).json({ error: "Tarjeta inválida", ...v });
    return;
  }

  const duplicada = await prisma.tarjeta.findFirst({
    where: {
      idCliente: cliente.id,
      ultimosDigitos: v.ultimosDigitos!,
      marca: v.marca,
      mesExpiracion: v.mes!,
      anioExpiracion: v.anio!,
    },
  });
  if (duplicada) {
    res.status(409).json({ error: "Esta tarjeta ya está registrada", idTarjeta: duplicada.id });
    return;
  }

  const respuesta = autorizarTarjeta({
    marca: v.marca,
    ultimosDigitos: v.ultimosDigitos!,
    contexto: "verificacion",
  });
  if (!respuesta.aprobada) {
    registrarFallo(idUsuario);
    res.status(402).json({
      error: "Tarjeta rechazada",
      codigo: respuesta.codigo,
      mensaje: respuesta.mensaje,
    });
    return;
  }

  const tarjeta = await prisma.tarjeta.create({
    data: {
      idCliente: cliente.id,
      tokenPago: tokenizarTarjeta(),
      ultimosDigitos: v.ultimosDigitos!,
      marca: v.marca,
      mesExpiracion: v.mes!,
      anioExpiracion: v.anio!,
      verificada: true,
    },
  });

  res.status(201).json({
    mensaje: "Tarjeta verificada y registrada",
    codigoAutorizacion: respuesta.codigoAutorizacion,
    tarjeta: presentarTarjeta(tarjeta),
  });
}

/** GET /tarjetas  -> tarjetas guardadas del cliente autenticado. */
export async function listarTarjetas(req: Request, res: Response): Promise<void> {
  const cliente = await obtenerClienteDeUsuario(req.usuario!.idUsuario);
  if (!cliente) {
    res.status(403).json({ error: "El usuario no tiene perfil de cliente" });
    return;
  }

  const tarjetas = await prisma.tarjeta.findMany({
    where: { idCliente: cliente.id },
    orderBy: { id: "desc" },
  });
  res.status(200).json({ tarjetas: tarjetas.map(presentarTarjeta) });
}

/** DELETE /tarjetas/:id  -> solo puede borrar tarjetas propias. */
export async function eliminarTarjeta(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Id de tarjeta inválido" });
    return;
  }

  const cliente = await obtenerClienteDeUsuario(req.usuario!.idUsuario);
  if (!cliente) {
    res.status(403).json({ error: "El usuario no tiene perfil de cliente" });
    return;
  }

  // Se busca por id Y dueño: si es de otro cliente se responde igual que si no existiera
  const tarjeta = await prisma.tarjeta.findFirst({ where: { id, idCliente: cliente.id } });
  if (!tarjeta) {
    res.status(404).json({ error: "Tarjeta no encontrada" });
    return;
  }

  try {
    await prisma.tarjeta.delete({ where: { id } });
    res.status(200).json({ mensaje: "Tarjeta eliminada" });
  } catch (e) {
    // P2003 = violación de llave foránea: la tarjeta ya está ligada a un pedido (PEDIDOS.id_tarjeta)
    if ((e as { code?: string }).code === "P2003") {
      res.status(409).json({ error: "No se puede eliminar: la tarjeta está ligada a un pedido" });
      return;
    }
    throw e;
  }
}
