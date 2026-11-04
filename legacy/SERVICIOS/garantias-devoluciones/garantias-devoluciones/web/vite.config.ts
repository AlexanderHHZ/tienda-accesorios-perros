import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'API_');
  const target = environment.API_PROXY_TARGET || 'http://127.0.0.1:3000';
  // El navegador usa su propio origen; Vite reenvía las peticiones al backend.
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/docs': { target, changeOrigin: true },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy },
  };
});
