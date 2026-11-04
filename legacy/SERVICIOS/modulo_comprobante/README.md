# Módulo de Envío de Comprobante de Compra

## Descripción
Genera un PDF con el comprobante de una venta y lo envía por correo
al cliente. Los datos se leen desde la base de datos del proyecto.

## Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/comprobante/enviar/<id_venta>` | Genera y envía el comprobante |
| GET  | `/comprobante/preview/<id_venta>` | Devuelve JSON sin enviar |

## Dependencias externas
- Tablas `ventas`, `clientes`, `detalle_venta`.
- SMTP configurado (Gmail, Outlook, etc.).

## Instalación
```bash
python -m venv venv
venv\Scripts\activate         # o source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # y llenar credenciales
python -m app.main