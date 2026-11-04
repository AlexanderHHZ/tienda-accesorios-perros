# Consumir la API desde otros lenguajes

La API utiliza HTTP y JSON. No requiere componentes React, paquetes del proyecto ni conexión directa a SQLite.

Configura `EMPAQUETADO_API_URL` con `http://localhost:4000/api/v1` para estos ejemplos. En Windows PowerShell:

```powershell
$env:EMPAQUETADO_API_URL = "http://localhost:4000/api/v1"
```

En macOS o Linux:

```bash
export EMPAQUETADO_API_URL=http://localhost:4000/api/v1
```

`NEXT_PUBLIC_API_URL` configura exclusivamente el frontend incluido; otros clientes pueden elegir su propio nombre de variable.

## JavaScript / TypeScript

Este ejemplo usa `fetch`, incluido en Node.js 24. Puede adaptarse a un navegador autorizado por CORS.

```javascript
const base = process.env.EMPAQUETADO_API_URL;
if (!base) throw new Error('Configura EMPAQUETADO_API_URL.');

const response = await fetch(`${base}/empaquetados`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({
    peso: 4.5,
    tamano: 'mediano',
    medidas: { largo: 40, ancho: 30, alto: 20 },
    tipoEmpacado: 'caja',
  }),
});
const result = await response.json();
if (!response.ok) throw new Error(result.error.message);
console.log(result.data);
```

## Python 3, biblioteca estándar

```python
import json
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError

base = os.environ["EMPAQUETADO_API_URL"].rstrip("/")
payload = {
    "peso": 4.5,
    "tamano": "mediano",
    "medidas": {"largo": 40, "ancho": 30, "alto": 20},
    "tipoEmpacado": "caja",
}
request = Request(
    f"{base}/empaquetados",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json", "Accept": "application/json"},
    method="POST",
)
try:
    with urlopen(request, timeout=10) as response:
        print(json.load(response)["data"])
except HTTPError as error:
    print(error.code, json.load(error)["error"]["message"])
```

## Java 17 o posterior

Guarda este ejemplo como `CrearEmpaquetado.java`. Utiliza el cliente HTTP estándar; imprime el JSON recibido para que puedas mapearlo con el serializador de tu aplicación.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class CrearEmpaquetado {
    public static void main(String[] args) throws Exception {
        String base = System.getenv("EMPAQUETADO_API_URL");
        if (base == null || base.isBlank()) {
            throw new IllegalStateException("Configura EMPAQUETADO_API_URL.");
        }
        String payload = """
            {"peso":4.5,"tamano":"mediano",
             "medidas":{"largo":40,"ancho":30,"alto":20},
             "tipoEmpacado":"caja"}
            """;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(base + "/empaquetados"))
            .timeout(Duration.ofSeconds(10))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
        HttpResponse<String> response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 201) {
            throw new IllegalStateException(response.statusCode() + ": " + response.body());
        }
        System.out.println(response.body());
    }
}
```

## C# / .NET 8 o posterior

```csharp
using System.Net.Http.Json;

var baseUrl = Environment.GetEnvironmentVariable("EMPAQUETADO_API_URL")
    ?? throw new InvalidOperationException("Configura EMPAQUETADO_API_URL.");
using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
using var response = await client.PostAsJsonAsync($"{baseUrl}/empaquetados", new {
    peso = 4.5,
    tamano = "mediano",
    medidas = new { largo = 40, ancho = 30, alto = 20 },
    tipoEmpacado = "caja"
});
var json = await response.Content.ReadAsStringAsync();
if (!response.IsSuccessStatusCode) {
    throw new HttpRequestException($"{(int)response.StatusCode}: {json}");
}
Console.WriteLine(json);
```

## Reglas para cualquier cliente

1. Usa números JSON para peso y dimensiones; no envíes `"4.5"` como string.
2. Lee `data` para un registro y `data` + `meta` para colecciones.
3. Comprueba siempre el código HTTP; un error incluye `success: false` y `error`.
4. No intentes interpretar JSON después de un DELETE exitoso: `204` no tiene cuerpo.
5. Para PATCH basta enviar los campos modificados; una dimensión puede actualizarse sola.
6. Conserva el último `updatedAt` y envíalo como `X-Expected-Updated-At` al editar o borrar si necesitas evitar cambios sobre datos antiguos.
7. Ante `409`, vuelve a consultar y presenta los cambios al usuario antes de reintentar.
8. No reintentes POST automáticamente después de un timeout: la escritura puede haber ocurrido aunque no haya llegado su respuesta. Consulta el listado antes de repetir.

En Swagger, abre una operación, selecciona **Try it out**, completa el cuerpo o parámetros y ejecuta. Para generar un cliente con herramientas OpenAPI, usa `docs/openapi.json` o la especificación publicada en `/docs/json`.

Los ejemplos de otros lenguajes son documentación de integración; los tests automatizados incluidos ejecutan Node.js y el navegador. No se declara una ejecución de compiladores Java o .NET en esta entrega.
