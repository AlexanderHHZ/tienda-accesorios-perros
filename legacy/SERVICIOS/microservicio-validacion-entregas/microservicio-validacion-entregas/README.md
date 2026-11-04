# Microservicio de Validación de Entregas

Microservicio encargado de validar el estado de una entrega a partir de su `id_envio`. El servicio consulta las validaciones almacenadas y, cuando es necesario, consulta un servicio de paquetería simulado para determinar si la entrega puede considerarse validada.

---

## 1. Objetivo

El objetivo del microservicio es determinar el estado de validación de un envío utilizando su `id_envio`.

La entrega únicamente se considera **validada** cuando:

1. La paquetería confirma que el envío fue entregado.
2. La paquetería proporciona una fecha real de entrega.

El servicio almacena la información de validación en MySQL y devuelve el resultado mediante JSON al microservicio que realizó la solicitud.

Los estados disponibles son:

* `pendiente`
* `validada`
* `rechazada`

---

# 2. Alcance

## El servicio incluye

* Recepción de `id_envio`.
* Consulta de validaciones existentes.
* Identificación de los estados `pendiente`, `validada` y `rechazada`.
* Consulta a una paquetería simulada.
* Evaluación de la información proporcionada por la paquetería.
* Creación de nuevas validaciones.
* Actualización de validaciones existentes.
* Almacenamiento de información en MySQL.
* Generación de respuestas JSON.
* Aplicación de las reglas de negocio.
* Pruebas de diferentes escenarios de validación.

## El servicio no incluye

* Integración con una paquetería real.
* Creación del envío.
* Generación de guías de paquetería.
* Rastreo GPS del paquete.
* Gestión de pagos.
* Gestión de clientes.
* Notificaciones al cliente.
* Decisiones sobre qué proceso debe realizar otro microservicio después de recibir la validación.

La responsabilidad del servicio termina cuando determina el estado de la validación, almacena la información correspondiente y devuelve el resultado al microservicio solicitante.

---

# 3. Arquitectura

La comunicación con el microservicio solicitante se realiza mediante JSON.

```text
┌──────────────────────────┐
│ Microservicio de Envíos  │
└────────────┬─────────────┘
             │
             │ HTTP + JSON
             │
             ▼
┌──────────────────────────────────┐
│ Microservicio de Validación      │
│ de Entregas                      │
│                                  │
│ Python + FastAPI                 │
└──────────────┬───────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────────┐
│    MySQL    │  │ Paquetería       │
│             │  │ simulada         │
│ Validaciones│  │                  │
└─────────────┘  └──────────────────┘
```

### Paquetería simulada

El proyecto contiene un módulo interno que simula las respuestas que normalmente proporcionaría una paquetería externa.

Este módulo se encuentra en:

```text
app/simulador/paqueteria.py
```

No representa una integración real con una empresa de paquetería.

---

# 4. Tecnologías

* Python 3.13.15
* FastAPI
* Uvicorn
* SQLAlchemy
* PyMySQL
* Pydantic
* python-dotenv
* MySQL 8.0
* JSON
* Git
* GitHub

---

# 5. Dependencias

Las dependencias se encuentran en:

```text
requirements.txt
```

Para instalarlas:

```bash
pip install -r requirements.txt
```

Las versiones utilizadas durante el desarrollo incluyen:

```text
PyMySQL 1.2.3
python-dotenv 1.2.3
SQLAlchemy 2.1.1
Starlette 1.7.0
typing_extensions 4.16.0
typing-inspection 0.4.4
uvicorn 0.54.0
```

FastAPI y sus dependencias se encuentran especificadas en `requirements.txt`.

---

# 6. Estructura del proyecto

```text
microservicio-validacion-entregas/
│
├── app/
│   ├── database/
│   │   ├── connection.py
│   │   ├── models.py
│   │   └── session.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   └── validacion.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── validacion.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── validacion_service.py
│   │
│   ├── simulador/
│   │   ├── __init__.py
│   │   └── paqueteria.py
│   │
│   ├── __init__.py
│   └── main.py
│
├── .gitignore
├── requirements.txt
├── test_model.py
├── test_mysql.py
├── test_sqlalchemy.py
└── README.md
```

