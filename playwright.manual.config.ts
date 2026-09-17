import { defineConfig, devices } from '@playwright/test';
import { config as cargarEnv } from 'dotenv';

cargarEnv();

const PUERTO = 4332;

/**
 * Videos del manual de uso: un recorrido por sección, a tamaño de teléfono.
 *
 * Van despacio (`slowMo`) y con rótulos, para que se entiendan sin narración.
 * `node scripts/videos-manual.mjs` los pasa después a mp4 con su nombre final.
 */
export default defineConfig({
  testDir: './e2e/movil',
  testMatch: 'manual-*.spec.ts',
  globalSetup: './e2e/movil/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  outputDir: './manual-video',
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    launchOptions: { slowMo: 350 },
  },

  projects: [
    {
      name: 'movil',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        video: { mode: 'on', size: { width: 780, height: 1688 } },
      },
    },
  ],

  webServer: {
    command: `pnpm astro dev --port ${PUERTO} --ignore-lock`,
    env: {
      ASTRO_DEV_BACKGROUND: '0',
      ASTRO_DEV_TOOLBAR: '0',
      // Ver playwright.movil.config.ts: nada de copiar citas a Google real.
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      GOOGLE_TOKEN_KEY: '',
    },
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: false,
    timeout: 90_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
