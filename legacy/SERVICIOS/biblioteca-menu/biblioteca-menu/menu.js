// =====================================================
// BIBLIOTECA DE MENÚ
// =====================================================


// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

function crearMenu(configuracion) {

    // -------------------------------------------------
    // VALIDAR CONFIGURACIÓN
    // -------------------------------------------------

    // Verifica que el consumidor haya enviado una configuración.
    if (!configuracion) {

        console.error(
            "No se recibió una configuración para el menú."
        );

        return;
    }


    // -------------------------------------------------
    // IDENTIDAD Y TAMAÑOS
    // -------------------------------------------------

    // Nombre de la tienda mostrado en el menú.
    const nombre = configuracion.nombre || "Mi Tienda";

    // URL de la imagen utilizada como logo.
    const logo = configuracion.logo || "";

    // Altura mínima del menú.
    const alturaMenu = configuracion.alturaMenu || 70;

    // Tamaño del logo.
    const tamanoLogo = configuracion.tamanoLogo || 40;

    // Tamaño del nombre de la tienda.
    const tamanoNombre = configuracion.tamanoNombre || 20;

    // Tamaño de las opciones del menú.
    const tamanoOpciones = configuracion.tamanoOpciones || 16;


    // -------------------------------------------------
    // CONFIGURACIÓN DE TIPOGRAFÍA
    // -------------------------------------------------

    // Determina si se utilizará una única fuente para todo el menú.
    const fuenteUnica = configuracion.fuenteUnica !== false;

    // Fuente utilizada cuando fuenteUnica está activa.
    const fuente = configuracion.fuente || "Arial, sans-serif";

    // Fuente individual para el nombre de la tienda.
    const fuenteNombre =
        configuracion.fuenteNombre || "Arial, sans-serif";

    // Fuente individual para las opciones del menú.
    const fuenteOpciones =
        configuracion.fuenteOpciones || "Arial, sans-serif";

    // Fuente individual para el buscador.
    const fuenteBusqueda =
        configuracion.fuenteBusqueda || "Arial, sans-serif";


    // -------------------------------------------------
    // COLORES
    // -------------------------------------------------

    // Color de fondo de la barra del menú.
    const colorFondo =
        configuracion.colorFondo || "#222222";

    // Color principal del texto.
    const colorTexto =
        configuracion.colorTexto || "#FFFFFF";

    // Color utilizado al pasar el mouse sobre las opciones.
    const colorHover =
        configuracion.colorHover || "#FF6600";


    // -------------------------------------------------
    // OPCIONES DEL MENÚ
    // -------------------------------------------------

    // Obtiene las opciones configuradas por el consumidor.
    const opcionesConfiguradas =
        configuracion.opciones || [];


    // -------------------------------------------------
    // CONFIGURACIÓN DEL BUSCADOR
    // -------------------------------------------------

    // Determina si se mostrará el buscador.
    const mostrarBusqueda =
        configuracion.mostrarBusqueda !== false;

    // Determina la posición del buscador.
    const posicionBusqueda =
        configuracion.posicionBusqueda || "derecha";

    // Texto mostrado dentro del campo de búsqueda.
    const textoBusqueda =
        configuracion.textoBusqueda || "Buscar...";

    // Ancho del campo de búsqueda.
    const anchoBusqueda =
        configuracion.anchoBusqueda || 180;


    // -------------------------------------------------
    // BUSCAR CONTENEDOR
    // -------------------------------------------------

    // Busca el elemento donde se insertará el menú.
    const contenedor =
        document.getElementById("mi-menu");


    // Verifica que el contenedor exista.
    if (!contenedor) {

        console.error(
            "No se encontró el elemento #mi-menu."
        );

        return;
    }


    // -------------------------------------------------
    // CREAR BARRA DEL MENÚ
    // -------------------------------------------------

    // Crea el elemento principal del menú.
    const menu =
        document.createElement("nav");

    // Asigna la clase principal utilizada por el CSS.
    menu.classList.add("menu");


    // -------------------------------------------------
    // APLICAR FUENTE ÚNICA
    // -------------------------------------------------

    // Si está activada la fuente única,
    // se aplica al menú completo.
    if (fuenteUnica) {

        menu.style.fontFamily =
            fuente;
    }


    // -------------------------------------------------
    // APLICAR ALTURA
    // -------------------------------------------------

    // Establece la altura mínima configurada.
    menu.style.minHeight =
        `${alturaMenu}px`;


    // -------------------------------------------------
    // APLICAR POSICIÓN DEL BUSCADOR
    // -------------------------------------------------

    // Agrega una clase que permite al CSS
    // determinar la posición del buscador.
    menu.classList.add(
        `busqueda-${posicionBusqueda}`
    );


    // -------------------------------------------------
    // APLICAR COLOR DE FONDO
    // -------------------------------------------------

    // Aplica el color de fondo configurado.
    menu.style.backgroundColor =
        colorFondo;


    // -------------------------------------------------
    // CREAR LOGO
    // -------------------------------------------------

    // Inicialmente no existe ningún elemento de logo.
    let elementoLogo = null;


    // Si el consumidor proporcionó un logo,
    // se crea el elemento correspondiente.
    if (logo !== "") {

        elementoLogo =
            document.createElement("img");

        // Asigna la URL de la imagen.
        elementoLogo.src =
            logo;

        // Asigna la clase utilizada por el CSS.
        elementoLogo.classList.add(
            "logo-tienda"
        );

        // Aplica el ancho configurado.
        elementoLogo.style.width =
            `${tamanoLogo}px`;

        // Aplica el alto configurado.
        elementoLogo.style.height =
            `${tamanoLogo}px`;

        // Define el texto alternativo de la imagen.
        elementoLogo.alt =
            `Logo de ${nombre}`;
    }


    // -------------------------------------------------
    // CREAR NOMBRE DE LA TIENDA
    // -------------------------------------------------

    // Crea el elemento que mostrará el nombre.
    const elementoNombre =
        document.createElement("div");


    // -------------------------------------------------
    // CONTENEDOR DE LOGO Y NOMBRE
    // -------------------------------------------------

    // Crea un contenedor para agrupar logo y nombre.
    const identidad =
        document.createElement("div");

    // Asigna la clase utilizada por el CSS.
    identidad.classList.add(
        "identidad-tienda"
    );


    // Agrega el logo solamente si existe.
    if (elementoLogo) {

        identidad.appendChild(
            elementoLogo
        );
    }


    // Agrega el nombre al contenedor de identidad.
    identidad.appendChild(
        elementoNombre
    );


    // Asigna la clase utilizada por el CSS.
    elementoNombre.classList.add(
        "nombre-tienda"
    );

    // Coloca el nombre configurado.
    elementoNombre.textContent =
        nombre;


    // -------------------------------------------------
    // APLICAR ESTILO AL NOMBRE
    // -------------------------------------------------

    // Aplica el color configurado.
    elementoNombre.style.color =
        colorTexto;

    // Aplica el tamaño configurado.
    elementoNombre.style.fontSize =
        `${tamanoNombre}px`;


    // -------------------------------------------------
    // FUENTE INDIVIDUAL DEL NOMBRE
    // -------------------------------------------------

    // Cuando se utiliza el modo individual,
    // aplica la fuente específica del nombre.
    if (!fuenteUnica) {

        elementoNombre.style.fontFamily =
            fuenteNombre;
    }


    // -------------------------------------------------
    // CREAR CONTENEDOR DE OPCIONES
    // -------------------------------------------------

    // Crea el contenedor que almacenará los enlaces.
    const opciones =
        document.createElement("div");

    // Asigna la clase utilizada por el CSS.
    opciones.classList.add(
        "opciones-menu"
    );


    // -------------------------------------------------
    // APLICAR COLORES A LAS OPCIONES
    // -------------------------------------------------

    // Define el color normal de los enlaces.
    opciones.style.setProperty(
        "--color-texto",
        colorTexto
    );

    // Define el color utilizado durante el hover.
    opciones.style.setProperty(
        "--color-hover",
        colorHover
    );


    // -------------------------------------------------
    // CREAR OPCIONES
    // -------------------------------------------------

    // Recorre todas las opciones configuradas.
    opcionesConfiguradas.forEach(opcion => {

        // Crea un enlace para cada opción.
        const enlace =
            document.createElement("a");


        // ---------------------------------------------
        // TAMAÑO DE LA OPCIÓN
        // ---------------------------------------------

        enlace.style.fontSize =
            `${tamanoOpciones}px`;


        // ---------------------------------------------
        // FUENTE INDIVIDUAL DE LA OPCIÓN
        // ---------------------------------------------

        // Aplica la fuente individual cuando
        // el modo de fuente única está desactivado.
        if (!fuenteUnica) {

            enlace.style.fontFamily =
                fuenteOpciones;
        }


        // ---------------------------------------------
        // DATOS DEL ENLACE
        // ---------------------------------------------

        // Define el texto visible.
        enlace.textContent =
            opcion.nombre;

        // Define la dirección de destino.
        enlace.href =
            opcion.ruta;


        // Agrega el enlace al contenedor.
        opciones.appendChild(
            enlace
        );
    });


    // -------------------------------------------------
    // CREAR BARRA DE BÚSQUEDA
    // -------------------------------------------------

    // Inicialmente no existe el buscador.
    let busqueda = null;


    // Crea el buscador solamente si está habilitado.
    if (mostrarBusqueda) {

        // Crea el contenedor del buscador.
        busqueda =
            document.createElement("div");

        // Asigna la clase utilizada por el CSS.
        busqueda.classList.add(
            "busqueda-menu"
        );


        // ---------------------------------------------
        // CAMPO DE BÚSQUEDA
        // ---------------------------------------------

        // Crea el campo de texto.
        const inputBusqueda =
            document.createElement("input");

        // Define el tipo de entrada.
        inputBusqueda.type =
            "text";

        // Define el texto de ayuda.
        inputBusqueda.placeholder =
            textoBusqueda;

        // Asigna la clase utilizada por el CSS.
        inputBusqueda.classList.add(
            "input-busqueda"
        );

        // Aplica el ancho configurado.
        inputBusqueda.style.width =
            `${anchoBusqueda}px`;


        // ---------------------------------------------
        // FUENTE INDIVIDUAL DEL BUSCADOR
        // ---------------------------------------------

        // Aplica la fuente individual cuando
        // el modo de fuente única está desactivado.
        if (!fuenteUnica) {

            inputBusqueda.style.fontFamily =
                fuenteBusqueda;
        }


        // ---------------------------------------------
        // BOTÓN DE BÚSQUEDA
        // ---------------------------------------------

        // Crea el botón de búsqueda.
        const botonBusqueda =
            document.createElement("button");

        // Define el tipo de botón.
        botonBusqueda.type =
            "button";

        // Coloca el icono de búsqueda.
        botonBusqueda.textContent =
            "🔍";

        // Asigna la clase utilizada por el CSS.
        botonBusqueda.classList.add(
            "boton-busqueda"
        );


        // ---------------------------------------------
        // FUENTE INDIVIDUAL DEL BOTÓN
        // ---------------------------------------------

        // Aplica la misma fuente del buscador al botón.
        if (!fuenteUnica) {

            botonBusqueda.style.fontFamily =
                fuenteBusqueda;
        }


        // ---------------------------------------------
        // ARMAR BARRA DE BÚSQUEDA
        // ---------------------------------------------

        // Agrega el campo de texto al buscador.
        busqueda.appendChild(
            inputBusqueda
        );

        // Agrega el botón al buscador.
        busqueda.appendChild(
            botonBusqueda
        );
    }


    // -------------------------------------------------
    // ARMAR EL MENÚ
    // -------------------------------------------------

    // Agrega la identidad de la tienda.
    menu.appendChild(
        identidad
    );

    // Agrega las opciones del menú.
    menu.appendChild(
        opciones
    );


    // Agrega el buscador solamente si está habilitado.
    if (mostrarBusqueda) {

        menu.appendChild(
            busqueda
        );
    }


    // -------------------------------------------------
    // INSERTAR MENÚ EN LA PÁGINA
    // -------------------------------------------------

    // Coloca el menú terminado dentro del contenedor.
    contenedor.appendChild(
        menu
    );
}