from fastapi import FastAPI

from app.routes.validacion import router as validacion_router


app = FastAPI(
    title="Microservicio de Validación de Entregas",
    description="Servicio para validar el estado de las entregas.",
    version="1.0.0"
)


app.include_router(validacion_router)


@app.get("/")
def inicio():
    return {
        "mensaje": "Microservicio de Validación de Entregas funcionando"
    }