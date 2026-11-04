# Integración con otros módulos y tecnologías

## Contrato externo

La API usa HTTP, cuerpos JSON y un documento OpenAPI 3.0.3. No se distribuyen clases TypeScript como contrato de integración. Un equipo puede construir un cliente con su biblioteca HTTP habitual o generar uno a partir del documento, independientemente del lenguaje del servicio.

| Recurso | URL local predeterminada |
| --- | --- |
| API | `http://localhost:3000/api/v1` |
| Documentación interactiva | `http://localhost:3000/docs/` |
| Contrato OpenAPI | `http://localhost:3000/docs/json` |

`localhost` identifica el equipo desde el que se realiza la petición. Si la API se ejecuta en otro equipo o servidor, el consumidor debe utilizar la dirección correspondiente y el servicio debe configurar la variable `HOST` según el entorno. El contrato utiliza rutas relativas y no queda vinculado a un hostname de despliegue.

Java puede utilizar `HttpClient`; PHP, cURL; Python, un cliente HTTP; C#, `HttpClient`; Kotlin y Dart, sus clientes habituales. Todos envían los mismos campos y evalúan los mismos estados y códigos de error. No necesitan instalar Node.js ni importar módulos de este repositorio.

## Reglas de transporte

- En POST y PATCH envía `Content-Type: application/json` y un objeto JSON.
- `saleId`, `productId` y `quantity` son números enteros, no strings. Los IDs deben ser positivos y no superar `9007199254740991`; `quantity` debe ser mayor que cero.
- Los IDs de path se reciben desde la URL y se convierten y validan como enteros positivos.
- `reason` es obligatorio, no puede quedar vacío al quitar espacios externos y admite hasta 2000 caracteres. `resolution`, cuando se envía, admite de 1 a 4000 caracteres después del recorte.
- No envíes `id`, fechas ni estado inicial en los POST; el servidor los asigna. No envíes `quantity` a garantías.
- Los estados son sensibles a mayúsculas. Utiliza exactamente `PENDING`, `APPROVED`, `REJECTED` o `COMPLETED`.
- Las fechas de respuesta usan UTC e ISO 8601. Los GET de colección devuelven arreglos ordenados por ID; no hay paginación ni parámetros de filtro.

Las correspondencias entre JSON y columnas están en el README. El consumidor no necesita conocer los nombres SQL.

## Ejemplos HTTP independientes del lenguaje

### Crear una devolución

```http
POST /api/v1/returns HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json

{"saleId":1001,"productId":102,"quantity":1,"reason":"El envase presenta una fuga."}
```

Respuesta de ejemplo, en una simulación recién iniciada:

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/returns/5002

{"id":5002,"saleId":1001,"productId":102,"quantity":1,"reason":"El envase presenta una fuga.","date":"2026-09-27T22:00:00.000Z","status":"PENDING"}
```

La fecha es ilustrativa. Guarda el ID real retornado; no supongas que siempre será `5002`.

### Consultar la solicitud y aprobarla

```http
GET /api/v1/returns/5002 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

```http
PATCH /api/v1/returns/5002/status HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"status":"APPROVED"}
```

El GET y el PATCH exitosos devuelven `200` con el objeto de devolución. El cambio posterior a `COMPLETED` usa la misma ruta.

### Crear y procesar una garantía

```http
POST /api/v1/warranties HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"saleId":1001,"productId":101,"reason":"La pintura no tiene la consistencia indicada."}
```

Respuesta de ejemplo:

```json
{
  "id": 6002,
  "saleId": 1001,
  "productId": 101,
  "requestDate": "2026-09-27T22:00:00.000Z",
  "reason": "La pintura no tiene la consistencia indicada.",
  "status": "PENDING",
  "resolution": ""
}
```

```http
PATCH /api/v1/warranties/6002/status HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"status":"APPROVED","resolution":"Se autoriza reemplazo del producto."}
```

```http
PATCH /api/v1/warranties/6002/status HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"status":"COMPLETED"}
```

Completar conserva la resolución existente. Si la aprobación no la registró, envíala al completar. Una cadena vacía no borra la resolución. El PATCH exige un cambio de estado permitido; no sirve para editar la resolución de una garantía cerrada ni para mantener el mismo estado.

## Ejemplos por lenguaje

