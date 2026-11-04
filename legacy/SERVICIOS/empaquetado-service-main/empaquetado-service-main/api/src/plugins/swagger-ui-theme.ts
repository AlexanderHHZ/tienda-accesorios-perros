const swaggerUiIntegrationScript = `
(() => {
  const BUTTON_ID = 'integration-guide-link';

  const mountIntegrationButton = () => {
    if (document.getElementById(BUTTON_ID)) {
      return true;
    }

    const info = document.querySelector(
      '.swagger-ui .information-container .info'
    );

    if (!info) {
      return false;
    }

    const actions = document.createElement('div');
    actions.className = 'integration-guide-actions';

    const link = document.createElement('a');

    link.id = BUTTON_ID;
    link.className = 'integration-guide-link';
    link.href = '/docs/integration';
    link.textContent = 'Guía de integración';

    link.setAttribute(
      'aria-label',
      'Abrir guía de integración de Empaquetado Service API'
    );

    actions.appendChild(link);
    info.prepend(actions);

    return true;
  };

  if (mountIntegrationButton()) {
    return;
  }

  // Swagger UI renderiza parte de su interfaz dinámicamente.
  // El observer espera únicamente hasta que exista el bloque de información.
  const observer = new MutationObserver(() => {
    if (mountIntegrationButton()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
`;

const swaggerUiIntegrationStyles = `
.swagger-ui .information-container .info {
  position: relative;
}

.swagger-ui .integration-guide-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
}

.swagger-ui .integration-guide-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 40px;
  padding: 0 16px;

  border: 1px solid #64748b;
  border-radius: 6px;

  background: transparent;
  color: #e2e8f0;

  font-family: sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;

  text-decoration: none;

  cursor: pointer;

  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.swagger-ui .integration-guide-link:hover {
  border-color: #94a3b8;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  transform: translateY(-1px);
}

.swagger-ui .integration-guide-link:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .swagger-ui .information-container .info {
    display: flex;
    flex-direction: column;
  }

  .swagger-ui .integration-guide-actions {
    position: static;
    order: -1;
    margin-bottom: 20px;
  }

  .swagger-ui .integration-guide-link {
    width: 100%;
  }
}
`;

export const swaggerUiTheme = {
  js: [
    {
      filename: 'integration-guide.js',
      content: swaggerUiIntegrationScript,
    },
  ],
  css: [
    {
      filename: 'integration-guide.css',
      content: swaggerUiIntegrationStyles,
    },
  ],
};
