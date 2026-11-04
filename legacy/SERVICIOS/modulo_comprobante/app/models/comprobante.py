"""
Modelo de datos del comprobante.
Se usa como DTO (Data Transfer Object) para transportar
la información entre la BD, el PDF y el correo.
"""
from dataclasses import dataclass, field
from typing import List


@dataclass
class ItemComprobante:
    """Representa una línea del comprobante (un producto)."""
    producto: str
    cantidad: int
    precio_unitario: float

    @property
    def subtotal(self) -> float:
        return round(self.cantidad * self.precio_unitario, 2)


@dataclass
class Comprobante:
    """
    Comprobante de compra completo.
    Contiene los datos del cliente, la venta y el detalle de productos.
    """
    id_venta: int
    folio: str
    fecha: str
    cliente_nombre: str
    cliente_correo: str
    items: List[ItemComprobante] = field(default_factory=list)
    subtotal: float = 0.0
    iva: float = 0.0
    total: float = 0.0

    def calcular_totales(self, tasa_iva: float = 0.16):
        """Calcula subtotal, IVA y total a partir de los items."""
        self.subtotal = round(sum(i.subtotal for i in self.items), 2)
        self.iva = round(self.subtotal * tasa_iva, 2)
        self.total = round(self.subtotal + self.iva, 2)