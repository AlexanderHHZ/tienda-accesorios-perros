import type { FastifyInstance } from 'fastify';

const integrationStyles = `
:root {
  color-scheme: light;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #172033;
  background: #f8fafc;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 28rem),
    #f8fafc;
}

a {
  color: inherit;
}

.page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 64px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 48px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: #ffffff;
  font-weight: 800;
}

.brand-copy strong {
  display: block;
  font-size: 15px;
}

.brand-copy span {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 13px;
}

.swagger-link {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #172033;
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;
}

.swagger-link:hover {
  border-color: #94a3b8;
  background: #f8fafc;
  transform: translateY(-1px);
}

.hero {
  max-width: 780px;
  margin-bottom: 48px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 58px);
  line-height: 1.04;
  letter-spacing: -0.04em;
}

.hero p {
  margin: 20px 0 0;
  max-width: 720px;
  color: #64748b;
  font-size: 17px;
  line-height: 1.75;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.meta-card {
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
}

.meta-label {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.meta-value {
  overflow-wrap: anywhere;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  font-weight: 650;
}

.section {
  margin-top: 56px;
}

.section-heading {
  margin-bottom: 22px;
}

.section-heading h2 {
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.language-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
}

.language-tab {
  flex: 0 0 auto;
  padding: 9px 14px;
  border: 1px solid #dbe4f0;
  border-radius: 9px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.language-tab[aria-selected="true"] {
  border-color: #172033;
  background: #172033;
  color: #ffffff;
}

.code-panel {
  display: none;
  margin-top: 10px;
}

.code-panel.is-active {
  display: block;
}

.code-shell {
  overflow: hidden;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #0f172a;
}

.code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #243247;
  color: #94a3b8;
  font-size: 12px;
}

.copy-button {
  border: 0;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
}

.copy-button:hover {
  color: #ffffff;
}

pre {
  margin: 0;
  overflow-x: auto;
  padding: 20px;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  line-height: 1.7;
}

pre code {
  color: #e2e8f0;
}

.rules {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rules li {
  position: relative;
  padding: 18px 18px 18px 48px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  line-height: 1.65;
}

.rules li::before {
  content: attr(data-number);
  position: absolute;
  top: 17px;
  left: 17px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
}

.inline-code {
  padding: 2px 6px;
  border-radius: 5px;
  background: #eef2f7;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.9em;
}

.footer {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 700px) {
  .page {
    width: min(100% - 24px, 1120px);
    padding-top: 24px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 36px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .hero p {
    font-size: 15px;
  }
}
`;

const integrationScript = `
const tabs = document.querySelectorAll('[data-language-tab]');
const panels = document.querySelectorAll('[data-language-panel]');

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const language = tab.getAttribute('data-language-tab');

    for (const currentTab of tabs) {
      currentTab.setAttribute(
        'aria-selected',
        currentTab === tab ? 'true' : 'false'
      );
    }

    for (const panel of panels) {
      panel.classList.toggle(
        'is-active',
        panel.getAttribute('data-language-panel') === language
      );
    }
  });
}

for (const button of document.querySelectorAll('[data-copy-target]')) {
  button.addEventListener('click', async () => {
    const targetId = button.getAttribute('data-copy-target');
    const code = document.getElementById(targetId);

    if (!code) return;

    const originalText = button.textContent;

    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
      button.textContent = 'Copiado';
    } catch {
      button.textContent = 'No se pudo copiar';
    }

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1600);
  });
}
`;

const integrationPage = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />
  <meta
    name="description"
    content="Guía para consumir Empaquetado Service API desde diferentes lenguajes."
  />
  <title>Guía de integración | Empaquetado Service API</title>
  <link
    rel="stylesheet"
    href="/docs/integration/styles.css"
  />
</head>

