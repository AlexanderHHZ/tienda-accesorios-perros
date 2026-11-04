# Biblioteca de Menú

Biblioteca JavaScript para crear una barra de navegación configurable y reutilizable para sitios web.

La biblioteca permite que el consumidor configure la apariencia y estructura básica del menú directamente desde HTML, sin necesidad de modificar el código interno de la biblioteca.

---

## Características

Actualmente la biblioteca permite configurar:

* Nombre de la tienda.
* Logo.
* Altura del menú.
* Tamaño del logo.
* Tamaño del nombre.
* Tamaño de las opciones.
* Colores del menú.
* Opciones de navegación.
* Barra de búsqueda.
* Posición de la barra de búsqueda.
* Texto del buscador.
* Ancho del buscador.
* Tipografía general.
* Tipografía individual para diferentes elementos.

La barra de búsqueda funciona actualmente como un **elemento visual**. La biblioteca no realiza búsquedas en una base de datos ni consulta información externa.

---

## Estructura del proyecto

```text
biblioteca-menu/
│
├── menu.js
├── menu.css
├── README.md
│
└── ejemplo/
    └── index.html
```

### `menu.js`

Contiene la lógica de la biblioteca y la función principal:

```javascript
crearMenu()
```

### `menu.css`

Contiene los estilos visuales de la barra de navegación, logo, opciones y buscador.

### `README.md`

Contiene la documentación de la biblioteca, sus propiedades, valores predeterminados y ejemplos de uso.

### `ejemplo/index.html`

Contiene un ejemplo de cómo un consumidor puede utilizar y configurar la biblioteca.

---

# Uso

La biblioteca puede utilizarse desde un proyecto externo cargando los archivos CSS y JavaScript.

## 1. Cargar la biblioteca

Primero se debe incluir el archivo CSS:

```html
<link rel="stylesheet" href="RUTA/menu.css">
```

Después se incluye el archivo JavaScript:

```html
<script src="RUTA/menu.js"></script>
```

La ruta dependerá de la ubicación desde donde el consumidor esté utilizando la biblioteca.

---

## 2. Crear el contenedor

La biblioteca necesita un elemento con el identificador:

```html
<div id="mi-menu"></div>
```

Dentro de este elemento se generará automáticamente la barra de navegación.

---

## 3. Configurar el menú

Después de cargar `menu.js`, se utiliza la función:

```javascript
crearMenu({
    // configuración
});
```

El consumidor es quien define los valores del menú.

---

# Configuración

## Identidad de la tienda

### `nombre`

Define el nombre que aparecerá en la barra.

```javascript
nombre: "Mi tienda"
```

**Valor predeterminado:**

```text
Mi Tienda
```

---

### `logo`

Permite agregar una imagen como logo.

```javascript
logo: "https://ejemplo.com/logo.png"
```

Si no se proporciona un logo, la biblioteca no muestra un elemento de imagen.

**Valor predeterminado:**

```text
""
```

---

### `alturaMenu`

Define la altura mínima de la barra.

```javascript
alturaMenu: 70
```

**Valor predeterminado:**

```text
70
```

---

### `tamanoLogo`

Define el tamaño del logo.

```javascript
tamanoLogo: 40
```

**Valor predeterminado:**

```text
40
```

El valor se utiliza tanto para el ancho como para el alto del logo.

---

### `tamanoNombre`

Define el tamaño del nombre de la tienda.

```javascript
tamanoNombre: 20
```

**Valor predeterminado:**

```text
20
```

---

### `tamanoOpciones`

Define el tamaño de las opciones de navegación.

```javascript
tamanoOpciones: 16
```

**Valor predeterminado:**

```text
16
```

---

# Colores

## `colorFondo`

Define el color de fondo de la barra.

```javascript
colorFondo: "#006633"
```

**Valor predeterminado:**

```text
#222222
```

---

## `colorTexto`

Define el color principal del texto.

```javascript
colorTexto: "#FFFFFF"
```

**Valor predeterminado:**

```text
#FFFFFF
```

---

## `colorHover`

Define el color utilizado cuando el cursor pasa sobre una opción del menú.

```javascript
colorHover: "#FF6600"
```

