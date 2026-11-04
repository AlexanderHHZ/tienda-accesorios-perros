# Servicio #30 — Fondo

FondoService es una API REST de la tienda en línea desarrollada para la materia de Arquitectura Orientada a Servicios (SOA). Su responsabilidad es proporcionar y administrar la configuración visual del fondo de cada página, como `home`, `login`, `productos`, `carrito` y `checkout`.

El frontend consulta la API y convierte la configuración recibida en estilos CSS. De esta manera, la apariencia del fondo se administra mediante un contrato HTTP/JSON independiente del código de cada página.

## Relación con SOA

Este servicio tiene una responsabilidad delimitada, se ejecuta como una aplicación independiente y expone operaciones mediante HTTP. Otros componentes pueden consumir su contrato REST sin conocer su almacenamiento o implementación interna. Puede integrarse con los servicios visuales 26 (Encabezado), 27 (Pie), 28 (Botones) y 29 (Menú), manteniendo separada la responsabilidad del fondo.

Esta primera versión utiliza memoria: los cambios se conservan durante la ejecución y se pierden al reiniciar. Cada proceso tiene su propio almacenamiento. No utiliza base de datos, Entity Framework, SQL, autenticación ni Docker.

## Tecnologías

- C# y ASP.NET Core Web API con controladores.
- .NET 10 (`net10.0`); SDK detectado al implementar: 10.0.401.
- Inyección de dependencias integrada de ASP.NET Core.
- Data Annotations e `IValidatableObject` para validación.
- `Microsoft.AspNetCore.OpenApi` 10.0.12, ya presente en el proyecto.
- JSON y HTTP para el intercambio de información.

