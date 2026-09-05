import { defineConfig, devices } from '@playwright/test';
import { config as cargarEnv } from 'dotenv';

cargarEnv();

// Puerto propio, distinto al de la suite, para poder grabar sin interferir.
const PUERTO = 4330;

/**
 * Config aparte para grabar el recorrido guiado, con `slowMo` para que se pueda
 * seguir con la vista.
 *
 * Tres proyectos, uno por tamaño de pantalla: el panel cambia de forma en 940 y
 * en 720 (barra lateral → raíl → barra de pestañas), y esa es justo la parte
 * que no se puede verificar leyendo el código. Salen tres vídeos por corrida.
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
    // Cada acción va despacio para que el vídeo se pueda seguir con la vista.
    launchOptions: { slowMo: 450 },
  },

  // Los tres tamaños de los artboards del diseño, para poder cotejarlos.
  projects: [
    {
      name: 'escritorio',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        video: { mode: 'on', size: { width: 1440, height: 900 } },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        video: { mode: 'on', size: { width: 768, height: 1024 } },
      },
    },
    {
      name: 'movil',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        video: { mode: 'on', size: { width: 390, height: 844 } },
      },
    },
  ],

  webServer: {
    command: `pnpm astro dev --port ${PUERTO} --ignore-lock`,
    env: { ASTRO_DEV_BACKGROUND: '0', ASTRO_DEV_TOOLBAR: '0' },
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