<body>
  <main class="page">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">E</div>

        <div class="brand-copy">
          <strong>Empaquetado Service API</strong>
          <span>Documentación para desarrolladores</span>
        </div>
      </div>

      <a
        class="swagger-link"
        href="/docs"
      >
        Volver a Swagger
      </a>
    </header>

    <section class="hero">
      <p class="eyebrow">Guía de integración</p>

      <h1>Conecta cualquier cliente mediante HTTP y JSON.</h1>

      <p>
        Empaquetado Service es una API REST independiente del frontend.
        Puede consumirse desde aplicaciones web, servicios backend,
        aplicaciones móviles o cualquier lenguaje con soporte para
        solicitudes HTTP.
      </p>
    </section>

    <section class="meta-grid" aria-label="Información de conexión">
      <article class="meta-card">
        <div class="meta-label">URL base</div>
        <div class="meta-value">
          http://localhost:4000/api/v1
        </div>
      </article>

      <article class="meta-card">
        <div class="meta-label">Formato</div>
        <div class="meta-value">
          Content-Type: application/json
        </div>
      </article>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Ejemplos de integración</h2>
        <p>
          Todos los ejemplos crean un empaquetado mediante
          <span class="inline-code">POST /empaquetados</span>.
        </p>
      </div>

      <div
        class="language-tabs"
        role="tablist"
        aria-label="Lenguajes"
      >
        <button
          class="language-tab"
          type="button"
          role="tab"
          aria-selected="true"
          data-language-tab="javascript"
        >
          JavaScript / TypeScript
        </button>

        <button
          class="language-tab"
          type="button"
          role="tab"
          aria-selected="false"
          data-language-tab="python"
        >
          Python
        </button>

        <button
          class="language-tab"
          type="button"
          role="tab"
          aria-selected="false"
          data-language-tab="java"
        >
          Java
        </button>

        <button
          class="language-tab"
          type="button"
          role="tab"
          aria-selected="false"
          data-language-tab="csharp"
        >
          C#
        </button>
      </div>

      <div
        class="code-panel is-active"
        data-language-panel="javascript"
      >
        <div class="code-shell">
          <div class="code-toolbar">
            <span>JavaScript / TypeScript</span>
            <button
              class="copy-button"
              type="button"
              data-copy-target="code-javascript"
            >
              Copiar
            </button>
          </div>

          <pre><code id="code-javascript">const base = process.env.EMPAQUETADO_API_URL;

if (!base) {
  throw new Error('Configura EMPAQUETADO_API_URL.');
}