**Valor predeterminado:**

```text
#FF6600
```

---

# Opciones del menú

Las opciones se configuran mediante la propiedad:

```javascript
opciones
```

Cada opción contiene:

* `nombre`: texto mostrado.
* `ruta`: dirección a la que apunta el enlace.

Ejemplo:

```javascript
opciones: [

    {
        nombre: "Inicio",
        ruta: "/"
    },

    {
        nombre: "Productos",
        ruta: "/productos"
    },

    {
        nombre: "Ofertas",
        ruta: "/ofertas"
    },

    {
        nombre: "Contacto",
        ruta: "/contacto"
    }

]
```

El consumidor puede agregar, eliminar o modificar las opciones según las necesidades de su sitio.

---

# Barra de búsqueda

La biblioteca incluye una barra de búsqueda como elemento visual.

Actualmente **no realiza búsquedas reales** ni está conectada a una base de datos o servicio externo.

La responsabilidad de conectar una búsqueda real con los datos del proyecto corresponde al consumidor de la biblioteca.

---

## `mostrarBusqueda`

Permite mostrar u ocultar la barra de búsqueda.

Para mostrarla:

```javascript
mostrarBusqueda: true
```

Para ocultarla:

```javascript
mostrarBusqueda: false
```

**Valor predeterminado:**

```text
true
```

---

## `posicionBusqueda`

Permite determinar dónde aparecerá la barra de búsqueda.

Valores disponibles:

```text
"izquierda"
"centro"
"derecha"
```

Ejemplo:

```javascript
posicionBusqueda: "centro"
```

**Valor predeterminado:**

```text
"derecha"
```

---

## `textoBusqueda`

Define el texto mostrado como ayuda dentro del campo de búsqueda.

```javascript
textoBusqueda: "Buscar productos..."
```

**Valor predeterminado:**

```text
"Buscar..."
```

---

## `anchoBusqueda`

Define el ancho del campo de búsqueda.

```javascript
anchoBusqueda: 180
```

**Valor predeterminado:**

```text
180
```

---

# Tipografía

La biblioteca permite utilizar una fuente para todo el menú o configurar las fuentes individualmente.

---

## Modo de fuente única

La propiedad:

```javascript
fuenteUnica
```

determina el modo de configuración.

Por defecto:

```javascript
fuenteUnica: true
```

Cuando está activada, se utiliza la propiedad:

```javascript
fuente
```

Ejemplo:

```javascript
fuenteUnica: true,
fuente: "Arial, sans-serif"
```

Con esta configuración se utiliza la misma fuente para los elementos del menú.

---

## Modo de fuentes individuales

Para configurar cada elemento de manera independiente:

```javascript
fuenteUnica: false
```

En este modo se pueden configurar las fuentes individualmente.

---

### `fuenteNombre`

Define la fuente utilizada para el nombre de la tienda.

```javascript
fuenteNombre: "Georgia, serif"
```

---

### `fuenteOpciones`

Define la fuente utilizada para las opciones del menú.

```javascript
fuenteOpciones: "Verdana, sans-serif"
```

---

### `fuenteBusqueda`

Define la fuente utilizada para el contenido de la barra de búsqueda.

```javascript
fuenteBusqueda: "Courier New, monospace"
```

---

### Ejemplo de configuración individual

```javascript
fuenteUnica: false,

fuenteNombre: "Georgia, serif",

fuenteOpciones: "Verdana, sans-serif",

fuenteBusqueda: "Courier New, monospace"
```

---

# Valores predeterminados

Si una propiedad no se especifica, la biblioteca utiliza sus valores predeterminados.

| Propiedad          | Valor predeterminado  |
| ------------------ | --------------------- |
| `nombre`           | `"Mi Tienda"`         |
| `logo`             | `""`                  |
| `alturaMenu`       | `70`                  |
| `tamanoLogo`       | `40`                  |
| `tamanoNombre`     | `20`                  |
| `tamanoOpciones`   | `16`                  |
| `fuenteUnica`      | `true`                |
| `fuente`           | `"Arial, sans-serif"` |
| `fuenteNombre`     | `"Arial, sans-serif"` |
| `fuenteOpciones`   | `"Arial, sans-serif"` |
| `fuenteBusqueda`   | `"Arial, sans-serif"` |
| `colorFondo`       | `"#222222"`           |
| `colorTexto`       | `"#FFFFFF"`           |
| `colorHover`       | `"#FF6600"`           |
| `mostrarBusqueda`  | `true`                |
| `posicionBusqueda` | `"derecha"`           |
| `textoBusqueda`    | `"Buscar..."`         |
| `anchoBusqueda`    | `180`                 |