## Responsabilidad de los módulos

### `app/main.py`

Punto de entrada de la aplicación FastAPI.

### `app/routes/`

Contiene las rutas HTTP disponibles para otros servicios.

### `app/services/`

Contiene la lógica de negocio para determinar y procesar las validaciones.

### `app/schemas/`

Define los modelos de entrada y salida utilizados para la comunicación JSON.

### `app/database/`

Contiene la configuración de conexión, las sesiones y el modelo de la base de datos.

### `app/simulador/`

Contiene la lógica que simula las respuestas de una paquetería.

### Archivos de prueba

```text
test_mysql.py
test_sqlalchemy.py
test_model.py
```

Se utilizan como pruebas auxiliares para verificar la conexión y el acceso a la base de datos.

---

# 7. Base de datos

## Motor

```text
MySQL 8.0
```

## Base de datos

```text
validacion_entregas
```

## Tabla

```text
validaciones_entrega
```

### Estructura

| Campo                   | Tipo        | Características             |
| ----------------------- | ----------- | --------------------------- |
| `id_validacion_entrega` | INT         | PRIMARY KEY, AUTO_INCREMENT |
| `id_envio`              | INT         | NOT NULL, UNIQUE            |
| `fecha_entrega`         | DATE        | Puede ser NULL              |
| `estado`                | VARCHAR(20) | NOT NULL                    |

### Restricción de `id_envio`

El campo `id_envio` es `UNIQUE`.

Esto garantiza que un mismo envío no tenga múltiples registros de validación.

---

# 8. Datos utilizados por el servicio

El servicio maneja únicamente cuatro datos principales.

| Dato                    | Tipo        | Función                                    |
| ----------------------- | ----------- | ------------------------------------------ |
| `id_validacion_entrega` | INT         | Identificador de la validación             |
| `id_envio`              | INT         | Identificador del envío                    |
| `fecha_entrega`         | DATE / NULL | Fecha real proporcionada por la paquetería |
| `estado`                | String      | Estado de la validación                    |

Los valores permitidos para `estado` son:

```text
pendiente
validada
rechazada
```

---

# 9. Reglas de negocio

## RN-01 — Identificación del envío

El `id_envio` identifica el envío que se desea validar y se utiliza para buscar una validación existente.

## RN-02 — Una validación por envío

Un mismo `id_envio` no debe generar múltiples registros de validación.

Si existe una validación, esta se actualiza cuando corresponde.

## RN-03 — Identificación de la validación

El `id_validacion_entrega` identifica el registro de validación almacenado en la base de datos.

## RN-04 — Estado pendiente

La validación tendrá estado `pendiente` cuando la paquetería todavía no confirme una entrega válida.

En este estado:

```text
fecha_entrega = null
```

## RN-05 — Estado validada

La validación tendrá estado `validada` únicamente cuando:

1. La paquetería indique que el envío fue entregado.
2. Exista una fecha real de entrega.

## RN-06 — Estado rechazada

La validación tendrá estado `rechazada` cuando la paquetería indique que el envío fue entregado, pero no proporcione la fecha necesaria para validar la entrega.

`rechazada` no significa que la paquetería haya rechazado el paquete. Significa que la validación no pudo completarse por falta de la información requerida.

## RN-07 — Validación completada

Cuando una validación se encuentre en estado `validada`, el servicio no vuelve a consultar la paquetería para ese envío.

Se devuelve la información almacenada.

## RN-08 — Revisión de estados pendientes

Cuando una validación se encuentre en estado `pendiente`, el servicio consulta nuevamente la paquetería para comprobar si la información de entrega cambió.

## RN-09 — Revisión de estados rechazados

