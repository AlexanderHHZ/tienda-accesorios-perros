import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { marked } from 'marked';

const integrationMarkdownPath = resolve(process.cwd(), 'docs', 'INTEGRATION.md');
const integrationCssPath = resolve(process.cwd(), 'dist', 'http', 'docs', 'integration.css');

/**
 * Construye la página de integración a partir de la documentación Markdown
 * mantenida en el repositorio, evitando duplicar el contenido en HTML.
 */
function renderIntegrationPage(content: string) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta
    name="description"
    content="Guía de integración de la API de Garantías y Devoluciones."
  >
  <title>Guía de integración | Garantías y Devoluciones</title>
  <link rel="stylesheet" href="/docs/integration.css">
</head>

<body class="min-h-screen bg-slate-50 text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div
      class="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8"
    >
      <div>
        <p class="text-sm font-semibold text-blue-700">API REST</p>
        <p class="text-lg font-bold tracking-tight text-slate-950">
          Garantías y Devoluciones
        </p>
      </div>

      <nav class="flex flex-wrap gap-3" aria-label="Documentación">
        <a
          href="/docs/"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Swagger
        </a>

        <a
          href="/docs/json"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          OpenAPI JSON
        </a>
      </nav>
    </div>
  </header>

  <main class="mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
    <section class="mb-10">
      <h1 class="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
        Guía de integración
      </h1>

      <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        Información para consumir la API mediante HTTP y JSON desde cualquier
        tecnología compatible.
      </p>
    </section>

    <article
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10
      [&_h1]:hidden
      [&_h2]:mt-12 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-950
      [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900
      [&_p]:mt-4 [&_p]:leading-7 [&_p]:text-slate-700
      [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-slate-700
      [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:text-slate-700
      [&_li]:leading-7
      [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4
      [&_strong]:font-semibold [&_strong]:text-slate-900
      [&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm
      [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-slate-900
      [&_td]:border [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-slate-700
      [&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-slate-100
      [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-slate-800
      [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100"
    >
      ${content}
    </article>
  </main>

  <footer class="border-t border-slate-200 bg-white">
    <div class="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500 lg:px-8">
      Garantías y Devoluciones · API académica
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Registra la guía y sus estilos como rutas auxiliares de documentación.
 * Se ocultan del contrato OpenAPI porque no forman parte de la API de negocio.
 */
export function registerIntegrationDocs(app: FastifyInstance) {
  app.get(
    '/docs/integration',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      try {
        const markdown = await readFile(integrationMarkdownPath, 'utf8');
        const content = marked.parse(markdown, { async: false });

        return reply
          .type('text/html; charset=utf-8')
          .send(renderIntegrationPage(content));
      } catch (error) {
        app.log.error({ err: error }, 'No se pudo cargar la guía de integración.');

        return reply
          .code(500)
          .type('text/plain; charset=utf-8')
          .send('No se pudo cargar la guía de integración.');
      }
    },
  );

  app.get(
    '/docs/integration.css',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      try {
        const css = await readFile(integrationCssPath, 'utf8');

        return reply
          .type('text/css; charset=utf-8')
          .send(css);
      } catch (error) {
        app.log.error({ err: error }, 'No se pudo cargar el CSS de la guía de integración.');

        return reply
          .code(500)
          .type('text/plain; charset=utf-8')
          .send('No se pudo cargar el CSS de la documentación.');
      }
    },
  );
}