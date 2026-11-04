# Componente Footer (`<app-footer>`)

Componente Web autónomo, dinámico y desacoplado para pie de página, desarrollado bajo los principios de la **Arquitectura Orientada a Servicios (SOA)** y la arquitectura de **Microfrontends**. Utiliza el estándar nativo de **Web Components (Custom Elements API y Shadow DOM v1)**.

---

## 🚀 Guía de Inicio Rápido (3 Pasos)

Sigue estos pasos para integrar el pie de página en cualquier proyecto web en menos de 2 minutos:

### 1. Copia el archivo del componente
Asegúrate de colocar el archivo `app-footer.js` en el directorio de tu proyecto.

### 2. Importa el script en tu HTML
Agrega la siguiente línea en tu archivo `index.html` (de preferencia antes de cerrar `</body>` o con el atributo `defer` en el `<head>`):

```html
<script src="app-footer.js" defer></script>
```

### 3. Pega la etiqueta en tu código
Inserta la etiqueta personalizada `<app-footer>` donde necesites el pie de página y personalízala mediante sus atributos:

```html
<app-footer 
  company="Calvin Klein"
  logo-url="[https://upload.wikimedia.org/wikipedia/commons/e/e2/Calvin_klein_logo.svg](https://upload.wikimedia.org/wikipedia/commons/e/e2/Calvin_klein_logo.svg)"
  bg-color="#ffffff"
  text-color="#000000"
  facebook="[https://facebook.com](https://facebook.com)"
  instagram="[https://instagram.com](https://instagram.com)"
  x-twitter="[https://x.com](https://x.com)"
  youtube="[https://youtube.com](https://youtube.com)">

  <!-- Enlaces inyectados dinámicamente -->
  <a slot="servicio-cliente" href="/faqs">Preguntas Frecuentes</a>
  <a slot="servicio-cliente" href="/devoluciones">Devoluciones</a>

  <a slot="acerca-de" href="/privacidad">Aviso de Privacidad</a>
  <a slot="acerca-de" href="/terminos">Términos y Condiciones</a>

  <a slot="contacto" href="mailto:soporte@tienda.com">Escríbenos</a>
  <a slot="contacto" href="tel:5541614842">Atención: 55 4161 4842</a>
</app-footer>
```

---

## 📋 Contrato de Interfaz (Service Contract)

Siguiendo los principios de SOA, toda la configuración del componente se realiza mediante su interfaz pública (atributos HTML y slots), sin necesidad de modificar el código fuente JavaScript.

### Parámetros de Entrada (Atributos HTML)

| Atributo | Tipo | Requerido | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `company` | String | No | `'Calvin Klein'` | Nombre de la empresa o entidad legal. |
| `year` | String/Number | No | Año actual | Año para el copyright. |
| `logo-url` | String (URL) | No | `''` | Enlace a la imagen del logotipo. Si se omite, el área de logo no se dibuja. |
| `bg-color` | String (HEX/RGB) | No | `'#ffffff'` | Color de fondo del contenedor. |
| `text-color` | String (HEX/RGB) | No | `'#000000'` | Color del texto, enlaces e íconos SVG. |
| `font-family` | String | No | `'Arial, sans-serif'` | Familia tipográfica asignada. |
| `facebook` | String (URL) | No | `'#'` | URL del perfil de Facebook. |
| `instagram` | String (URL) | No | `'#'` | URL del perfil de Instagram. |
| `x-twitter` | String (URL) | No | `'#'` | URL del perfil de X (Twitter). |
| `youtube` | String (URL) | No | `'#'` | URL del canal de YouTube. |

### Puntos de Inyección Dinámica (Slots API)

Permiten inyectar enlaces de navegación desde el documento principal hacia columnas específicas dentro del pie de página:

| Nombre del Slot | Descripción |
| :--- | :--- |
| `servicio-cliente` | Enlaces destinados a la columna "Servicio al cliente". |
| `acerca-de` | Enlaces destinados a la columna "Acerca de". |
| `contacto` | Enlaces o información destinada a la columna "Contacto". |

---

## 🎨 Ejemplos de Personalización

### Modo Oscuro (Dark Mode)
```html
<app-footer 
  company="Mi Empresa Tech"
  bg-color="#121212"
  text-color="#ffffff"
  facebook="[https://facebook.com/miempresa](https://facebook.com/miempresa)"
  x-twitter="[https://x.com/miempresa](https://x.com/miempresa)">

  <a slot="servicio-cliente" href="/soporte">Soporte Técnico</a>
  <a slot="acerca-de" href="/nosotros">Nosotros</a>
  <a slot="contacto" href="mailto:contacto@miempresa.com">Contacto</a>
</app-footer>
```

---

## 🛠️ Características Técnicas y Arquitectura SOA

- **Encapsulamiento (Shadow DOM):** Los estilos CSS y la estructura HTML están aislados dentro de una raíz privada (`mode: 'open'`). Nada de lo que haya fuera afectará al footer, ni el footer afectará al resto de la página.
- **Autonomía Vectorial:** Los íconos de redes sociales están embebidos en el componente mediante **SVG Inline** con la propiedad `fill="currentColor"`, lo que evita realizar peticiones HTTP adicionales a librerías externas como FontAwesome.
- **Diseño Responsivo Autónomo:** La maquetación utiliza **CSS Grid** (`auto-fit`), por lo que el componente ajusta sus columnas automáticamente según el ancho de la pantalla (móviles o escritorio) sin requerir frameworks externos.
- **Interoperabilidad:** Al basarse en el estándar W3C Web Components, es 100% compatible con HTML5 nativo, React, Angular, Vue, PHP, ASP.NET, entre otros.