import io
import uuid
import datetime
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

from app.database import get_db, engine, Base
from app import models

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Microservicio de Generación de Tickets",
    version="1.0.0",
    description="Emisión de comprobantes de pago en PDF utilizando xhtml2pdf"
)

# Cargar directorio de plantillas HTML
BASE_DIR = Path(__file__).resolve().parent
templates_env = Environment(loader=FileSystemLoader(BASE_DIR / "templates"))

@app.post(
    "/api/v1/tickets/generate/{id_venta}",
    response_class=StreamingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generar Ticket PDF"
)
def generar_ticket(id_venta: int, db: Session = Depends(get_db)):
    # 1. Obtener registro de la Venta
    venta = db.query(models.Venta).filter(models.Venta.id == id_venta).first()  
    if not venta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La venta con ID {id_venta} no existe."
        )

    # 2. Validar que no exista un comprobante emitido
    comprobante_existente = db.query(models.Comprobante).filter(models.Comprobante.id_venta == id_venta).first()  
    if comprobante_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El comprobante para esta venta ya existe con el folio: {comprobante_existente.folio}"  
        )

    # 3. Formatear folio único
    folio_generado = f"TCK-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

    # 4. Renderizar plantilla HTML con Jinja2
    template = templates_env.get_template("ticket_template.html")
    html_rendered = template.render(
        folio=folio_generado,
        fecha=venta.fecha.strftime("%d/%m/%Y %H:%M:%S"),  
        cliente_nombre=venta.cliente.usuario.nombre if (venta.cliente and venta.cliente.usuario) else "Cliente General",  
        cliente_correo=venta.cliente.usuario.correo if (venta.cliente and venta.cliente.usuario) else "N/A",  
        cliente_rfc=venta.cliente.rfc if venta.cliente else "N/A",  
        items=venta.detalles,  
        total=float(venta.total)  
    )

    # 5. Persistir nuevo comprobante en la base de datos
    nuevo_comprobante = models.Comprobante(
        id_venta=venta.id,  
        folio=folio_generado,  
        fecha_emision=datetime.datetime.utcnow(),  
        enviado_correo=False  
    )
    db.add(nuevo_comprobante)
    db.commit()

    # 6. Convertir HTML a PDF en memoria con xhtml2pdf
    pdf_buffer = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.StringIO(html_rendered), dest=pdf_buffer)

    if pisa_status.err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la generación del archivo PDF."
        )

    pdf_buffer.seek(0)

    # 7. Retornar archivo PDF listo para su descarga
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={folio_generado}.pdf"
        }
    )