Cuando una validación se encuentre en estado `rechazada`, el servicio consulta nuevamente la paquetería para comprobar si posteriormente se obtiene la información necesaria para validar la entrega.

## RN-10 — Persistencia

Toda nueva validación y todo cambio de estado correspondiente se almacena en MySQL.

## RN-11 — Comunicación

La comunicación con el microservicio solicitante utiliza JSON mediante HTTP.

---

# 10. Flujo de validación

El flujo general es:

```text
             ┌──────────────────┐
             │ Recibir id_envio │
             └────────┬─────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │ ¿Existe validación?     │
          └───────────┬─────────────┘
                      │
             ┌────────┴─────────┐
             │                  │
            NO                 SÍ
             │                  │
             ▼                  ▼
     Consultar              Revisar estado
     paquetería                  │
             │            ┌──────┼───────┐
             │            │      │       │
             │        validada pendiente rechazada
             │            │      │       │
             │            ▼      ▼       ▼
             │         devolver consultar consultar
             │         registro paquetería paquetería
             │
             └──────────────┬─────────────┘
                            ▼
                   Determinar estado
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
         pendiente       validada      rechazada
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                     Crear / actualizar
                       validación
                            │
                            ▼
                     Guardar en MySQL
                            │
                            ▼
                       Responder JSON
```

---

# 11. Comportamiento de los estados

## Pendiente

La paquetería indica que el envío está en tránsito o todavía no confirma una entrega válida.

Resultado:

```json
{
  "id_validacion_entrega": 1,
  "id_envio": 1001,
  "fecha_entrega": null,
  "estado": "pendiente"
}
```

## Validada

La paquetería indica:

```text
estado = entregado
fecha_entrega = fecha válida
```

Resultado:

```json
{
  "id_validacion_entrega": 2,
  "id_envio": 1002,
  "fecha_entrega": "2026-09-27",
  "estado": "validada"
}
```

## Rechazada

La paquetería indica:

```text
estado = entregado
fecha_entrega = null
```

Resultado:

```json
{
  "id_validacion_entrega": 3,
  "id_envio": 1003,
  "fecha_entrega": null,
  "estado": "rechazada"
}
```

---

# 12. Comportamiento cuando ya existe una validación

| Estado existente | Acción                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `validada`       | Devuelve el registro almacenado sin consultar nuevamente la paquetería |
| `pendiente`      | Consulta nuevamente la paquetería                                      |
| `rechazada`      | Consulta nuevamente la paquetería                                      |
| No existe        | Consulta la paquetería y crea una validación                           |

---

# 13. Contrato de la API

## Operación

**Validar entrega**

## Método HTTP

```http
POST
```

## Endpoint

```text
/validaciones/entrega
```

## URL local

```text
http://127.0.0.1:8000/validaciones/entrega
```

## Entrada

El microservicio solicitante debe enviar:

```json
{
  "id_envio": 1001
}
```

El único dato requerido es:

```text
id_envio
```

---

# 14. Respuesta exitosa

La respuesta contiene los cuatro datos de la validación:

```json
{
  "id_validacion_entrega": 1,
  "id_envio": 1001,
  "fecha_entrega": null,
  "estado": "pendiente"
}
```

Cuando existe fecha:

```json
{
  "id_validacion_entrega": 2,
  "id_envio": 1002,
  "fecha_entrega": "2026-09-27",
  "estado": "validada"
}
```

---

# 15. Respuesta cuando no existe el envío

Si el simulador no encuentra información para el `id_envio`, el servicio responde con HTTP `404`.

Ejemplo:

```json
{
  "detail": "No se encontró información para el envío indicado."
}
```

---

# 16. Integración con otro microservicio

El microservicio de validación está diseñado para ser consumido por otro microservicio mediante HTTP y JSON.

El microservicio solicitante no necesita conocer:

* La estructura interna de Python.
* La implementación de SQLAlchemy.
* La estructura de MySQL.
* La lógica interna de validación.
* El funcionamiento del simulador.

