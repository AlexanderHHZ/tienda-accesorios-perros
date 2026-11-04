# Garantías y Devoluciones · Web

Frontend independiente con React, TypeScript, Vite y Tailwind CSS. Consume la API existente mediante `fetch`; no importa código interno del backend ni modifica sus reglas.

## Desarrollo

Requiere Node.js 24, igual que el backend. Desde la raíz del repositorio, en una terminal:

```bash
npm ci
npm run dev
```

En otra terminal, desde la raíz:

```bash
cd web
npm ci
npm run dev
```

Abrir <http://localhost:5173>. Vite reenvía `/api` al backend en `http://127.0.0.1:3000`, por lo que no hace falta cambiar CORS. También reenvía `/docs` para consultar la documentación existente.

Si el backend escucha en otra dirección, copiar `.env.example` a `.env.local`, ajustar `API_PROXY_TARGET` y reiniciar Vite. Esta variable configura el proxy del servidor; no es una credencial ni se expone en el JavaScript del navegador.

## Uso

- **Devoluciones:** consultar, buscar en el listado cargado, registrar con `saleId`, `productId`, `quantity` y `reason`, abrir el detalle y cambiar estado.
- **Garantías:** consultar, buscar, registrar con `saleId`, `productId` y `reason`, abrir el detalle y cambiar estado. No tiene campo de cantidad.
- Los identificadores se escriben manualmente. La API valida que existan, que el producto pertenezca a la venta y que se cumplan las reglas de negocio.
- La interfaz traduce los estados al español; los PATCH envían `PENDING`, `APPROVED`, `REJECTED` o `COMPLETED` según el contrato. Solo ofrece las transiciones permitidas: pendiente → aprobada/rechazada; aprobada → completada.
- La resolución de una garantía se registra junto con el cambio de estado. Es obligatoria para completarla, y puede registrarse al aprobar o rechazar. Una solicitud cerrada no admite cambios.
- Los errores de la API se muestran sin borrar el formulario. Las escrituras no se reintentan automáticamente. Si se pierde la respuesta, consultar el listado antes de volver a enviar.

Los listados y detalles provienen de GET reales. No hay datos de ejemplo en el frontend ni llamadas a módulos de productos o ventas. El backend actual almacena datos en memoria: se reinician al reiniciar su proceso.

## Verificación y compilación

```bash
# Desde web/
npm run typecheck
npm run build
npm run preview
```

La vista previa abre en <http://localhost:4173> y utiliza el mismo proxy; requiere la API en ejecución. Para producción, servir `web/dist` y configurar el servidor de destino para reenviar `/api` al backend. El proxy de Vite no se incluye en los archivos estáticos.

Las pruebas existentes del backend se ejecutan desde la raíz con `npm test`.

## Organización

- `src/api`: contratos HTTP, validación de respuestas, manejo de errores y endpoints.
- `src/views`: listado y coordinación de los diálogos por área.
- `src/components`: tabla/listado responsive, formularios, detalle y componentes compartidos.
- `src/hooks`: carga cancelable y actualización de recursos.
- `src/utils`: presentación de fechas/estados, búsqueda y lectura de formularios.

Los diálogos utilizan el elemento nativo `dialog` para confinar el foco, permiten cerrar con Escape cuando no hay una escritura pendiente y devuelven el foco al botón de origen. Las pestañas admiten flechas, Inicio y Fin.
