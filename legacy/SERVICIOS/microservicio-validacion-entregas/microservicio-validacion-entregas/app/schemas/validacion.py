from datetime import date

from pydantic import BaseModel


class ValidacionEntregaRequest(BaseModel):
    id_envio: int


class ValidacionEntregaResponse(BaseModel):
    id_validacion_entrega: int
    id_envio: int
    fecha_entrega: date | None
    estado: str