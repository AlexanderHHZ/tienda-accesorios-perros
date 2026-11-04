# `<tienda-header>` — Encabezado modular para tienda en línea

Componente de encabezado independiente, listo para usarse en **cualquier página o tienda**, sin importar el framework (o si no usas ninguno). Es un *Web Component* nativo con Shadow DOM: su estilo nunca se ve afectado por el CSS de la página donde lo pongas, y viceversa.

## Instalación

Copia `tienda-header.js` a tu proyecto e impórtalo con una sola línea:

```html
<script src="tienda-header.js"></script>
<tienda-header store-name="Mi Tienda"></tienda-header>
```

Eso es todo. No requiere build, npm, ni framework.

## Personalización por atributos

| Atributo       | Tipo / valores                          | Descripción                                                   |
|----------------|------------------------------------------|----------------------------------------------------------------|
| `store-name`   | texto                                    | Nombre mostrado junto al logo                                  |
| `logo-src`     | URL / data-URI                           | Imagen del logo (opcional)                                     |
| `logo-href`    | URL                                      | A dónde lleva el clic en el logo                                |
| `menu`         | JSON (ver abajo)                         | Estructura del menú de navegación, con submenús                |
| `show-search`  | `"true"` / `"false"`                     | Muestra u oculta la barra de búsqueda                           |
| `show-login`   | `"true"` / `"false"`                     | Muestra u oculta el botón de cuenta / iniciar sesión            |
| `show-cart`    | `"true"` / `"false"`                     | Muestra u oculta el ícono de carrito                            |
| `cart-count`   | número                                   | Número mostrado en la insignia del carrito                      |
| `user-name`    | texto                                    | Si está presente, el botón de login se convierte en "Hola, X"   |
| `sticky`       | atributo booleano (solo presencia)       | Fija el encabezado arriba al hacer scroll                       |

### Formato del atributo `menu`

```html
<tienda-header menu='[
  {"label":"Inicio","href":"/"},
  {"label":"Catálogo","children":[
    {"label":"Electrónica","href":"/cat/electronica"},
    {"label":"Ofertas","href":"/ofertas"}
  ]},
  {"label":"Contacto","href":"/contacto"}
]'></tienda-header>
```

También puedes fijar el menú por JavaScript (útil si tu app construye el menú dinámicamente):

```js
document.querySelector('tienda-header').setMenu([
  { label: 'Inicio', href: '/' },
  { label: 'Ofertas', href: '/ofertas' },
]);
```

## Personalización visual (variables CSS)

Todo el color, tipografía y tamaño se controla con variables CSS, sobrescribibles desde tu hoja de estilos o inline:

```html
<tienda-header
  style="
    --th-accent: #0f6b5c;   /* color de marca (botones, insignias) */
    --th-bg: #ffffff;       /* fondo del encabezado */
    --th-text: #14181f;     /* color de texto */
    --th-height: 80px;      /* alto del encabezado */
    --th-font: 'Poppins', sans-serif;
    --th-max-width: 1440px; /* ancho máximo del contenido interno */
  "
></tienda-header>
```

Variables completas: `--th-bg`, `--th-text`, `--th-muted`, `--th-accent`, `--th-accent-text`, `--th-border`, `--th-height`, `--th-font`, `--th-radius`, `--th-max-width`, `--th-padding-x`, `--th-z`.

## Personalización total (slots)

Si necesitas reemplazar una sección entera —por ejemplo, un logo con animación, o botones de acciones totalmente distintos— usa los slots `logo`, `nav` o `actions`, y el componente dejará de generar esa parte automáticamente:

```html
<tienda-header show-search="false">
  <a slot="logo" href="/"><img src="mi-logo-animado.svg" alt="Mi Tienda"></a>
  <a slot="actions" href="/favoritos">❤ Favoritos</a>
</tienda-header>
```

## Eventos

El componente **no decide nada por ti** (no navega, no abre modales): emite eventos para que tu código responda como prefieras.

| Evento           | `detail`                  | Cuándo se dispara                          |
|-------------------|----------------------------|---------------------------------------------|
| `header-search`   | `{ query }`                | El usuario busca (Enter o clic en la lupa)  |
| `cart-click`      | `{ count }`                | Clic en el ícono del carrito                |
| `login-click`     | `{ userName }`             | Clic en "Iniciar sesión" / avatar de usuario|
| `logo-click`      | `{}`                       | Clic en el logo                             |
| `menu-toggle`     | `{ open }`                 | Se abre/cierra el menú móvil (hamburguesa)  |

```js
const header = document.querySelector('tienda-header');
header.addEventListener('header-search', (e) => {
  window.location.href = `/buscar?q=${encodeURIComponent(e.detail.query)}`;
});
header.addEventListener('cart-click', () => abrirCarritoLateral());
header.addEventListener('login-click', () => abrirModalLogin());
```

## API en JavaScript

```js
const header = document.querySelector('tienda-header');

header.setCartCount(5);          // Actualiza la insignia del carrito
header.setUser({ name: 'María' }); // Cambia el botón a modo "sesión iniciada"
header.setUser(null);              // Vuelve al botón de "Iniciar sesión"
header.setMenu([...]);             // Reemplaza el menú por completo
```

## Responsivo

Por debajo de 860px de ancho, la búsqueda y el menú se colapsan en un botón de hamburguesa; el menú se despliega a pantalla completa. Este punto de quiebre está fijo en el CSS del componente (`@media (max-width: 860px)`); edítalo directamente en `tienda-header.js` si necesitas otro valor.

## Dónde encaja en tu proyecto

Este componente cubre el bloque **"26 – Encabezado"** de tu documento de módulos de la tienda. Se conecta de forma natural con:

- **Control de acceso** (login/roles): escucha `login-click` para abrir tu flujo de autenticación, y llama a `setUser()` cuando el login sea exitoso.
- **Ventas – Carrito**: escucha `cart-click` para abrir tu carrito, y llama a `setCartCount()` cada vez que cambie.
- **Inventario / búsqueda de catálogo**: escucha `header-search` para filtrar o redirigir a resultados.

Los módulos de **pie, botones, menú (lateral) y fondo** pueden construirse como componentes hermanos siguiendo el mismo patrón (Shadow DOM + atributos + eventos), si quieres que el sistema completo sea igual de plug-and-play.