const response = await fetch(\`\${base}/empaquetados\`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    peso: 4.5,
    tamano: 'mediano',
    medidas: {
      largo: 40,
      ancho: 30,
      alto: 20,
    },
    tipoEmpacado: 'caja',
  }),
});

const result = await response.json();

if (!response.ok) {
  throw new Error(result.error.message);
}

console.log(result.data);</code></pre>
        </div>
      </div>

      <div
        class="code-panel"
        data-language-panel="python"
      >
        <div class="code-shell">
          <div class="code-toolbar">
            <span>Python 3</span>
            <button
              class="copy-button"
              type="button"
              data-copy-target="code-python"
            >
              Copiar
            </button>
          </div>

          <pre><code id="code-python">import json
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError

base = os.environ["EMPAQUETADO_API_URL"].rstrip("/")

payload = {
    "peso": 4.5,
    "tamano": "mediano",
    "medidas": {
        "largo": 40,
        "ancho": 30,
        "alto": 20
    },
    "tipoEmpacado": "caja",
}

request = Request(
    f"{base}/empaquetados",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    method="POST",
)

try:
    with urlopen(request, timeout=10) as response:
        print(json.load(response)["data"])
except HTTPError as error:
    print(
        error.code,
        json.load(error)["error"]["message"]
    )</code></pre>
        </div>
      </div>

      <div
        class="code-panel"
        data-language-panel="java"
      >
        <div class="code-shell">
          <div class="code-toolbar">
            <span>Java 17+</span>
            <button
              class="copy-button"
              type="button"
              data-copy-target="code-java"
            >
              Copiar
            </button>
          </div>

          <pre><code id="code-java">import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class CrearEmpaquetado {
    public static void main(String[] args)
        throws Exception {

        String base =
            System.getenv("EMPAQUETADO_API_URL");

        if (base == null || base.isBlank()) {
            throw new IllegalStateException(
                "Configura EMPAQUETADO_API_URL."
            );
        }

        String payload = """
            {
              "peso": 4.5,
              "tamano": "mediano",
              "medidas": {
                "largo": 40,
                "ancho": 30,
                "alto": 20
              },
              "tipoEmpacado": "caja"
            }
            """;

        HttpRequest request =
            HttpRequest.newBuilder()
                .uri(
                    URI.create(
                        base + "/empaquetados"
                    )
                )
                .timeout(Duration.ofSeconds(10))
                .header(
                    "Content-Type",
                    "application/json"
                )
                .POST(
                    HttpRequest.BodyPublishers
                        .ofString(payload)
                )
                .build();

        HttpResponse&lt;String&gt; response =
            HttpClient.newHttpClient().send(
                request,
                HttpResponse.BodyHandlers.ofString()
            );

        System.out.println(response.body());
    }
}</code></pre>
        </div>
      </div>

      <div
        class="code-panel"
        data-language-panel="csharp"
      >
        <div class="code-shell">
          <div class="code-toolbar">
            <span>C# / .NET 8+</span>
            <button
              class="copy-button"
              type="button"
              data-copy-target="code-csharp"
            >
              Copiar
            </button>
          </div>

          <pre><code id="code-csharp">using System.Net.Http.Json;

var baseUrl =
    Environment.GetEnvironmentVariable(
        "EMPAQUETADO_API_URL"
    )
    ?? throw new InvalidOperationException(
        "Configura EMPAQUETADO_API_URL."
    );

using var client = new HttpClient {
    Timeout = TimeSpan.FromSeconds(10)
};

using var response =
    await client.PostAsJsonAsync(
        $"{baseUrl}/empaquetados",
        new {
            peso = 4.5,
            tamano = "mediano",
            medidas = new {
                largo = 40,
                ancho = 30,
                alto = 20
            },
            tipoEmpacado = "caja"
        }
    );

var json =
    await response.Content.ReadAsStringAsync();

if (!response.IsSuccessStatusCode) {
    throw new HttpRequestException(
        $"{(int)response.StatusCode}: {json}"
    );
}

Console.WriteLine(json);</code></pre>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Reglas para cualquier cliente</h2>
        <p>
          Estas reglas forman parte del contrato de integración de la API.
        </p>
      </div>

      <ol class="rules">
        <li data-number="1">
          Envía peso y dimensiones como números JSON, no como strings.
        </li>

        <li data-number="2">
          Para un registro individual consulta
          <span class="inline-code">data</span>. Las colecciones pueden
          incluir <span class="inline-code">data</span> y
          <span class="inline-code">meta</span>.
        </li>

        <li data-number="3">
          Comprueba siempre el código HTTP. Los errores incluyen
          <span class="inline-code">success: false</span> y
          <span class="inline-code">error</span>.
        </li>

        <li data-number="4">
          Un DELETE exitoso responde con
          <span class="inline-code">204 No Content</span>; no intentes
          interpretar un cuerpo JSON.
        </li>

        <li data-number="5">
          PATCH permite enviar únicamente los campos que necesites
          modificar.
        </li>

        <li data-number="6">
          Para control de concurrencia puedes conservar
          <span class="inline-code">updatedAt</span> y enviarlo mediante
          <span class="inline-code">X-Expected-Updated-At</span>.
        </li>

        <li data-number="7">
          Ante una respuesta
          <span class="inline-code">409 Conflict</span>, vuelve a consultar
          el recurso antes de reintentar la modificación.
        </li>

        <li data-number="8">
          No reintentes automáticamente un POST después de un timeout,
          porque el recurso pudo haberse creado aunque la respuesta no
          llegara al cliente.
        </li>
      </ol>
    </section>

    <footer class="footer">
      Empaquetado Service API · OpenAPI 3.0.3
    </footer>
  </main>

  <script src="/docs/integration/app.js"></script>
</body>
</html>`;

export async function registerIntegrationDocs(
  app: FastifyInstance,
): Promise<void> {
  // Los assets se sirven desde la propia API para respetar la política CSP
  // de Helmet y evitar dependencias externas para esta documentación.
  app.get(
    '/docs/integration',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      return reply
        .type('text/html; charset=utf-8')
        .send(integrationPage);
    },
  );

  app.get(
    '/docs/integration/styles.css',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      return reply
        .type('text/css; charset=utf-8')
        .send(integrationStyles);
    },
  );

  app.get(
    '/docs/integration/app.js',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      return reply
        .type('application/javascript; charset=utf-8')
        .send(integrationScript);
    },
  );
}
