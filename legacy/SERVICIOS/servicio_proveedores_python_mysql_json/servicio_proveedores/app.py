from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv(override=True)

app = Flask(__name__)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "tienda"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "")
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def validar_proveedor(data, parcial=False):
    campos = ["nombre", "razon_social", "rfc", "direccion", "correo", "telefono"]
    if not parcial:
        faltantes = [c for c in campos if c not in data]
        if faltantes:
            return f"Faltan campos obligatorios: {', '.join(faltantes)}"
    for campo in campos:
        if campo in data and data[campo] is not None and not isinstance(data[campo], str):
            return f"El campo '{campo}' debe ser texto"
    return None

@app.get("/api/proveedores")
def listar_proveedores():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, razon_social, rfc, direccion, correo, telefono
            FROM PROVEEDORES
            ORDER BY id DESC
        """)
        proveedores = cursor.fetchall()
        return jsonify({"success": True, "data": proveedores}), 200
    except Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@app.get("/api/proveedores/<int:id>")
def obtener_proveedor(id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nombre, razon_social, rfc, direccion, correo, telefono
            FROM PROVEEDORES
            WHERE id = %s
        """, (id,))
        proveedor = cursor.fetchone()

        if not proveedor:
            return jsonify({
                "success": False,
                "message": "Proveedor no encontrado"
            }), 404

        return jsonify({"success": True, "data": proveedor}), 200
    except Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@app.post("/api/proveedores")
def crear_proveedor():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "El cuerpo debe ser JSON"
        }), 400

    error = validar_proveedor(data)
    if error:
        return jsonify({"success": False, "message": error}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id FROM PROVEEDORES WHERE rfc = %s
        """, (data["rfc"],))
        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Ya existe un proveedor con ese RFC"
            }), 409

        cursor.execute("""
            INSERT INTO PROVEEDORES
                (nombre, razon_social, rfc, direccion, correo, telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["nombre"],
            data["razon_social"],
            data["rfc"],
            data["direccion"],
            data["correo"],
            data["telefono"]
        ))

        conn.commit()
        nuevo_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Proveedor creado correctamente",
            "data": {
                "id": nuevo_id,
                **data
            }
        }), 201

    except Error as e:
        if "Duplicate" in str(e):
            return jsonify({
                "success": False,
                "message": "El RFC ya está registrado"
            }), 409
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@app.put("/api/proveedores/<int:id>")
def actualizar_proveedor(id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "El cuerpo debe ser JSON"
        }), 400

    error = validar_proveedor(data, parcial=True)
    if error:
        return jsonify({"success": False, "message": error}), 400

    campos_permitidos = [
        "nombre", "razon_social", "rfc",
        "direccion", "correo", "telefono"
    ]
    campos = [c for c in campos_permitidos if c in data]

    if not campos:
        return jsonify({
            "success": False,
            "message": "No hay campos para actualizar"
        }), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM PROVEEDORES WHERE id = %s", (id,))
        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Proveedor no encontrado"
            }), 404

        if "rfc" in data:
            cursor.execute(
                "SELECT id FROM PROVEEDORES WHERE rfc = %s AND id <> %s",
                (data["rfc"], id)
            )
            if cursor.fetchone():
                return jsonify({
                    "success": False,
                    "message": "El RFC ya pertenece a otro proveedor"
                }), 409

        set_clause = ", ".join(f"{campo} = %s" for campo in campos)
        valores = [data[campo] for campo in campos] + [id]

        cursor.execute(
            f"UPDATE PROVEEDORES SET {set_clause} WHERE id = %s",
            valores
        )
        conn.commit()

        cursor.execute("""
            SELECT id, nombre, razon_social, rfc, direccion, correo, telefono
            FROM PROVEEDORES
            WHERE id = %s
        """, (id,))
        proveedor = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Proveedor actualizado correctamente",
            "data": proveedor
        }), 200

    except Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@app.delete("/api/proveedores/<int:id>")
def eliminar_proveedor(id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM PROVEEDORES WHERE id = %s", (id,))
        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Proveedor no encontrado"
            }), 404

        # Evita borrar un proveedor que ya tenga compras registradas.
        cursor.execute(
            "SELECT COUNT(*) AS total FROM COMPRAS WHERE id_proveedor = %s",
            (id,)
        )
        compras = cursor.fetchone()["total"]

        if compras > 0:
            return jsonify({
                "success": False,
                "message": "No se puede eliminar el proveedor porque tiene compras registradas"
            }), 409

        cursor.execute("DELETE FROM PROVEEDORES WHERE id = %s", (id,))
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Proveedor eliminado correctamente"
        }), 200

    except Error as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

@app.get("/api/health")
def health():
    try:
        conn = get_connection()
        conn.close()
        return jsonify({
            "success": True,
            "service": "proveedores",
            "mysql": "connected"
        }), 200
    except Error as e:
        return jsonify({
            "success": False,
            "service": "proveedores",
            "mysql": "disconnected",
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