Únicamente necesita conocer el contrato de la API.

## Flujo de integración

```text
┌──────────────────────┐
│ Microservicio        │
│ solicitante          │
└──────────┬───────────┘
           │
           │ POST /validaciones/entrega
           │
           │ {
           │   "id_envio": 1001
           │ }
           ▼
┌──────────────────────────────┐
│ Microservicio de Validación  │
│                              │
│ Consulta BD                  │
│ Consulta paquetería          │
│ Determina estado             │
│ Guarda resultado              │
└──────────────┬───────────────┘
               │
               │ JSON
               ▼
┌──────────────────────────────┐
│ Microservicio solicitante    │
│                              │
│ Recibe resultado             │
└──────────────────────────────┘
```

---

# 17. Ejemplo de integración

Un microservicio externo puede realizar una petición HTTP:

```http
POST /validaciones/entrega
Content-Type: application/json
```

Con:

```json
{
  "id_envio": 1001
}
```

El microservicio de validación procesa la solicitud y responde:

```json
{
  "id_validacion_entrega": 1,
  "id_envio": 1001,
  "fecha_entrega": null,
  "estado": "pendiente"
}
```

El microservicio solicitante puede utilizar el campo `estado` para decidir qué proceso realizar posteriormente.

Por ejemplo:

```text
estado = pendiente
    ↓
Esperar nueva confirmación

estado = validada
    ↓
Continuar proceso de entrega

estado = rechazada
    ↓
Realizar el proceso correspondiente
```

La decisión sobre qué hacer posteriormente pertenece al microservicio solicitante y está fuera del alcance de este servicio.

---

# 18. Ejemplos del simulador

Actualmente se utilizan los siguientes escenarios para realizar pruebas:

| `id_envio` | Estado de paquetería | Fecha        | Resultado   |
| ---------- | -------------------- | ------------ | ----------- |
| `1001`     | `en_transito`        | `null`       | `pendiente` |
| `1002`     | `entregado`          | `2026-09-27` | `validada`  |
| `1003`     | `entregado`          | `null`       | `rechazada` |
| `1004`     | `entregado`          | `2026-09-27` | `validada`  |

Estos valores son únicamente para pruebas.

---

# 19. Casos de prueba

| Caso  | Situación            | Respuesta de paquetería | Resultado                    |
| ----- | -------------------- | ----------------------- | ---------------------------- |
| CP-01 | Envío sin validación | En tránsito             | Crear `pendiente`            |
| CP-02 | Envío sin validación | Entregado + fecha       | Crear `validada`             |
| CP-03 | Envío sin validación | Entregado sin fecha     | Crear `rechazada`            |
| CP-04 | Validación pendiente | Sigue en tránsito       | Mantener `pendiente`         |
| CP-05 | Validación pendiente | Entregado + fecha       | Actualizar a `validada`      |
| CP-06 | Validación pendiente | Entregado sin fecha     | Actualizar a `rechazada`     |
| CP-07 | Validación rechazada | Sigue en tránsito       | Actualizar a `pendiente`     |
| CP-08 | Validación rechazada | Entregado + fecha       | Actualizar a `validada`      |
| CP-09 | Validación rechazada | Entregado sin fecha     | Mantener `rechazada`         |
| CP-10 | Validación validada  | Cualquier información   | Devolver registro almacenado |

---

# 20. Instalación

## Requisitos

Se requiere:

* Python 3.13
* MySQL 8.0
* Git

## Crear entorno virtual

En Windows:

```powershell
python -m venv venv
```

Activar:

```powershell
.\venv\Scripts\Activate.ps1
```

## Instalar dependencias

```powershell
pip install -r requirements.txt
```

---

# 21. Configuración de la base de datos

Crear la base de datos:

```sql
CREATE DATABASE validacion_entregas;
```

Crear la tabla:

