"""
Acceso a la base de datos existente.

⚠️ IMPORTANTE: Las tablas ya existen y son llenadas por otras APIs.
Aquí SOLO se LEEN datos. Ajusta los nombres de tablas/columnas
según el esquema real que acuerden en el equipo.
"""
import mysql.connector
from app.config import Config
from app.models.comprobante import Comprobante, ItemComprobante


def _get_connection():
    """Crea una conexión nueva a la BD. Cierra siempre al terminar."""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
    )


def obtener_comprobante_por_venta(id_venta: int) -> Comprobante | None:
    """
    Recupera toda la información necesaria para armar el comprobante.

    Esquema asumido:
        ventas(id, folio, fecha, cliente_id, subtotal, iva, total)
        clientes(id, nombre, correo)
        detalle_venta(id, venta_id, producto, cantidad, precio_unitario)
    """
    conn = _get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1) Datos de la venta + cliente
        cursor.execute("""
            SELECT v.id, v.folio, v.fecha,
                   c.nombre AS cliente_nombre,
                   c.correo AS cliente_correo
            FROM ventas v
            JOIN clientes c ON c.id = v.cliente_id
            WHERE v.id = %s
        """, (id_venta,))
        venta = cursor.fetchone()
        if not venta:
            return None

        # 2) Detalle de productos
        cursor.execute("""
            SELECT producto, cantidad, precio_unitario
            FROM detalle_venta
            WHERE venta_id = %s
        """, (id_venta,))
        items_db = cursor.fetchall()

        items = [
            ItemComprobante(
                producto=i["producto"],
                cantidad=i["cantidad"],
                precio_unitario=float(i["precio_unitario"]),
            )
            for i in items_db
        ]

        comprobante = Comprobante(
            id_venta=venta["id"],
            folio=venta["folio"],
            fecha=str(venta["fecha"]),
            cliente_nombre=venta["cliente_nombre"],
            cliente_correo=venta["cliente_correo"],
            items=items,
        )
        comprobante.calcular_totales()
        return comprobante

    finally:
        cursor.close()
        conn.close()