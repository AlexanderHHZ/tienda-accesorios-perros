# Actualización visual de Huella-Shop

## Aplicar a tu instalación

1. Detén el proceso de la tienda con Ctrl+C.
2. Conserva tu carpeta `data/` y tu archivo `.env` actuales.
3. Sustituye únicamente la carpeta `web/` completa por la de este ZIP. Incluye `commercial.css`, los componentes y los recursos.
4. Ejecuta `npm start` desde la raíz de tu proyecto.
5. Abre `http://localhost:8080` y recarga con Ctrl+Shift+R.

La barra superior y el footer tienen fondo cálido claro. En Administración → Inventario, cada fila muestra la imagen junto al nombre del producto. Si no aparece este diseño, comprueba que arrancaste el proceso desde la carpeta actualizada.

## Cambios

- Fuente base de 16 px; controles, navegación y textos auxiliares de 15–16 px con mayor contraste.
- Limpieza del contenido visible en catálogo, detalle, carrito, checkout, ayuda, pedidos y recibo.
- Barra superior y footer cálidos, espaciado corregido y enlaces a rutas existentes.
- Tablas de administración claras, encabezados legibles, controles neutros y miniaturas de 56 × 56 px. Se reutilizan las fotos actuales y las ilustraciones de respaldo.
- Foco de teclado visible, botones con altura mínima de 44 px y reglas adaptables a pantallas pequeñas.
- Versionado de recursos modificados para renovar la caché del navegador.

## Alcance técnico

Los servicios, permisos, bases de datos, cálculos, reembolsos e inventario no se modificaron. El selector visible del resultado de pago se retiró del checkout y se conserva el token `demo_approved` que acepta la API existente. Los estados de pago se presentan con etiquetas legibles en lugar de mostrar el texto técnico de la pasarela.

La limpieza visual no constituye una integración bancaria: los pagos y reembolsos siguen siendo simulados. Antes de abrir al público, se necesita una pasarela real y su confirmación de transacciones en el servidor. El recibo sigue sin ser una factura fiscal. No se añadieron promesas de certificaciones, métodos de pago o tiempos de entrega inexistentes.

## Verificación

- Sintaxis JavaScript verificada.
- 9 pruebas de integración aprobadas, incluyendo compras, permisos, inventario y devoluciones.
- Comparación contra el ZIP adjunto: servicios y datos conservados sin cambios.
- Revisión visual en navegador pendiente: este entorno no dispone de un navegador ejecutable para automatizarla.
