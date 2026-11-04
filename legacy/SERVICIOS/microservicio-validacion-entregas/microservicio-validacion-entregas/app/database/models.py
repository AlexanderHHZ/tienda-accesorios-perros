from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class ValidacionEntrega(Base):
    __tablename__ = "validaciones_entrega"

    id_validacion_entrega = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    id_envio = Column(
        Integer,
        unique=True,
        nullable=False
    )

    fecha_entrega = Column(
        Date,
        nullable=True
    )

    estado = Column(
        String(20),
        nullable=False
    )