No se agregaron paquetes NuGet. La documentación OpenAPI utiliza el soporte nativo de ASP.NET Core: [documentación oficial](https://learn.microsoft.com/aspnet/core/fundamentals/openapi/overview?view=aspnetcore-10.0).

## Estructura

```text
FondoService/
├── Controllers/
│   └── BackgroundController.cs
├── Models/
│   └── BackgroundConfig.cs
├── DTOs/
│   ├── CreateBackgroundRequest.cs
│   └── UpdateBackgroundRequest.cs
├── Services/
│   ├── IBackgroundService.cs
│   └── StoreBackgroundService.cs
├── Properties/launchSettings.json
├── scripts/Test-Api.ps1
├── Program.cs
├── FondoService.csproj
├── FondoService.http
└── README.md
```

El controlador traduce las operaciones del servicio a respuestas HTTP. Los DTOs contienen los datos permitidos en POST y PUT; el cliente no asigna el ID ni la fecha. `UpdateBackgroundRequest` reutiliza las reglas de creación. El modelo representa la respuesta de la API.

`StoreBackgroundService` implementa `IBackgroundService` y se registra como **Singleton**, para que todas las peticiones del proceso compartan los mismos datos. Las operaciones usan un bloqueo para impedir que dos peticiones simultáneas creen fondos activos para la misma página. Las configuraciones tienen propiedades `init`, por lo que no se modifican directamente desde el controlador; actualizar reemplaza el objeto almacenado.

## Tipos de fondo y validaciones

| Tipo | Significado | Campos obligatorios adicionales |
| --- | --- | --- |
| `color` | Color uniforme | `primaryColor` |
| `gradient` | Degradado entre dos colores | `primaryColor`, `secondaryColor` |
| `image` | Imagen de fondo | `imageUrl` |

- `page` y `type` son obligatorios y no pueden contener únicamente espacios.
- Solo se aceptan los tipos `color`, `gradient` e `image`.
- Las páginas se comparan sin distinguir mayúsculas/minúsculas. También se eliminan espacios al principio y al final, y se almacenan página y tipo en minúsculas.
- Solo puede existir una configuración **activa** por página. Se permiten varias configuraciones inactivas de esa misma página.
- `GET /api/background/{page}` devuelve exclusivamente la configuración activa; consultar por ID también permite recuperar una inactiva.
- `isActive` vale `true` si se omite. Para desactivar un fondo, enviar un PUT completo con `isActive: false`.
- Para cambiar el fondo activo por otra configuración, primero desactivar la actual y luego activar la nueva. Los conflictos devuelven 400 y no modifican los datos existentes.
- Para `image`, `primaryColor` es opcional; en la respuesta será `""` si no se proporcionó. Puede utilizarse como color de respaldo.
- Esta versión verifica la presencia de colores y URL, no su sintaxis CSS ni la disponibilidad de la imagen. El consumidor debe enviar valores válidos para el navegador.
- `updatedAt` lo genera el servidor en UTC, al crear o actualizar (`Z` en JSON).

Datos iniciales, todos activos: `home` (ID 1, gradient, `#0F172A` y `#1E293B`), `login` (ID 2, color, `#F8FAFC`) y `productos` (ID 3, color, `#F1F5F9`).

## Endpoints

Ruta base: `/api/background`.

| Método | Ruta | Resultado correcto | Errores previstos |
| --- | --- | --- | --- |
| GET | `/api/background` | 200: todos los fondos, activos e inactivos | — |
| GET | `/api/background/{page}` | 200: fondo activo de la página | 404: no hay fondo activo |
| GET | `/api/background/id/{id}` | 200: fondo por ID | 404: ID inexistente |
| POST | `/api/background` | 201: fondo creado | 400: datos inválidos o página activa duplicada |
| PUT | `/api/background/id/{id}` | 200: fondo actualizado | 400: datos inválidos o conflicto; 404: ID inexistente |
| DELETE | `/api/background/id/{id}` | 200: mensaje de eliminación | 404: ID inexistente |

Los IDs de las rutas deben ser enteros. POST incluye la cabecera `Location` con la ruta para consultar el recurso creado. PUT reemplaza la configuración completa; se deben enviar todos los campos requeridos para su tipo. DELETE devuelve un mensaje JSON.

### Ejemplo de respuesta de home

```json
{
  "id": 1,
  "page": "home",
  "type": "gradient",
  "primaryColor": "#0F172A",
  "secondaryColor": "#1E293B",
  "imageUrl": null,
  "isActive": true,
  "updatedAt": "2026-10-06T14:00:00Z"
}
```

La fecha anterior es ilustrativa; la API genera la fecha real al ejecutarse.

### Crear un color

```json
{
  "page": "carrito",
  "type": "color",
  "primaryColor": "#FFFFFF",
  "isActive": true
}
```

### Crear un degradado

```json
{
  "page": "checkout",
  "type": "gradient",
  "primaryColor": "#0F172A",
  "secondaryColor": "#1E293B",
  "isActive": true
}
```

### Crear una imagen

```json
{
  "page": "ofertas",
  "type": "image",
  "imageUrl": "https://placehold.co/1600x900/png",
  "isActive": true
}
```

La URL es una imagen pública de ejemplo; al integrar la tienda se debe sustituir por la URL de su recurso.

### Errores

Una petición con un tipo desconocido devuelve 400:

```json
{
  "message": "El tipo debe ser color, gradient o image."
}
```

Las validaciones, los conflictos y los recursos inexistentes devuelven mensajes JSON. Los errores de formato de JSON o de conversión de campos también devuelven 400 con `message`.

## Ejecución

Instalar el SDK de .NET 10. Desde la carpeta que contiene `FondoService.csproj`:

```powershell
dotnet restore
dotnet build
dotnet run --launch-profile http
```

El perfil `http` establece `Development` y utiliza inicialmente `http://localhost:5209`. Revisar la dirección que indica `Now listening on` y ajustar `@FondoService_HostAddress` en `FondoService.http` si el puerto cambia. Detener con Ctrl+C.

También está disponible `dotnet run --launch-profile https`, con `https://localhost:7205` y `http://localhost:5209`. Para usar HTTPS local, el certificado de desarrollo debe estar configurado y ser de confianza.

En desarrollo se permite HTTP directamente para facilitar las pruebas con el perfil `http`. Fuera de desarrollo se conserva la redirección a HTTPS; el despliegue debe proporcionar su endpoint HTTPS.

### OpenAPI

Con el perfil de desarrollo, abrir `http://localhost:5209/openapi/v1.json`. El documento describe las seis operaciones del controlador y puede importarse en una herramienta compatible con OpenAPI. Se mantiene OpenAPI nativo; no se agregó una interfaz gráfica Swagger UI, por lo que `/swagger` no es una ruta de este proyecto.

### Peticiones de ejemplo y comprobación

`FondoService.http` contiene GET todos, GET home, GET por ID, POST para los tres tipos, PUT y DELETE. Ejecutar los POST una vez; repetir uno activo para la misma página genera el conflicto esperado. Antes de PUT y DELETE, ajustar `@BackgroundId` al ID devuelto por POST color (será 4 en una ejecución recién iniciada si no se crearon otros fondos).

Después de compilar, ejecutar la comprobación HTTP desde PowerShell (Windows PowerShell 5.1 o PowerShell 7):

```powershell
& ./scripts/Test-Api.ps1
```

El script inicia una instancia temporal en un puerto libre, comprueba el contrato HTTP, las validaciones, CORS, OpenAPI y concurrencia, y termina esa instancia al finalizar. No modifica los datos de una API que ya esté abierta.

Verificación realizada durante la implementación: `dotnet restore` correcto, `dotnet build` con 0 errores y 0 advertencias, y 143 comprobaciones HTTP aprobadas. Se comprobó el arranque en Development y Production, el rechazo de duplicados concurrentes y que CORS local y OpenAPI no se habilitan en Production. Las instancias de prueba se cerraron al finalizar.

## Integración con un frontend

El navegador consulta la página actual y aplica los estilos correspondientes. Ejemplo de JavaScript:

```javascript
async function aplicarFondo(page) {
  const apiUrl = "http://localhost:5209"; // Ajustar a la dirección de la API.
  const response = await fetch(`${apiUrl}/api/background/${encodeURIComponent(page)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "No se pudo obtener el fondo.");
  }

  const fondo = await response.json();
  const estilo = document.body.style;
  estilo.backgroundImage = "none";
  estilo.backgroundColor = fondo.primaryColor || "transparent";
  estilo.backgroundSize = "auto";
  estilo.backgroundPosition = "initial";
  estilo.backgroundRepeat = "repeat";

  if (fondo.type === "gradient") {
    estilo.backgroundImage = `linear-gradient(135deg, ${fondo.primaryColor}, ${fondo.secondaryColor})`;
  } else if (fondo.type === "image") {
    estilo.backgroundImage = `url(${JSON.stringify(fondo.imageUrl)})`;
    estilo.backgroundSize = "cover";
    estilo.backgroundPosition = "center";
    estilo.backgroundRepeat = "no-repeat";
  }
}

aplicarFondo("home").catch(console.error);
```

La dirección del frontend puede usar cualquier puerto local. En `Development`, CORS admite orígenes HTTP/HTTPS de loopback, como `localhost`, `127.0.0.1` y `[::1]`, con los métodos GET, POST, PUT y DELETE. No habilita credenciales. Esta política no se registra ni se aplica en producción. Una integración futura en producción deberá definir sus orígenes explícitos según el despliegue. [Referencia oficial sobre CORS](https://learn.microsoft.com/aspnet/core/security/cors?view=aspnetcore-10.0).

CORS controla el acceso desde el navegador; no es autenticación. Esta versión académica no incluye control de acceso, de acuerdo con el alcance solicitado.