Los siguientes ejemplos realizan la misma operación: crear una devolución mediante `POST /api/v1/returns`.

La estructura JSON y las reglas de negocio son las mismas sin importar el lenguaje utilizado. Si la API se ejecuta en otro equipo, sustituye `localhost` por la dirección real del servidor.

### Python

Este ejemplo utiliza únicamente la biblioteca estándar de Python.

```python
import json
from urllib.request import Request, urlopen

url = "http://localhost:3000/api/v1/returns"

payload = {
    "saleId": 1001,
    "productId": 102,
    "quantity": 1,
    "reason": "El envase presenta una fuga."
}

body = json.dumps(payload).encode("utf-8")

request = Request(
    url,
    data=body,
    method="POST",
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
)

with urlopen(request) as response:
    data = json.loads(response.read().decode("utf-8"))

    print(response.status)
    print(data)
```

Una creación correcta responde con HTTP `201`.

### JavaScript / TypeScript

En entornos que dispongan de `fetch`, la petición puede realizarse directamente mediante HTTP.

```ts
const response = await fetch('http://localhost:3000/api/v1/returns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    saleId: 1001,
    productId: 102,
    quantity: 1,
    reason: 'El envase presenta una fuga.',
  }),
});

const data = await response.json();

console.log(response.status);
console.log(data);
```

El consumidor debe revisar `response.status` antes de asumir que la operación fue exitosa.

### Java

Este ejemplo utiliza `HttpClient`.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        String json = """
            {
              "saleId": 1001,
              "productId": 102,
              "quantity": 1,
              "reason": "El envase presenta una fuga."
            }
            """;

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/api/v1/returns"))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}
```

El cuerpo de respuesta se recibe como JSON. El proyecto consumidor puede deserializarlo con la biblioteca que utilice habitualmente.

### PHP

PHP puede consumir el servicio mediante cURL.

```php
<?php

$url = 'http://localhost:3000/api/v1/returns';

$data = [
    'saleId' => 1001,
    'productId' => 102,
    'quantity' => 1,
    'reason' => 'El envase presenta una fuga.',
];

$curl = curl_init($url);

curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($data),
]);

$response = curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

curl_close($curl);

echo $status . PHP_EOL;
echo $response . PHP_EOL;
```

El código HTTP permite distinguir una creación correcta de una respuesta de validación o conflicto.

### C#

Este ejemplo utiliza `HttpClient`.

```csharp
using System.Net.Http.Json;

using var client = new HttpClient();

var payload = new
{
    saleId = 1001,
    productId = 102,
    quantity = 1,
    reason = "El envase presenta una fuga."
};

var response = await client.PostAsJsonAsync(
    "http://localhost:3000/api/v1/returns",
    payload
);

var body = await response.Content.ReadAsStringAsync();

Console.WriteLine((int)response.StatusCode);
Console.WriteLine(body);
```

La respuesta debe evaluarse mediante su código HTTP y, cuando exista un error, mediante `error.code`.

### Otros lenguajes

La API no requiere un SDK específico. Cualquier tecnología capaz de realizar solicitudes HTTP y enviar JSON puede utilizar el mismo contrato.

Por ejemplo, una creación equivalente con cURL es:

```bash
curl -i \
  -X POST \
  http://localhost:3000/api/v1/returns \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"saleId":1001,"productId":102,"quantity":1,"reason":"El envase presenta una fuga."}'
