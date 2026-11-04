import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { validarCvv, validarExpiracion, mascararNumero, MarcaTarjeta } from "../utils/tarjeta";
import { autorizarTarjeta } from "../services/pasarelaSimulada";
import { registrarFallo } from "../utils/limiteIntentos";
import { obtenerClienteDeUsuario } from "../utils/cliente";
import { calcularMonto } from "../utils/pedido";

/**
 * GET /pagos/pedidos-pendientes
 * Pedidos del cliente que esperan pago con tarjeta (con su monto calculado).
 */
export async function pedidosPendientes(req: Request, res: Response): Promise<void> {
  const cliente = await obtenerClienteDeUsuario(req.usuario!.idUsuario);
  if (!cliente) {
    res.status(403).json({ error: "El usuario no tiene perfil de cliente" });
    return;
  }

  const pedidos = await prisma.pedido.findMany({
    where: {
      idCliente: cliente.id,
      estado: "pendiente",
      tipoPago: { nombre: { startsWith: "Tarjeta" } },
    },
    include: { carrito: { include: { detalle: { include: { producto: true } } } } },
    orderBy: { id: "desc" },
  });

  res.status(200).json({
    pedidos: pedidos.map((p) => ({
      id: p.id,
      tipoEntrega: p.tipoEntrega,
      fechaPedido: p.fechaPedido,
      idTarjeta: p.idTarjeta,
      articulos: p.carrito.detalle.map((d) => ({
        producto: d.producto.nombre,
        cantidad: d.cantidad,
      })),
      monto: calcularMonto(p.carrito.detalle),
    })),
  });
}

/**
 * POST /pagos/verificar-tarjeta
 * Body: { idTarjeta, cvv, idPedido? }
 *
 * Verificación de la tarjeta AL MOMENTO DE PAGAR (servicio 19):
 *   1. La tarjeta existe y es del cliente autenticado.
 *   2. Fue verificada al registrarse.
 *   3. No está vencida (se revalida con el vencimiento guardado).
 *   4. El CVV capturado tiene el formato correcto (el CVV no se guarda).
 *   5. Si se indica idPedido: el pedido es del cliente, está pendiente y
 *      su tipo de pago es tarjeta. Se calcula el monto a autorizar.
 *   6. La pasarela autoriza el cargo.
 *   7. Si hubo pedido y se aprobó, se liga la tarjeta al pedido (PEDIDOS.id_tarjeta).
 */
export async function verificarTarjetaPago(req: Request, res: Response): Promise<void> {
  const idUsuario = req.usuario!.idUsuario;

  const cliente = await obtenerClienteDeUsuario(idUsuario);
  if (!cliente) {
    res.status(403).json({ error: "El usuario no tiene perfil de cliente" });
    return;
  }

  const { idTarjeta, cvv, idPedido } = req.body || {};

  const idTarjetaNum = Number(idTarjeta);
  if (!Number.isInteger(idTarjetaNum) || idTarjetaNum <= 0) {
    res.status(400).json({ error: "idTarjeta es requerido" });
    return;
  }

  let idPedidoNum: number | null = null;
  if (idPedido !== undefined && idPedido !== null && idPedido !== "") {
    idPedidoNum = Number(idPedido);
    if (!Number.isInteger(idPedidoNum) || idPedidoNum <= 0) {
      res.status(400).json({ error: "idPedido inválido" });
      return;
    }
  }

  // 1. La tarjeta debe ser del cliente (si es de otro, se responde como si no existiera)
  const tarjeta = await prisma.tarjeta.findFirst({
    where: { id: idTarjetaNum, idCliente: cliente.id },
  });
  if (!tarjeta) {
    res.status(404).json({ error: "Tarjeta no encontrada" });
    return;
  }

  // 2. Verificada al registrarse
  if (!tarjeta.verificada) {
    res.status(422).json({ aprobado: false, codigo: "tarjeta_no_verificada", error: "La tarjeta no ha sido verificada" });
    return;
  }

  // 3. Vigencia
  if (!validarExpiracion(tarjeta.mesExpiracion, tarjeta.anioExpiracion).valida) {
    registrarFallo(idUsuario);
    res.status(422).json({ aprobado: false, codigo: "tarjeta_vencida", error: "La tarjeta está vencida" });
    return;
  }

  // 4. CVV (solo formato; el CVV real lo valida el banco/pasarela)
  const marca = tarjeta.marca as MarcaTarjeta;
  if (!validarCvv(cvv, marca)) {
    registrarFallo(idUsuario);
    res.status(422).json({
      aprobado: false,
      codigo: "cvv_invalido",
      error: marca === "AMEX" ? "El CVV debe tener 4 dígitos" : "El CVV debe tener 3 dígitos",
    });
    return;
  }

  // 5. Pedido (opcional)
  let monto: number | undefined;
  if (idPedidoNum !== null) {
    const pedido = await prisma.pedido.findFirst({
      where: { id: idPedidoNum, idCliente: cliente.id },
      include: {
        tipoPago: true,
        carrito: { include: { detalle: { include: { producto: true } } } },
      },
    });
    if (!pedido) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    if (pedido.estado !== "pendiente") {
      res.status(409).json({ error: `El pedido no está pendiente de pago (estado: ${pedido.estado})` });
      return;
    }
    if (!pedido.tipoPago.nombre.startsWith("Tarjeta")) {
      res.status(422).json({ error: "El pedido no tiene configurado el pago con tarjeta" });
      return;
    }
    monto = calcularMonto(pedido.carrito.detalle);
  }

  // 6. Autorización de la pasarela
  const respuesta = autorizarTarjeta({
    marca,
    ultimosDigitos: tarjeta.ultimosDigitos,
    monto,
    contexto: "pago",
  });
  if (!respuesta.aprobada) {
    registrarFallo(idUsuario);
    res.status(402).json({ aprobado: false, codigo: respuesta.codigo, error: respuesta.mensaje });
    return;
  }

  // 7. Ligar la tarjeta al pedido
  if (idPedidoNum !== null) {
    await prisma.pedido.update({
      where: { id: idPedidoNum },
      data: { idTarjeta: tarjeta.id },
    });
  }

  res.status(200).json({
    aprobado: true,
    codigo: respuesta.codigo,
    mensaje: respuesta.mensaje,
    codigoAutorizacion: respuesta.codigoAutorizacion,
    tarjeta: {
      id: tarjeta.id,
      marca: tarjeta.marca,
      mascara: mascararNumero(tarjeta.marca, tarjeta.ultimosDigitos),
    },
    idPedido: idPedidoNum,
    monto: monto ?? null,
  });
}