```sql
CREATE TABLE IF NOT EXISTS validaciones_entrega (
    id_validacion_entrega INT AUTO_INCREMENT PRIMARY KEY,
    id_envio INT NOT NULL UNIQUE,
    fecha_entrega DATE NULL,
    estado VARCHAR(20) NOT NULL
);
```

---

# 22. Configuración de variables de entorno

Crear un archivo:

```text
.env
```

con:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=validacion_entregas
```

La contraseña debe corresponder al usuario de MySQL configurado localmente.

El archivo `.env` está incluido en `.gitignore` y no debe subirse al repositorio.

---

# 23. Ejecución

Con el entorno virtual activado:

```powershell
uvicorn app.main:app --reload
```

La aplicación estará disponible en:

```text
http://127.0.0.1:8000
```

---

# 24. Documentación interactiva

FastAPI proporciona Swagger automáticamente.

Acceder a:

```text
http://127.0.0.1:8000/docs
```

Desde Swagger se puede ejecutar:

```text
POST /validaciones/entrega
```

y probar diferentes `id_envio`.

---

# 25. Prueba rápida

Ejemplo:

```json
{
  "id_envio": 1002
}
```

Respuesta esperada:

```json
{
  "id_validacion_entrega": 2,
  "id_envio": 1002,
  "fecha_entrega": "2026-09-27",
  "estado": "validada"
}
```

---

# 26. Control de versiones

El proyecto utiliza Git para el control de versiones y GitHub como repositorio remoto.

Repositorio:

```text
https://github.com/dasharobles/microservicio-validacion-entregas
```

Flujo básico para nuevos cambios:

```powershell
git status
git add .
git commit -m "Descripción del cambio"
git push
```

Antes de realizar cambios importantes también se recomienda verificar que el repositorio esté actualizado:

```powershell
git pull
```

---

# 27. Seguridad

El proyecto utiliza variables de entorno para almacenar la configuración de conexión a MySQL.

No se deben incluir en GitHub:

```text
.env
venv/
__pycache__/
*.pyc
```

El archivo `.gitignore` ya contempla estos elementos.

Nunca se debe publicar en el repositorio:

* Contraseñas.
* Tokens.
* Claves API.
* Credenciales de bases de datos.

---

# 28. Limitaciones actuales

Esta versión del microservicio utiliza una paquetería simulada para pruebas.

La integración con una paquetería real no forma parte del alcance actual.

Para utilizar una paquetería real posteriormente, el módulo:

```text
app/simulador/paqueteria.py
```

podría sustituirse o adaptarse para realizar solicitudes a una API externa, manteniendo la lógica de negocio del servicio de validación separada de dicha integración.

---

# 29. Responsabilidad del microservicio

El microservicio es responsable de:

```text
Recibir id_envio
       ↓
Consultar validación existente
       ↓
Consultar paquetería cuando corresponde
       ↓
Determinar estado
       ↓
Crear o actualizar validación
       ↓
Guardar en MySQL
       ↓
Devolver JSON
```

El microservicio **no es responsable de decidir qué proceso debe realizar el sistema después de recibir el estado de la validación**.

Esa responsabilidad corresponde al microservicio que consume este servicio.

---

# 30. Estados y transiciones

```text
                    ┌──────────────┐
                    │   pendiente  │
                    └──────┬───────┘
                           │
              entregado + fecha
                           │
                           ▼
                    ┌──────────────┐
                    │   validada   │
                    └──────────────┘


pendiente
    │
    └── entregado sin fecha ──► rechazada


rechazada
    │
    ├── sigue en tránsito ────► pendiente
    │
    ├── entregado + fecha ────► validada
    │
    └── entregado sin fecha ──► rechazada


validada
    │
    └── no vuelve a consultar paquetería
```

---

# 31. Versión

**Versión actual:** `1.0.0`

**Estado:** Funcional y probado.

**Tipo de paquetería:** Simulada.

**Base de datos:** MySQL 8.0.

**Comunicación:** HTTP + JSON.

**Framework:** FastAPI.
