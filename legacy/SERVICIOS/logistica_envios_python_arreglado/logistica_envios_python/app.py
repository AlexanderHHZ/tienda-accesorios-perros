import os
from datetime import datetime

import mysql.connector
from flask import Flask, flash, redirect, render_template, request, url_for
from mysql.connector import Error, IntegrityError

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "clave-desarrollo-cambiar-en-produccion")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "tienda"),
    "port": int(os.getenv("DB_PORT", "3306")),
}

ALLOWED_STATES = (
    "pendiente",
    "preparando",
    "enviado",
    "en_transito",
    "entregado",
    "cancelado",
)

CREATE_STATES = (
    "pendiente",
    "preparando",
    "enviado",
    "en_transito",
)


def get_connection():
    """Abre una conexión a MySQL usando la configuración del entorno."""
    return mysql.connector.connect(**DB_CONFIG)


def close_connection(conn=None, cursor=None):
    """Cierra cursor y conexión de forma segura."""
    if cursor is not None:
        try:
            cursor.close()
        except Error:
            pass
    if conn is not None:
        try:
            if conn.is_connected():
                conn.close()
        except Error:
            pass


def parse_positive_int(value, field_name):
    """Convierte un valor a entero positivo o lanza ValueError."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"El campo {field_name} debe ser un número entero.")

    if number <= 0:
        raise ValueError(f"El campo {field_name} debe ser mayor que cero.")

    return number


@app.route("/")
def index():
    return redirect(url_for("envios"))


@app.route("/envios")
def envios():
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT e.id, e.id_venta, e.id_direccion, e.num_guia, e.estado,
                   d.direccion, d.colonia, d.codigo_postal
            FROM ENVIOS e
            LEFT JOIN DIRECCIONES d ON d.id = e.id_direccion
            ORDER BY e.id DESC
        """)
        rows = cur.fetchall()
        return render_template("envios.html", envios=rows, allowed_states=ALLOWED_STATES)
    except Error:
        app.logger.exception("Error al consultar los envíos")
        flash("No fue posible consultar los envíos. Verifica la conexión con MySQL.", "danger")
        return render_template("envios.html", envios=[], allowed_states=ALLOWED_STATES), 500
    finally:
        close_connection(conn, cur)