---

# Ejemplo completo

El siguiente ejemplo muestra una configuración que utiliza varias de las propiedades disponibles:

```html
<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Ejemplo - Biblioteca de Menú</title>

    <link
        rel="stylesheet"
        href="menu.css"
    >

</head>

<body>

    <div id="mi-menu"></div>

    <script src="menu.js"></script>

    <script>

        crearMenu({

            nombre: "Mi tienda",

            logo: "https://ejemplo.com/logo.png",

            alturaMenu: 70,

            tamanoLogo: 40,

            tamanoNombre: 20,

            tamanoOpciones: 16,

            fuenteUnica: true,

            fuente: "Arial, sans-serif",

            colorFondo: "#006633",

            colorTexto: "#FFFFFF",

            colorHover: "#FF6600",

            opciones: [

                {
                    nombre: "Inicio",
                    ruta: "/"
                },

                {
                    nombre: "Productos",
                    ruta: "/productos"
                },

                {
                    nombre: "Ofertas",
                    ruta: "/ofertas"
                },

                {
                    nombre: "Contacto",
                    ruta: "/contacto"
                }

            ],

            mostrarBusqueda: true,

            posicionBusqueda: "derecha",

            textoBusqueda: "Buscar...",

            anchoBusqueda: 180

        });

    </script>

</body>

</html>
```

---

# Configuración avanzada de tipografía

Para utilizar una fuente diferente en cada elemento:

```javascript
crearMenu({

    nombre: "Mi tienda",

    fuenteUnica: false,

    fuenteNombre: "Georgia, serif",

    fuenteOpciones: "Verdana, sans-serif",

    fuenteBusqueda: "Courier New, monospace"

});
```

Las demás propiedades pueden combinarse con esta configuración.

---

# Funcionamiento general

La biblioteca separa la responsabilidad entre JavaScript, CSS y el consumidor.

```text
                    CONSUMIDOR
                        │
                        │ configuración
                        ▼
                  crearMenu()
                        │
                        ▼
                  ┌───────────┐
                  │  menu.js  │
                  └───────────┘
                        │
                        │ genera elementos
                        ▼
                  ┌───────────┐
                  │  menu.css │
                  └───────────┘
                        │
                        ▼
                 BARRA DE MENÚ
```

El consumidor proporciona la configuración y la biblioteca genera la estructura visual del menú.

---

# Responsabilidades

### Biblioteca

La biblioteca se encarga de:

* Generar la estructura del menú.
* Aplicar los estilos.
* Mostrar el logo.
* Mostrar las opciones de navegación.
* Mostrar y configurar visualmente la barra de búsqueda.
* Aplicar las configuraciones proporcionadas por el consumidor.
* Utilizar valores predeterminados cuando una propiedad no es especificada.

### Consumidor

El consumidor se encarga de:

* Integrar la biblioteca en su proyecto.
* Proporcionar la configuración.
* Proporcionar los recursos externos, como el logo.
* Definir las rutas de navegación.
* Conectar la aplicación con sus propios datos y servicios cuando sea necesario.

La biblioteca no requiere conocer la estructura interna del proyecto consumidor.

---

# Estado actual del proyecto

La biblioteca está enfocada en la creación de una barra de navegación configurable y reutilizable.

Actualmente permite personalizar la identidad visual, estructura, colores, tamaños, tipografías, opciones de navegación y barra de búsqueda.

La barra de búsqueda funciona como **componente visual configurable**. La lógica para realizar búsquedas sobre productos, usuarios, bases de datos, APIs u otros datos externos no forma parte de la biblioteca y debe ser implementada por el consumidor según las necesidades de su proyecto.