```

Kotlin, Dart, Go, Ruby y otros lenguajes pueden reproducir exactamente la misma solicitud utilizando su cliente HTTP habitual.

## Manejo de resultados y reintentos

`201` indica creación; `200`, consulta o actualización. La cabecera `Location` de un POST apunta al recurso creado.

Los errores conservan `{ "error": { "code": "...", "message": "..." } }`. La validación puede añadir `details`. Interpreta `error.code` para tomar decisiones y usa `message` para informar al usuario. Los códigos completos están en el README y los estados de respuesta en OpenAPI.

Las solicitudes HTTP cuyo `Content-Length` no coincida con el cuerpo recibido se rechazan con `400 INVALID_CONTENT_LENGTH`.

Un `409` requiere revisar el estado o la disponibilidad actual. No representa necesariamente una falla temporal. Ejemplos: `RETURN_QUANTITY_EXCEEDED`, `ACTIVE_WARRANTY_ALREADY_EXISTS` e `INVALID_STATUS_TRANSITION`.

No hay una clave de idempotencia ni una columna de correlación en el modelo. No reintentes automáticamente un POST si una conexión se corta después de enviarlo: pudo haberse guardado. Consulta los registros y resuelve el resultado antes de repetir. Un PATCH que repite el mismo estado responde `409`, por lo que también debe comprobarse el estado actual.

Los GET pueden consultarse de nuevo. Un `500` oculta detalles internos y requiere revisión del servidor. El cliente debe configurar tiempos de espera apropiados para su integración.

## Integración desde un navegador

Swagger se sirve en el mismo origen de la API y puede ejecutar las operaciones sin CORS adicional. Las llamadas entre servidores no requieren CORS.

Un frontend alojado en otro origen necesita una política CORS explícita en el despliegue o un proxy del mismo origen. Esa política no se agrega en esta simulación porque aún no existen dominios autorizados. HTTP/JSON mantiene la interoperabilidad; CORS es una restricción del navegador, no del lenguaje utilizado.

El servicio no implementa autenticación ni autorización, conforme al alcance. La integración con esos módulos debe acordarse antes de un uso productivo.

## Sustituir la memoria por MySQL: ejemplo conceptual

Este proyecto no incluye código de conexión ni clases vacías. La sustitución se realiza mediante estos contratos existentes:

| Contrato actual | Implementación futura conceptual | Datos que administra |
| --- | --- | --- |
| ReturnRepository | MySqlReturnRepository | DEVOLUCIONES_VENTA |
| WarrantyRepository | MySqlWarrantyRepository | GARANTIAS |
| SaleRepository | MySqlSaleRepository | VENTAS y DETALLE_VENTAS, solo consulta |
| ProductRepository | MySqlProductRepository | PRODUCTOS, solo consulta |
| UnitOfWork | MySqlUnitOfWork | Contexto transaccional de una operación |

1. Implementar cada interfaz con el controlador elegido, manteniendo las columnas y las relaciones originales. No es necesario adoptar un ORM.
2. Compartir la misma conexión/transacción entre los repositorios entregados al callback de `run`.
3. Garantizar que la lectura de capacidad o garantías activas y la escritura posterior estén aisladas de operaciones concurrentes. Utilizar una estrategia válida para el motor, como transacciones serializables o bloqueos de filas existentes con orden consistente.
4. Garantizar que los cambios de estado se basen en el estado actual protegido por esa transacción, no en una lectura obsoleta.
5. Confirmar al terminar o revertir si el callback falla. Manejar los conflictos transaccionales de forma acotada y conservar la semántica del contrato.
6. Seleccionar la nueva unidad de trabajo en el punto de composición `src/app.ts`. Los servicios y las reglas no cambian.
7. Ejecutar los mismos escenarios de negocio contra el adaptador, añadiendo pruebas reales de transacciones, concurrencia y mapeo de tipos.

El repositorio de ventas puede bloquear la venta existente antes de evaluar operaciones de la misma pareja; esto evita depender de una fila de garantía que todavía no existe. La estrategia final debe coordinarse con los otros módulos que escriban en las tablas. No basta un bloqueo de JavaScript cuando hay varios servidores.

PostgreSQL y SQL Server requieren la misma semántica, con mecanismos propios de transacción. MongoDB también debe conservar la separación lógica, relaciones por ID e invariantes; la capacidad de garantizar transacciones y exclusión depende de su configuración. La arquitectura permite un adaptador, pero no afirma que todos los motores ofrezcan esas garantías de la misma manera.

La generación de IDs, el mapeo de fechas, la precisión de importes y la nulabilidad deben ajustarse al DDL real cuando el equipo lo defina. No se modifica el modelo documental para acomodar un motor concreto.

## Acuerdos que el esquema actual no permite asumir

La garantía no identifica una unidad ni una cantidad. No hay tabla de historial, vínculo garantía/devolución ni política de duración. Por ello el consumidor no debe interpretar `COMPLETED` como evidencia de una transferencia de dinero, un movimiento de stock o un reemplazo físico ejecutado por este servicio.

Los fixtures permiten una demostración autónoma; no equivalen a una sincronización con los módulos reales de ventas y productos. La interfaz de repositorios delimita esa integración futura sin introducir endpoints de otros equipos.
