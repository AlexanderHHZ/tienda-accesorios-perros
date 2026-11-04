"""
Genera el PDF del comprobante usando ReportLab.
Devuelve los bytes del PDF en memoria (no toca disco),
para poder adjuntarlo directamente al correo.
"""
from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib import colors

from app.models.comprobante import Comprobante


def generar_pdf(comprobante: Comprobante) -> bytes:
    """Construye el PDF del comprobante y lo retorna como bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER)
    estilos = getSampleStyleSheet()
    elementos = []

    # Encabezado
    elementos.append(Paragraph("<b>Comprobante de Compra</b>", estilos["Title"]))
    elementos.append(Spacer(1, 12))
    elementos.append(Paragraph(f"Folio: {comprobante.folio}", estilos["Normal"]))
    elementos.append(Paragraph(f"Fecha: {comprobante.fecha}", estilos["Normal"]))
    elementos.append(Paragraph(f"Cliente: {comprobante.cliente_nombre}", estilos["Normal"]))
    elementos.append(Spacer(1, 18))

    # Tabla de productos
    data = [["Producto", "Cantidad", "P. Unitario", "Subtotal"]]
    for item in comprobante.items:
        data.append([
            item.producto,
            str(item.cantidad),
            f"${item.precio_unitario:.2f}",
            f"${item.subtotal:.2f}",
        ])

    tabla = Table(data, colWidths=[220, 80, 100, 100])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E86C1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
    ]))
    elementos.append(tabla)
    elementos.append(Spacer(1, 18))

    # Totales
    elementos.append(Paragraph(f"Subtotal: ${comprobante.subtotal:.2f}", estilos["Normal"]))
    elementos.append(Paragraph(f"IVA: ${comprobante.iva:.2f}", estilos["Normal"]))
    elementos.append(Paragraph(f"<b>Total: ${comprobante.total:.2f}</b>", estilos["Normal"]))

    doc.build(elementos)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes