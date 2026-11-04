from app.database.session import SessionLocal
from app.database.models import ValidacionEntrega


print("Consultando validación mediante SQLAlchemy...")

db = SessionLocal()

try:
    validacion = (
        db.query(ValidacionEntrega)
        .filter(ValidacionEntrega.id_envio == 1001)
        .first()
    )

    if validacion:
        print("\nRegistro encontrado:")
        print(f"id_validacion_entrega: {validacion.id_validacion_entrega}")
        print(f"id_envio: {validacion.id_envio}")
        print(f"fecha_entrega: {validacion.fecha_entrega}")
        print(f"estado: {validacion.estado}")
    else:
        print("No se encontró el registro.")

finally:
    db.close()
    print("\nSesión cerrada correctamente.")