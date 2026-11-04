"""
Microservicio simulador de pasarela de pagos (FastAPI).

Qué hace
--------
Recibe un pago con tarjeta, lo valida y responde APPROVED o REJECTED.
NO hay banco real: todo es simulado y vive en memoria (se pierde al reiniciar).

Endpoints
---------
GET  /                               -> interfaz web (index.html)
POST /api/pagos                      -> crea un pago
GET  /api/pagos/{id}                 -> consulta el estado de un pago
POST /api/pagos/{id}/reembolso       -> reembolsa un pago aprobado

Tarjetas de prueba (todas de 16 dígitos)
----------------------------------------
4242 4242 4242 4242  Visa        -> aprobada
5555 5555 5555 4444  Mastercard  -> aprobada
4000 0000 0000 0002  Visa        -> rechazada (fondos insuficientes)
cualquier otra que falle Luhn o no sea Visa/Mastercard -> rechazada

Seguridad
---------
El número completo y el CVV se usan solo para validar y NUNCA se guardan:
en memoria solo queda la marca y los últimos 4 dígitos.

Ejecutar:  uvicorn app:app --reload
"""

from __future__ import annotations

import re
import uuid
from datetime import date
from enum import Enum
from pathlib import Path
from threading import Lock

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

# --------------------------------------------------------------------------
# Modelos
# --------------------------------------------------------------------------


class Marca(str, Enum):
    VISA = "VISA"
    MASTERCARD = "MASTERCARD"
    DESCONOCIDA = "DESCONOCIDA"


