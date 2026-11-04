"""
Envío de correo con el comprobante adjunto (PDF).
Usa smtplib estándar para evitar dependencias innecesarias.
"""
import smtplib
from email.message import EmailMessage

from app.config import Config
from app.models.comprobante import Comprobante


def enviar_comprobante(comprobante: Comprobante, pdf_bytes: bytes) -> None:
    """
    Envía el comprobante al cliente.

    :param comprobante: Objeto con los datos del cliente y la venta.
    :param pdf_bytes: Contenido binario del PDF generado.
    :raises smtplib.SMTPException: si falla el envío.
    """
    mensaje = EmailMessage()
    mensaje["Subject"] = f"Comprobante de compra - Folio {comprobante.folio}"
    mensaje["From"] = Config.SMTP_FROM
    mensaje["To"] = comprobante.cliente_correo

    cuerpo = (
        f"Hola {comprobante.cliente_nombre},\n\n"
        f"Gracias por tu compra. Adjuntamos el comprobante con folio "
        f"{comprobante.folio} por un total de ${comprobante.total:.2f}.\n\n"
        "Saludos cordiales."
    )
    mensaje.set_content(cuerpo)

    mensaje.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=f"comprobante_{comprobante.folio}.pdf",
    )

    with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
        smtp.send_message(mensaje)