from fastapi import APIRouter, HTTPException

from app.schemas.validacion import (
    ValidacionEntregaRequest,
    ValidacionEntregaResponse
)

from app.services.validacion_service import procesar_validacion


router = APIRouter(
    prefix="/validaciones",
    tags=["Validaciones de Entrega"]
)


@router.post(
    "/entrega",
    response_model=ValidacionEntregaResponse
)
def validar_entrega(datos: ValidacionEntregaRequest):

    validacion = procesar_validacion(datos.id_envio)

    if validacion is None:
        raise HTTPException(
            status_code=404,
            detail="No se encontró información para el envío indicado."
        )

    return validacion