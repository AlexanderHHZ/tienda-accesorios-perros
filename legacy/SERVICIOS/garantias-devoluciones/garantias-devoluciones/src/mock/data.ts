import type { MemoryData } from '../infrastructure/repositories/in-memory-unit-of-work.js';

/** Datos ficticios. Las FK hacia módulos externos son referencias sin tablas locales. */
export const demoData: MemoryData = {
  products: [
    {
      id: 101, nombre: 'Pintura acrílica blanca 1 L', descripcion: 'Pintura para interiores.',
      lote: 'LOT-A26', serie: 'SER-A101', caducidad: '2028-09-01',
      id_proveedor: 201, costo: 150, precio: 250,
    },
    {
      id: 102, nombre: 'Sellador acrílico 1 L', descripcion: 'Sellador para superficies porosas.',
      lote: 'LOT-B26', serie: 'SER-B102', caducidad: '2028-09-01',
      id_proveedor: 201, costo: 60, precio: 100,
    },
    {
      id: 103, nombre: 'Adhesivo de contacto 500 ml', descripcion: 'Adhesivo de uso general.',
      lote: 'LOT-C26', serie: 'SER-C103', caducidad: '2028-06-01',
      id_proveedor: 202, costo: 90, precio: 150,
    },
  ],
  sales: [
    { id: 1001, id_pedido: 301, id_cliente: 401, fecha: '2026-09-20T18:00:00.000Z', total: 450 },
    { id: 1002, id_pedido: 302, id_cliente: 402, fecha: '2026-09-21T18:00:00.000Z', total: 450 },
  ],
  saleDetails: [
    { id: 2001, id_venta: 1001, id_producto: 101, cantidad: 1, precio_unitario: 250 },
    { id: 2002, id_venta: 1001, id_producto: 102, cantidad: 2, precio_unitario: 100 },
    { id: 2003, id_venta: 1002, id_producto: 103, cantidad: 3, precio_unitario: 150 },
  ],
  returns: [
    {
      id: 5001, id_venta: 1002, id_producto: 103, cantidad: 1,
      motivo: 'Envase dañado al abrir el paquete.', fecha: '2026-09-22T18:00:00.000Z',
      estado: 'COMPLETED',
    },
  ],
  warranties: [
    {
      id: 6001, id_venta: 1002, id_producto: 103,
      fecha_solicitud: '2026-09-23T18:00:00.000Z', motivo: 'El adhesivo no cumple su función.',
      estado: 'REJECTED', resolucion: 'La revisión determinó un uso fuera de las indicaciones.',
    },
  ],
};
