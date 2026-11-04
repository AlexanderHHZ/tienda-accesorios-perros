# Verificación

Entorno de prueba: Node 24.22.1, Python 3.12.14, Linux. Pruebas HTTP con procesos reales y SQLite temporal; no mocks de red para el flujo de compra.

| Caso automatizado | Resultado |
|---|---|
| Catálogo y protección de rutas internas | Aprobado |
| Compra aprobada con total calculado en servidor, stock, carrito y envío | Aprobado |
| Dos peticiones con misma clave devuelven un pedido único | Aprobado |
| Rechazo de pago restituye stock y conserva carrito | Aprobado |
| Cantidades inválidas, domicilio inválido, carrito vacío y producto ausente | Aprobado |
| Dos compradores compiten por una unidad sin sobreventa | Aprobado |
| Usuario ajeno no puede leer pedido ni devolverlo | Aprobado |
| Reseña solo después de compra confirmada | Aprobado |
| Solicitud de devolución persistente | Aprobado |
| Detención de pagos y reinicio del coordinador recuperan pedido | Aprobado |
| Reinicio de Auth conserva usuario/sesión | Aprobado |
| Promover administrador, bloquear clientes y crear/editar/retirar producto | Aprobado |
| HTML, JS, CSS, componentes e ilustraciones responden HTTP 200 | Aprobado |

Los casos están agrupados en nueve tests de `tests/integration.test.mjs`. Para reproducir: `npm test`. También se comprueba la sintaxis de los archivos nuevos con `node --check` y `python -m py_compile`.

**Límites de verificación:** no se pudo hacer QA visual ni automatización de navegador porque `sites-preview` no dispone de daemon en este entorno (`sites-previewd mailbox is unavailable`). No se verificó la instalación de los módulos opcionales de `legacy/`, MySQL, PostgreSQL ni SDKs .NET. No se hizo un despliegue público ni se probó un proveedor de pago/transportista real. Los nueve tests no sustituyen pruebas de carga, accesibilidad manual o auditoría antes de producción.

Prueba manual recomendada en tu equipo: vista de 390px y escritorio; abrir menú móvil; registrarse; filtrar catálogo; agregar y editar carrito; completar ambos resultados de pago; comprobar pedidos; imprimir comprobante; publicar reseña y registrar devolución. Los formularios usan labels y validaciones nativas, y los errores se muestran en español.

Ampliación profesional: la prueba administrativa también cubre imagen PNG subida y servida, proveedores (alta/edición), registro de compras y aprobación de devolución con protección contra una segunda decisión. Los nueve tests pasaron. La revisión visual en navegador sigue pendiente por indisponibilidad de la infraestructura de preview.

Flujos automáticos: stock incrementado al recibir compras, recepción repetida sin duplicados, reembolso repetido sin duplicados y recuperación de reembolso tras caída de Pagos y reinicio de Comercio: aprobados en la suite de nueve tests.

Rediseño: comprobación de sintaxis de premium.js y app.js. La suite de nueve pruebas pasó incluyendo reposición de stock al devolver, recuperación tras reinicio y ausencia de doble reposición al aprobar de nuevo. No se pudo realizar QA visual: el daemon de sites-preview sigue ausente.
