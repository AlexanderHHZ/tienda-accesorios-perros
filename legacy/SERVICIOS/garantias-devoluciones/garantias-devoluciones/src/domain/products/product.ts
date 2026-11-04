/** Correspondencia directa con PRODUCTOS; las fechas se representan como ISO 8601. */
export interface Product {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly lote: string;
  readonly serie: string;
  readonly caducidad: string;
  readonly id_proveedor: number;
  readonly costo: number;
  readonly precio: number;
}

export interface ProductRepository {
  findById(id: number): Promise<Product | null>;
}
