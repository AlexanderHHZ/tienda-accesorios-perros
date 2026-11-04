from app.database.models import ValidacionEntrega
from app.database.session import SessionLocal
from app.simulador.paqueteria import consultar_envio


def determinar_estado(estado_paqueteria, fecha_entrega):
    if estado_paqueteria == "en_transito":
        return "pendiente"

    if estado_paqueteria == "entregado":
        if fecha_entrega is not None:
            return "validada"
        else:
            return "rechazada"

    return "pendiente"


def consultar_y_determinar_estado(id_envio):
    respuesta_paqueteria = consultar_envio(id_envio)

    if respuesta_paqueteria is None:
        return None

    estado = determinar_estado(
        respuesta_paqueteria["estado"],
        respuesta_paqueteria["fecha_entrega"]
    )

    return {
        "id_envio": respuesta_paqueteria["id_envio"],
        "fecha_entrega": respuesta_paqueteria["fecha_entrega"],
        "estado": estado
    }


def buscar_validacion(id_envio):
    db = SessionLocal()

    try:
        validacion = (
            db.query(ValidacionEntrega)
            .filter(
                ValidacionEntrega.id_envio == id_envio
            )
            .first()
        )

        return validacion

    finally:
        db.close()


def crear_validacion(id_envio, fecha_entrega, estado):
    db = SessionLocal()

    try:
        nueva_validacion = ValidacionEntrega(
            id_envio=id_envio,
            fecha_entrega=fecha_entrega,
            estado=estado
        )

        db.add(nueva_validacion)
        db.commit()
        db.refresh(nueva_validacion)

        return nueva_validacion

    finally:
        db.close()


def actualizar_validacion(validacion, fecha_entrega, estado):
    db = SessionLocal()

    try:
        validacion_db = (
            db.query(ValidacionEntrega)
            .filter(
                ValidacionEntrega.id_validacion_entrega
                == validacion.id_validacion_entrega
            )
            .first()
        )

        if validacion_db is None:
            return None

        validacion_db.fecha_entrega = fecha_entrega
        validacion_db.estado = estado

        db.commit()
        db.refresh(validacion_db)

        return validacion_db

    finally:
        db.close()


def procesar_validacion(id_envio):
    validacion = buscar_validacion(id_envio)

    if validacion and validacion.estado == "validada":
        return validacion

    resultado = consultar_y_determinar_estado(id_envio)

    if resultado is None:
        return None

    if validacion is None:
        return crear_validacion(
            resultado["id_envio"],
            resultado["fecha_entrega"],
            resultado["estado"]
        )

    return actualizar_validacion(
        validacion,
        resultado["fecha_entrega"],
        resultado["estado"]
    )