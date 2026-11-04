"""
Punto de entrada del módulo (modo standalone).
Cuando integren todo, este archivo NO se usará:
en su lugar registrarán `bp_comprobante` en el main general.
"""
from flask import Flask
from app.config import Config
from app.routes.comprobante_routes import bp_comprobante


def create_app() -> Flask:
    """Factory que crea la app con el blueprint registrado."""
    app = Flask(__name__)
    app.register_blueprint(bp_comprobante)
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=Config.FLASK_PORT, debug=True)