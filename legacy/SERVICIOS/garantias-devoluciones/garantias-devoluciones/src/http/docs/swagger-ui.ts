import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

const integrationGuideScript = `
(() => {
  const linkId = 'integration-guide-link';

  const addIntegrationGuideLink = () => {
    if (document.getElementById(linkId)) {
      return true;
    }

    const topbar = document.querySelector(
      '.swagger-ui .topbar .topbar-wrapper',
    );

    if (!topbar) {
      return false;
    }

    const link = document.createElement('a');

    link.id = linkId;
    link.className = 'integration-guide-link';
    link.href = '/docs/integration';
    link.textContent = 'Guía de integración';
    link.setAttribute('aria-label', 'Abrir guía de integración');

    topbar.appendChild(link);

    return true;
  };

  if (addIntegrationGuideLink()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (addIntegrationGuideLink()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => observer.disconnect(), 10000);
})();
`;

const integrationGuideStyles = `
.swagger-ui .topbar .topbar-wrapper a.integration-guide-link {
  flex: 0 0 auto;
  width: auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid #1f7a3d;
  border-radius: 8px;
  background-color: #1f7a3d;
  color: #ffffff;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.swagger-ui .topbar .topbar-wrapper a.integration-guide-link:hover {
  border-color: #176532;
  background-color: #176532;
  color: #ffffff;
  text-decoration: none;
}

.swagger-ui .topbar .topbar-wrapper a.integration-guide-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(31, 122, 61, 0.35);
}

@media (max-width: 640px) {
  .swagger-ui .topbar .topbar-wrapper a.integration-guide-link {
    min-height: 34px;
    padding: 0 12px;
    font-size: 12px;
  }
}
`;

/**
 * Centraliza la configuración visual de Swagger para mantenerla separada
 * del punto de composición principal de la aplicación.
 */
export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  staticCSP: true,
  transformStaticCSP: (header) =>
    header.replace(/style-src[^;]*;/u, "style-src 'self' 'unsafe-inline';"),
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  theme: {
    title: 'Garantías y Devoluciones | Swagger',
    js: [
      {
        filename: 'integration-guide.js',
        content: integrationGuideScript,
      },
    ],
    css: [
      {
        filename: 'integration-guide.css',
        content: integrationGuideStyles,
      },
    ],
  },
};