class Estado(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REFUNDED = "REFUNDED"


class SolicitudPago(BaseModel):
    """
    Datos de entrada. Pydantic valida el FORMATO (campos vacíos, 16 dígitos,
    CVV, fecha). Las reglas de NEGOCIO (Luhn, marca, fondos) las decide
    `procesar_pago` y producen un pago RECHAZADO, no un error HTTP.
    """

    amount: float = Field(gt=0, description="Monto mayor a 0")
    currency: str = Field(pattern=r"^[A-Za-z]{3}$", description="Código de 3 letras")
    nombre: str = Field(min_length=1, description="Nombre(s) del titular")
    apellidos: str = Field(min_length=1, description="Apellidos del titular")
    payerEmail: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    cardNumber: str
    cvv: str = Field(pattern=r"^\d{3}$", description="3 dígitos")
    expiry: str = Field(pattern=r"^(0[1-9]|1[0-2])/\d{2}$", description="MM/AA")
    description: str | None = None
    externalReference: str | None = None

    @field_validator("nombre", "apellidos")
    @classmethod
    def _no_vacio(cls, v: str) -> str:
        """Rechaza textos formados solo por espacios."""
        v = v.strip()
        if not v:
            raise ValueError("no puede estar vacío")
        return v

    @field_validator("cardNumber")
    @classmethod
    def _dieciseis_digitos(cls, v: str) -> str:
        """Quita espacios/guiones y exige EXACTAMENTE 16 dígitos."""
        limpio = re.sub(r"[\s-]", "", v)
        if not re.fullmatch(r"\d{16}", limpio):
            raise ValueError("debe tener exactamente 16 dígitos")
        return limpio

    @field_validator("expiry")
    @classmethod
    def _no_vencida(cls, v: str) -> str:
        """La tarjeta es válida hasta el último día del mes de expiración."""
        mes, anio = int(v[:2]), 2000 + int(v[3:])
        hoy = date.today()
        if (anio, mes) < (hoy.year, hoy.month):
            raise ValueError("la tarjeta está vencida")
        return v


class RespuestaPago(BaseModel):
    """Lo que se devuelve y se guarda de cada transacción (sin datos sensibles)."""

    providerPaymentId: str
    status: Estado
    motivo: str
    amount: float
    currency: str
    titular: str
    marca: Marca
    ultimos4: str
    externalReference: str | None = None


# --------------------------------------------------------------------------
# Reglas de negocio (funciones puras, fáciles de probar)
# --------------------------------------------------------------------------

_RE_VISA = re.compile(r"4\d{15}")
_RE_MASTERCARD = re.compile(r"5[1-5]\d{14}|2(?:22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12}")


def detectar_marca(numero: str) -> Marca:
    """Visa empieza con 4; Mastercard con 51-55 o 2221-2720 (16 dígitos ambas)."""
    if _RE_VISA.fullmatch(numero):
        return Marca.VISA
    if _RE_MASTERCARD.fullmatch(numero):
        return Marca.MASTERCARD
    return Marca.DESCONOCIDA


def es_valido_luhn(numero: str) -> bool:
    """Algoritmo de Luhn: detecta números mal tecleados."""
    suma = 0
    for i, c in enumerate(reversed(numero)):
        d = int(c)
        if i % 2 == 1:  # se duplica un dígito sí y uno no, desde la derecha
            d = d * 2 - 9 if d > 4 else d * 2
        suma += d
    return suma % 10 == 0


def evaluar(numero: str) -> tuple[Estado, str, Marca]:
    """Decide si el pago se aprueba. Devuelve (estado, motivo, marca)."""
    marca = detectar_marca(numero)
    if marca is Marca.DESCONOCIDA:
        return Estado.REJECTED, "Marca no soportada (solo Visa y Mastercard)", marca
    if not es_valido_luhn(numero):
        return Estado.REJECTED, "Número de tarjeta inválido (falla Luhn)", marca
    if numero.endswith("0002"):  # convención de prueba
        return Estado.REJECTED, "Fondos insuficientes (simulado)", marca
    return Estado.APPROVED, "Pago aprobado (simulado)", marca


# --------------------------------------------------------------------------
# Almacén en memoria (seguro entre hilos)
# --------------------------------------------------------------------------

_transacciones: dict[str, RespuestaPago] = {}
_lock = Lock()


def _obtener(payment_id: str) -> RespuestaPago:
    """Busca una transacción o responde 404."""
    with _lock:
        pago = _transacciones.get(payment_id)
    if pago is None:
        raise HTTPException(404, "Transacción no encontrada")
    return pago


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------

app = FastAPI(title="Simulador de pasarela de pagos")
INDEX_HTML = Path(__file__).with_name("index.html")


@app.exception_handler(RequestValidationError)
async def _errores_de_formato(_: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Convierte los errores de Pydantic a un formato simple:
    {"detail": "mensaje", "errors": {"campo": "mensaje"}} con HTTP 422.
    """
    errores = {
        str(e["loc"][-1]): str(e["msg"]).removeprefix("Value error, ")
        for e in exc.errors()
    }
    resumen = "; ".join(f"{campo}: {msg}" for campo, msg in errores.items())
    return JSONResponse(status_code=422, content={"detail": resumen, "errors": errores})


@app.get("/", include_in_schema=False)
def inicio() -> FileResponse:
    """Sirve la interfaz web desde el mismo origen que la API (sin CORS)."""
    return FileResponse(INDEX_HTML)


@app.post("/api/pagos", response_model=RespuestaPago)
def crear_pago(s: SolicitudPago) -> RespuestaPago:
    """Valida la tarjeta, decide aprobado/rechazado y guarda el resultado."""
    estado, motivo, marca = evaluar(s.cardNumber)
    pago = RespuestaPago(
        providerPaymentId=str(uuid.uuid4()),
        status=estado,
        motivo=motivo,
        amount=s.amount,
        currency=s.currency.upper(),
        titular=f"{s.nombre} {s.apellidos}",
        marca=marca,
        ultimos4=s.cardNumber[-4:],  # lo único de la tarjeta que se conserva
        externalReference=s.externalReference,
    )
    with _lock:
        _transacciones[pago.providerPaymentId] = pago
    return pago


@app.get("/api/pagos/{payment_id}", response_model=RespuestaPago)
def consultar_pago(payment_id: str) -> RespuestaPago:
    """Devuelve el estado actual de una transacción."""
    return _obtener(payment_id)


@app.post("/api/pagos/{payment_id}/reembolso", response_model=RespuestaPago)
def reembolsar_pago(payment_id: str) -> RespuestaPago:
    """Marca como REFUNDED un pago APPROVED (los demás no se pueden reembolsar)."""
    with _lock:
        original = _transacciones.get(payment_id)
        if original is None:
            raise HTTPException(404, "Transacción no encontrada")
        if original.status is not Estado.APPROVED:
            raise HTTPException(400, "Solo se pueden reembolsar pagos aprobados")
        reembolsado = original.model_copy(
            update={"status": Estado.REFUNDED, "motivo": "Reembolso simulado exitoso"}
        )
        _transacciones[payment_id] = reembolsado
    return reembolsado
