# Servicio de Generación de Tickets

Microservicio REST para la emisión y generación de tickets de compra en formato PDF, desarrollado como parte del proyecto de Arquitectura Orientada a Servicios (SOA).

Este servicio procesa los datos de ventas realizadas en la tienda en línea y genera comprobantes de pago en PDF utilizando plantillas HTML renderizadas con **xhtml2pdf** y **Jinja2**.

---

## Tecnologías utilizadas

- Python 3.11+
- FastAPI (Framework REST)
- SQLAlchemy (ORM para base de datos)
- PostgreSQL / SQLite
- xhtml2pdf (Motor de conversión HTML a PDF)
- Jinja2 (Motor de plantillas HTML)
- Uvicorn (Servidor ASGI)
- Swagger / OpenAPI (Documentación de API)
- Git y GitHub

---

## Arquitectura

El servicio utiliza la siguiente estructura orientada a microservicios:

```text
Cliente / Servicio de Ventas
          |
          | HTTP POST / API REST
          v
       FastAPI (main.py)
          |
          +---> SQLAlchemy (ORM) ---> Base de Datos (PostgreSQL/SQLite)
          |                            (VENTAS, CLIENTES, DETALLE_VENTAS, etc.)
          |
          v
      Jinja2 Template (ticket_template.html)
          |
          v
      xhtml2pdf (Motor PDF)
          |
          v
  Respuesta Binary / Stream (PDF Download)
```

Los demás servicios deben solicitar la generación de comprobantes a través de la API REST sin acceder directamente a la lógica de maquetación del PDF.

---

## Estructura del proyecto

```text
ticket_service/
│
├── app/
│   ├── templates/
│   │   └── ticket_template.html
│   │
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
│
├── .env
├── .gitignore
├── requirements.txt
├── tickets.db
└── README.md
```

---

## Requisitos

Para ejecutar el proyecto localmente se necesita:

- Python 3.11 o superior
- pip (Gestor de paquetes de Python)
- Entorno virtual (`venv`)
- PostgreSQL o SQLite
- Git

---

## Instalación

1. **Clonar el repositorio:**

```bash
git clone git@github.com:tu_usuario/ticket-service.git
```

2. **Entrar al directorio del proyecto:**

```bash
cd ticket_service
```

3. **Crear y activar un entorno virtual:**

* En Windows (PowerShell):
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate
  ```

* En Linux/macOS:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

4. **Instalar las dependencias:**

```bash
pip install -r requirements.txt
```

---

## Configuración de variables de entorno

Crea un archivo `.env` en la raíz del proyecto usando el ejemplo `.env.example` como referencia:

```text
.env
```

Ejemplo para SQLite:

```env
DATABASE_URL=sqlite:///./tickets.db
```

Ejemplo para PostgreSQL:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
```

Nunca subas credenciales reales o el archivo `.env` al repositorio.

---

## Base de datos y Modelos

El microservicio interactúa con las siguientes tablas relacionales:

- `USUARIOS`
- `CLIENTES`
- `VENTAS`
- `DETALLE_VENTAS`
- `PRODUCTOS`
- `COMPROBANTES`

Las consultas y relaciones se gestionan a través de modelos ORM mapeados en `app/models.py`.

---

## Ejecutar el servicio

Asegúrate de tener activado el entorno virtual (`venv`) en la raíz del proyecto y ejecuta:

```bash
uvicorn app.main:app --reload
```

Por defecto, el servidor estará disponible en:

```text
http://127.0.0.1:8000
```

---

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/tickets/generate/{id_venta}` | Genera y retorna el ticket en formato PDF para el ID de venta especificado |

---

## Códigos HTTP principales

La API utiliza códigos HTTP estándar para indicar el resultado de las operaciones:

```text
201 - Ticket generado correctamente (Retorna Stream de archivo PDF)
400 - Parámetros de solicitud inválidos
404 - Venta o cliente no encontrado en la base de datos
422 - Error de validación en los parámetros de la solicitud
500 - Error interno durante la generación del PDF o consulta a la base de datos
```

---

## Documentación Swagger

Con el servidor ejecutándose, la documentación interactiva y los endpoints de prueba están disponibles en:

```text
http://127.0.0.1:8000/docs
```

Desde esta interfaz se pueden realizar solicitudes directamente e ingresar un `id_venta` para obtener el archivo PDF de descarga.

---

## Integración con otros servicios

Los demás módulos del sistema (como el servicio de Ventas o Facturación) pueden solicitar la generación del ticket mediante una petición HTTP POST:

```http
POST /api/v1/tickets/generate/11
```

La respuesta enviará el archivo ejecutable del PDF en el cuerpo (`Content-Type: application/pdf`), listo para ser descargado o impreso en el cliente.

---

## Seguridad

El archivo `.env` y el entorno virtual (`venv/`) se encuentran excluidos mediante `.gitignore`.

No deben subirse al repositorio:
- Archivos `.env`
- Bases de datos con información sensible o de producción
- Entornos virtuales (`venv/`)

---

## Proyecto académico

Servicio desarrollado como parte del proyecto escolar de **Arquitectura Orientada a Servicios (SOA)**.