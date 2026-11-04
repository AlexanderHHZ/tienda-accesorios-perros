import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Permite usar un Chromium instalado por la infraestructura de CI.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'movil', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node scripts/e2e-api.mjs',
      url: 'http://127.0.0.1:4100/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -w web -- --port 3100',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      timeout: 90_000,
      env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4100/api/v1', NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
});
