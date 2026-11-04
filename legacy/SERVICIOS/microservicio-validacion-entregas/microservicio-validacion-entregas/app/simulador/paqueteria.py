from datetime import date


def consultar_envio(id_envio: int):
    if id_envio == 1001:
        return {
            "id_envio": 1001,
            "estado": "en_transito",
            "fecha_entrega": None
        }

    elif id_envio == 1002:
        return {
            "id_envio": 1002,
            "estado": "entregado",
            "fecha_entrega": date(2026, 9, 27)
        }

    elif id_envio == 1003:
        return {
            "id_envio": 1003,
            "estado": "entregado",
            "fecha_entrega": None
        }
  
    elif id_envio == 1004:
            return {
                "id_envio": 1004,
                "estado": "en_transito",
                "fecha_entrega": None
            }
    else:
        return None