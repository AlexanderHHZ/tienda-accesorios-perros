# Compras recibidas y reembolsos automáticos

## Compras a proveedores
El formulario pide proveedor, producto, cantidad recibida y costo unitario en MXN. Al registrar, se calcula el total en el servidor y se guarda PENDING antes de enviar una recepción de stock a Inventario. Inventario guarda una clave única y suma todas las líneas en una transacción. Repetir la operación no vuelve a sumar. La compra pasa a RECEIVED; si falla la comunicación permanece pendiente con un error y se reintenta cada cuatro segundos.

La API POST /api/admin/purchases exige Idempotency-Key y {supplier_id,detalle,items:[{id,qty,unit_cost}]}; unit_cost está en centavos. La web conserva la clave si falla la solicitud para poder reintentar. La API acepta hasta 50 productos; el formulario registra un producto por compra. Los registros antiguos sin líneas quedan LEGACY: no se inventan cantidades ni se cambia su stock.

## Devoluciones y garantías
Aprobar pasa la solicitud a Reembolsando y solicita el reembolso completo del pago original, incluido el envío. Pagos acepta exclusivamente pagos APPROVED o ya REFUNDED; actualiza una vez y devuelve la misma operación al repetir. Comercio guarda el pago actualizado, marca el pedido REFUNDED y la solicitud Reembolsada. Rechazar no mueve dinero. Una solicitud aprobada no puede rechazarse después. Ante caída de pagos, el estado pendiente se conserva y se reintenta tras reiniciar.

Las solicitudes antiguas Aprobada pueden procesarse de nuevo desde el panel para ejecutar su reembolso. Al aprobar se confirma la recepción de los artículos: las cantidades completas del pedido se reponen automáticamente mediante una recepción idempotente. Aprueba cuando los artículos estén listos para volver a inventario. Las solicitudes ya Reembolsada de versiones anteriores se regularizan al arrancar, una sola vez. Devoluciones y garantías se resuelven aquí mediante reembolso completo, sin reembolso parcial ni reemplazo. La pasarela sigue siendo simulada: no se cobra ni devuelve dinero bancario real.

## Actualización
Detén los servicios, respalda data/ y .env, sustituye el código y conserva esos datos. Arranca con npm start. Las tablas/columnas nuevas se añaden automáticamente sin borrar pedidos. Actualiza la página del panel para consultar operaciones pendientes.
