import pymysql

print("Conectando con MySQL...")

password = input("Escribe tu contraseña de MySQL: ")

try:
    connection = pymysql.connect(
        host="localhost",
        port=3306,
        user="root",
        password=password,
        database="validacion_entregas"
    )

    print("Conexión con la base de datos exitosa.")

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id_validacion_entrega,
            id_envio,
            fecha_entrega,
            estado
        FROM validaciones_entrega
        WHERE id_envio = %s
    """, (1001,))

    registro = cursor.fetchone()

    if registro:
        print("\nRegistro encontrado:")
        print(f"id_validacion_entrega: {registro[0]}")
        print(f"id_envio: {registro[1]}")
        print(f"fecha_entrega: {registro[2]}")
        print(f"estado: {registro[3]}")
    else:
        print("No se encontró el envío.")

    cursor.close()
    connection.close()

    print("\nConexión cerrada correctamente.")

except pymysql.MySQLError as error:
    print("No se pudo realizar la operación.")
    print(f"Error: {error}")