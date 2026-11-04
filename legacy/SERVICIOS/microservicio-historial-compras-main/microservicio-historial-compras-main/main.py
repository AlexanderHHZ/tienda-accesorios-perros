from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="Historial de Compras",
    description="Historial de compras de la librería (Consultas)",
    version="1.0.0",
)


@app.get("/vista", response_class=HTMLResponse)
def mostrar_pagina_html():
  try:
    with open("HistorialCompras.html", "r", encoding="utf-8") as archivo:
      return archivo.read()
  except FileNotFoundError:
    return "<h1>Error: No se encontró el archivo HistorialCompras.html</h1>"


@app.get("/api/historial-compras/{usuario_id}")
def obtener_historial_compras(usuario_id: str):
  return {
      "usuario_id": usuario_id,
      "total_compras": 6,
      "compras": [
          {
              "id_transaccion": "LIB-0001",
              "fecha": "26/09/2026",
              "total": 450.50,
              "estado": "Entregado",
              "productos": [{
                  "titulo": "Heartless",
                  "autor": "Marissa Mayers",
                  "precio": 450.50,
                  "cantidad": 1,
              }],
          },
          {
              "id_transaccion": "LIB-0002",
              "fecha": "24/09/2026",
              "total": 380.00,
              "estado": "Entregado",
              "productos": [{
                  "titulo": "Harry Potter y la Piedra Filosofal",
                  "autor": "J.K. Rowling",
                  "precio": 380.00,
                  "cantidad": 1,
              }],
          },
          {
              "id_transaccion": "LIB-0003",
              "fecha": "26/09/2026",
              "total": 299.00,
              "estado": "En proceso",
              "productos": [{
                  "titulo": "La Odisea",
                  "autor": "Homero",
                  "precio": 299.00,
                  "cantidad": 1,
              }],
          },
          {
              "id_transaccion": "LIB-0004",
              "fecha": "18/09/2026",
              "total": 420.00,
              "estado": "Entregado",
              "productos": [{
                  "titulo": "Circe",
                  "autor": "Madeline Miller",
                  "precio": 420.00,
                  "cantidad": 1,
              }],
          },
          {
              "id_transaccion": "LIB-0005",
              "fecha": "10/09/2026",
              "total": 399.00,
              "estado": "Entregado",
              "productos": [{
                  "titulo": "La canción de Aquiles",
                  "autor": "Madeline Miller",
                  "precio": 399.00,
                  "cantidad": 1,
              }],
          },
          {
              "id_transaccion": "LIB-0006",
              "fecha": "26/09/2026",
              "total": 520.00,
              "estado": "En proceso",
              "productos": [{
                  "titulo": "Alas de sangre (Fourth Wing)",
                  "autor": "Rebecca Yarros",
                  "precio": 520.00,
                  "cantidad": 1,
              }],
          },
      ],
  }