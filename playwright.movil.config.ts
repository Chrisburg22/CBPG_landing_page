import { defineConfig, devices } from '@playwright/test';
import { config as cargarEnv } from 'dotenv';

cargarEnv();

const PUERTO = 4331;

/**
 * Auditoría del panel en anchos de teléfono, que es donde lo usa la doctora.
 *
 * No forma parte de `pnpm test`: los hallazgos se anotan en vez de fallar, así
 * que la corrida termina entera y el informe sale de datos. Lo que sí falla es
 * lo que sería una regresión (un 500, un guardado que no guarda).
 *
 * Dos teléfonos: un iPhone de 390 px y un Android chico de 360 px, que es donde
 * primero se rompen las filas de botones y las tablas.
 */
export default defineConfig({
  testDir: './e2e/movil',
  testMatch: 'auditoria-*.spec.ts',
  globalSetup: './e2e/movil/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  outputDir: './test-results/movil',
  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
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
      },
    },
    {
      name: 'movil-chico',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 740 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: `pnpm astro dev --port ${PUERTO} --ignore-lock`,
    env: {
      ASTRO_DEV_BACKGROUND: '0',
      ASTRO_DEV_TOOLBAR: '0',
      // Sin credenciales de Google: la integración está conectada a un
      // calendario real, y una cita creada desde la interfaz se copiaría ahí.
      // La limpieza borra la fila en Supabase, no el evento en Google.
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
