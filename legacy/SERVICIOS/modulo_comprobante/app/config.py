"""
Configuración central del módulo de comprobantes.
Lee variables desde el archivo .env para no exponer credenciales.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ---- Base de datos ----
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")

    # ---- Correo ----
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

    # ---- App ----
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5005))