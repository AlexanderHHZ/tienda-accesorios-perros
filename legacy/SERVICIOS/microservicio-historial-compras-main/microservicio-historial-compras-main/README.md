Especificación Técnica del Microservicio: Historial de Compras

•	a- Nombre del Servicio: HistorialCompras (Microservicio encargado de consultar las transacciones pasadas y el estatus de los pedidos de los clientes en la plataforma de la librería).

•	b- Operación: GET (Método HTTP estándar para la recuperación, lectura y consulta de registros sin alterar ni modificar la base de datos).

•	c- Datos de entrada: 
 -usuario_id (Identificador único de tipo texto/string del cliente, enviado a través de la ruta o parámetro URL del endpoint, por ejemplo: /api/historial-compras/Aranzazu).
  
•	d- Datos de salida: 
-Estructura estandarizada en formato JSON que contiene el identificador del usuario, el total de registros de compras y un arreglo (array) con el detalle completo de cada transacción:
    -id_transaccion: Código único del pedido (ej. LIB-0001 hasta LIB-0006).
	-fecha: Fecha y hora en la que se realizó la solicitud.
    -total: Monto monetario total pagado o por pagar en pesos mexicanos (MXN).
    -estado: Estatus actual del pedido (ej. "Entregado" o "En proceso").
    -productos: Lista de artículos incluidos en la compra (título del libro, autor, precio unitario y cantidad).
    
•	e- Protocolo de comunicación:
  -Mensajes estandarizados en formato JSON transmitidos a través del protocolo HTTPS mediante una arquitectura de servicios web RESTful implementada con FastAPI (Python).

Endpoints Disponibles para Pruebas:
1.	Vista Web Temporal (Aesthetic & Responsive):
        -[http://127.0.0.1:8000/vista](http://127.0.0.1:8000/vista) (Muestra la interfaz gráfica interactiva con la paleta de colores personalizada y los 6 libros de la librería).
2.	Documentación Interactiva Automática (Swagger UI):
       -[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Permite a la maestra visualizar la especificación técnica y probar las peticiones directamente en vivo).
3.	Servicio de Datos en JSON:
       -[http://127.0.0.1:8000/api/historial-compras/](http://127.0.0.1:8000/api/historial-compras/){usuario_id}
