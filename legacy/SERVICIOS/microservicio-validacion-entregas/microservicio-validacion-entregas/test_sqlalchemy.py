from sqlalchemy import text

from app.database.connection import engine


print("Probando conexión mediante SQLAlchemy...")

try:
    with engine.connect() as connection:
        resultado = connection.execute(text("SELECT 1"))
        valor = resultado.scalar()

        print("Conexión exitosa mediante SQLAlchemy.")
        print(f"Resultado de prueba: {valor}")

except Exception as error:
    print("No se pudo conectar mediante SQLAlchemy.")
    print(f"Error: {error}")
    