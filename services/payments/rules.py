# Reutilizado de serviciopago/app.py: enumeraciones y funciones puras.
import re
from enum import Enum

class Marca(str, Enum):
    VISA = "VISA"
    MASTERCARD = "MASTERCARD"
    DESCONOCIDA = "DESCONOCIDA"


class Estado(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REFUNDED = "REFUNDED"


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


