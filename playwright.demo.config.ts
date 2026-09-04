import { defineConfig, devices } from '@playwright/test';
import { config as cargarEnv } from 'dotenv';

cargarEnv();

// Puerto propio, distinto al de la suite, para poder grabar sin interferir.
const PUERTO = 4330;

/**
 * Config aparte solo para grabar el recorrido en vídeo. La suite normal no
 * graba: sería lento y produciría archivos enormes en cada corrida.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'demo.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  workers: 1,
  retries: 0,
  timeout: 180_000,
  outputDir: './demo-video',
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 1280, height: 800 },
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    // Cada acción va despacio para que el vídeo se pueda seguir con la vista.
    launchOptions: { slowMo: 450 },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: `pnpm astro dev --port ${PUERTO} --ignore-lock`,
    env: { ASTRO_DEV_BACKGROUND: '0' },
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
