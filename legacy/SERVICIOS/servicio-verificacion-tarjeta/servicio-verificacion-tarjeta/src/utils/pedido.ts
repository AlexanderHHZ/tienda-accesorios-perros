interface LineaCarrito {
  cantidad: number;
  producto: { precio: { toString(): string } };
}

/** Total de un pedido = suma de (precio del producto x cantidad) de su carrito. */
export function calcularMonto(detalle: LineaCarrito[]): number {
  const total = detalle.reduce(
    (suma, linea) => suma + Number(linea.producto.precio.toString()) * linea.cantidad,
    0
  );
  return Math.round(total * 100) / 100;
}
