// Entrypoint para una herramienta de preview que proporciona PORT.
process.env.WEB_PORT=process.env.PORT||'3000';
process.env.WEB_HOST='0.0.0.0';
await import('./start.mjs');
