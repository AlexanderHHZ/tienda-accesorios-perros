// 1. Definimos la clase del web component heredando de HTMLElement
class AppFooter extends HTMLElement {
    constructor() {
        super();
        // Creamos el shadow dom en modo open para aislar html y css (aislamiento SOA)
        this.attachShadow({ mode: 'open' });
    }

    // 2. Metodo de ciclo de vida: se ejecuta cuando la etiqueta entra al dom
    connectedCallback() {
        // Lectura del contrato de interfaz (datos de entrada)
        // Configuración estética y de marca
        const bg = this.getAttribute('bg-color') || '#ffffff';
        const textColor = this.getAttribute('text-color') || '#000000';
        const font = this.getAttribute('font-family') || 'Arial, Helvetica, sans-serif';
        const logoUrl = this.getAttribute('logo-url') || '';
        const company = this.getAttribute('company') || 'Mi empresa';
        const year = this.getAttribute('year') || new Date().getFullYear();

        // Enlaces de redes sociales
        const facebook = this.getAttribute('facebook') || '#';
        const instagram = this.getAttribute('instagram') || '#';
        const xTwitter = this.getAttribute('x-twitter') || '#';
        const youtube = this.getAttribute('youtube') || '#';

        

        // Renderizado del componente (datos de salida)
        this.shadowRoot.innerHTML = `
        <style>
            /* :host representa al contenedor principal (<app-footer>) */
            :host {
                display: block;
                width: 100%;
                background-color: ${bg};
                color: ${textColor};
                font-family: ${font};
                border-top: 1px solid #e5e5e5;
                box-sizing: border-box;
            }

            .footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 3rem, 1.5rem 2rem 1.5rem;
            }

            /* seccion superior: logo y columnas */
            .brand-header{
                margin-botom: 2.5rem;
            }

            .brand-logo {
                max-height: 40px;
                width: auto;
                object-fit: contain;
            }

            /* Maquetación Responsiva con CSS Grid */
            /* Genera columnas automáticas con un ancho mínimo de 200px */
            .columns-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }

            .column h4 {
                font-size: 0.95rem;
                font-weight: bold;
                margin-top: 0;
                margin-bottom: 1.2rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            
            /* slots para inyectar enlaces en cada columna */
            /* La pseudo-clase ::slotted aplica estilos a los elementos HTML (como enlaces <a>) 
           inyectados desde fuera a través de los Slots */
            ::slotted(a) {
                display: block;
                color: ${textColor};
                text-decoration: none;
                margin-bottom: 0.75rem;
                font-size: 0.85rem;
                opacity: 0.8;
                transition: opacity 0.2s  ease;
            }

            ::slotted(a:hover) {
                opacity: 1;
                text-decoration: underline;
            }

            /* seccion inferior: redes sociales y copyright*/
            .bottom-bar {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                padding-top: 1.5rem;
                border-top: 1px solid #eeeeee;
                gap: 1rem;
            }

            .social-links {
                display: flex;
                gap: 1.25rem;
                align-items: center;
            }

            .social-links a {
                color: ${textColor};
                text-decoration: none;
                font-size: 1.2rem;
                font-weight: bold;
                opacity: 0.85;
                transition: transform 0.2s ease, opacity 0.2s ease;_
            }

            .social-links a:hover {
                opacity: 1;
                transform: translateY(-2px);
            }

            .copyright {
                font-size: 0.8rem;
                opacity: 0.7;
            }

        </style>

        <footer class="footer-container">
            <!-- Logo de marca si se proporciona un atributo logo-url -->
            ${logoUrl ? `
                <div class="brand-header">
                    <img class="brand-logo" src="${logoUrl}" alt="${company}">
                </div>
            ` : ''}

            <!-- Secciones de Navegación Organizadas -->
            <div class="columns-grid">
                <div class="column">
                    <h4>Servicio al cliente</h4>
                    <slot name="servicio-cliente"></slot>
                </div>

                <div class="column">
                    <h4>Acerca de</h4>
                    <slot name="acerca-de"></slot>
                </div>

                <div class="column">
                    <h4>Contacto</h4>
                    <slot name="contacto"></slot>
                </div>
            </div>

            <!-- Barra Inferior (Redes Sociales y Derechos) -->
            <div class="bottom-bar">
                <div class="social-links">
                    ${facebook !== '#' ? `<a href="${facebook}" target="_blank" aria-label="Facebook">FB</a>` : ''}
                    ${instagram !== '#' ? `<a href="${instagram}" target="_blank" aria-label="Instagram">IG</a>` : ''}
                    ${xTwitter !== '#' ? `<a href="${xTwitter}" target="_blank" aria-label="X Twitter">X</a>` : ''}
                    ${youtube !== '#' ? `<a href="${youtube}" target="_blank" aria-label="YouTube">YT</a>` : ''}
                </div>

                <div class="copyright">
                    &copy; ${year} ${company}. Todos los derechos reservados.
                </div>
            </div>
            
        </footer>
        `;
    }
}

// 3. Registramos la etiqueta personalizada en el navegador
customElements.define('app-footer', AppFooter);