"""
Endpoints REST del módulo.
Estos son los puntos de contacto que usarán los demás compañeros
(por ejemplo, el módulo de ventas llamará a /comprobante/enviar/<id_venta>).
"""
from flask import Blueprint, jsonify

from app.services.db_service import obtener_comprobante_por_venta
from app.services.pdf_service import generar_pdf
from app.services.email_service import enviar_comprobante

bp_comprobante = Blueprint("comprobante", __name__, url_prefix="/comprobante")


@bp_comprobante.route("/enviar/<int:id_venta>", methods=["POST"])
def enviar(id_venta: int):
    """
    Genera y envía el comprobante de una venta.

    URL: POST /comprobante/enviar/<id_venta>
    Respuestas:
        200 -> {"ok": true, "mensaje": "Comprobante enviado a ..."}
        404 -> {"ok": false, "error": "Venta no encontrada"}
        500 -> {"ok": false, "error": "..."}
    """
    try:
        comprobante = obtener_comprobante_por_venta(id_venta)
        if not comprobante:
            return jsonify({"ok": False, "error": "Venta no encontrada"}), 404

        pdf_bytes = generar_pdf(comprobante)
        enviar_comprobante(comprobante, pdf_bytes)

        return jsonify({
            "ok": True,
            "mensaje": f"Comprobante enviado a {comprobante.cliente_correo}",
            "folio": comprobante.folio,
        }), 200

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@bp_comprobante.route("/preview/<int:id_venta>", methods=["GET"])
def preview(id_venta: int):
    """Devuelve el JSON del comprobante sin enviarlo (útil para pruebas)."""
    comprobante = obtener_comprobante_por_venta(id_venta)
    if not comprobante:
        return jsonify({"ok": False, "error": "Venta no encontrada"}), 404

    return jsonify({
        "id_venta": comprobante.id_venta,
        "folio": comprobante.folio,
        "cliente": comprobante.cliente_nombre,
        "correo": comprobante.cliente_correo,
        "items": [i.__dict__ | {"subtotal": i.subtotal} for i in comprobante.items],
        "subtotal": comprobante.subtotal,
        "iva": comprobante.iva,
        "total": comprobante.total,
    }), 200