@app.route("/envios/nuevo", methods=["GET", "POST"])
def nuevo_envio():
    if request.method == "GET":
        return render_template("nuevo_envio.html", create_states=CREATE_STATES)

    id_venta_raw = request.form.get("id_venta", "").strip()
    id_direccion_raw = request.form.get("id_direccion", "").strip()
    num_guia = request.form.get("num_guia", "").strip()
    estado = request.form.get("estado", "").strip()

    if not num_guia:
        flash("El número de guía es obligatorio.", "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

    if len(num_guia) > 100:
        flash("El número de guía no puede superar 100 caracteres.", "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

    if estado not in CREATE_STATES:
        flash("El estado seleccionado no es válido para un nuevo envío.", "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

    try:
        id_venta = parse_positive_int(id_venta_raw, "ID de venta")
        id_direccion = parse_positive_int(id_direccion_raw, "ID de dirección")
    except ValueError as exc:
        flash(str(exc), "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT id FROM VENTAS WHERE id=%s", (id_venta,))
        if cur.fetchone() is None:
            flash("La venta indicada no existe.", "danger")
            return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

        cur.execute("SELECT id FROM DIRECCIONES WHERE id=%s", (id_direccion,))
        if cur.fetchone() is None:
            flash("La dirección indicada no existe.", "danger")
            return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400

        cur.execute("SELECT id FROM ENVIOS WHERE num_guia=%s", (num_guia,))
        if cur.fetchone() is not None:
            flash("Ya existe un envío con ese número de guía.", "danger")
            return render_template("nuevo_envio.html", create_states=CREATE_STATES), 409

        cur.execute("""
            INSERT INTO ENVIOS (id_venta, id_direccion, num_guia, estado)
            VALUES (%s, %s, %s, %s)
        """, (id_venta, id_direccion, num_guia, estado))
        conn.commit()

        flash("Envío registrado correctamente.", "success")
        return redirect(url_for("envios"))
    except IntegrityError:
        if conn:
            conn.rollback()
        flash("No se pudo registrar el envío porque alguno de los datos no es válido o la guía ya existe.", "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 400
    except Error:
        if conn:
            conn.rollback()
        app.logger.exception("Error al registrar un envío")
        flash("Ocurrió un error al registrar el envío.", "danger")
        return render_template("nuevo_envio.html", create_states=CREATE_STATES), 500
    finally:
        close_connection(conn, cur)


@app.route("/envios/<int:id>/estado", methods=["POST"])
def actualizar_estado(id):
    estado = request.form.get("estado", "").strip()

    if estado not in ALLOWED_STATES:
        flash("El estado seleccionado no es válido.", "danger")
        return redirect(url_for("envios"))

    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT estado FROM ENVIOS WHERE id=%s", (id,))
        envio = cur.fetchone()

        if envio is None:
            flash("El envío no existe.", "danger")
            return redirect(url_for("envios"))

        if envio["estado"] == "entregado" and estado != "entregado":
            flash("Un envío entregado no puede regresar a un estado anterior.", "warning")
            return redirect(url_for("envios"))

        cur.execute("UPDATE ENVIOS SET estado=%s WHERE id=%s", (estado, id))
        conn.commit()
        flash("Estado del envío actualizado.", "success")
        return redirect(url_for("envios"))
    except Error:
        if conn:
            conn.rollback()
        app.logger.exception("Error al actualizar el estado del envío %s", id)
        flash("No fue posible actualizar el estado del envío.", "danger")
        return redirect(url_for("envios"))
    finally:
        close_connection(conn, cur)


@app.route("/envios/<int:id>/entregar", methods=["POST"])
def validar_entrega(id):
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        conn.start_transaction()

        cur.execute("SELECT id, estado FROM ENVIOS WHERE id=%s FOR UPDATE", (id,))
        envio = cur.fetchone()

        if envio is None:
            conn.rollback()
            flash("El envío no existe.", "danger")
            return redirect(url_for("envios"))

        if envio["estado"] == "entregado":
            conn.rollback()
            flash("Este envío ya fue validado como entregado.", "warning")
            return redirect(url_for("envios"))

        if envio["estado"] == "cancelado":
            conn.rollback()
            flash("Un envío cancelado no puede marcarse como entregado.", "warning")
            return redirect(url_for("envios"))

        cur.execute("""
            INSERT INTO VALIDACION_ENTREGA
                (id_envio, fecha_entrega_real, estado)
            VALUES (%s, %s, %s)
        """, (id, datetime.now(), "entregado"))

        cur.execute("UPDATE ENVIOS SET estado=%s WHERE id=%s", ("entregado", id))
        conn.commit()

        flash("Entrega validada correctamente.", "success")
        return redirect(url_for("envios"))
    except Error:
        if conn:
            conn.rollback()
        app.logger.exception("Error al validar la entrega del envío %s", id)
        flash("No fue posible validar la entrega.", "danger")
        return redirect(url_for("envios"))
    finally:
        close_connection(conn, cur)


@app.route("/envios/buscar", methods=["GET"])
def buscar_envio():
    guia = request.args.get("guia", "").strip()
    conn = None
    cur = None

    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT e.id, e.id_venta, e.id_direccion, e.num_guia, e.estado,
                   d.direccion, d.colonia, d.codigo_postal
            FROM ENVIOS e
            LEFT JOIN DIRECCIONES d ON d.id = e.id_direccion
            WHERE e.num_guia LIKE %s
            ORDER BY e.id DESC
        """, (f"%{guia}%",))
        rows = cur.fetchall()
        return render_template(
            "envios.html",
            envios=rows,
            busqueda=guia,
            allowed_states=ALLOWED_STATES,
        )
    except Error:
        app.logger.exception("Error al buscar el envío")
        flash("No fue posible realizar la búsqueda. Verifica la conexión con MySQL.", "danger")
        return render_template(
            "envios.html",
            envios=[],
            busqueda=guia,
            allowed_states=ALLOWED_STATES,
        ), 500
    finally:
        close_connection(conn, cur)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=os.getenv("FLASK_DEBUG", "0") == "1")
