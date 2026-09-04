import { defineConfig, devices } from '@playwright/test';
import { config as cargarEnv } from 'dotenv';

// Las pruebas hablan con el Supabase real, así que necesitan el mismo .env que
// la aplicación. No hay proyecto de pruebas aparte: el plan free no da branching.
cargarEnv();

/**
 * Puerto propio y fijo. `astro dev` salta de puerto cuando el 4321 está ocupado,
 * y con varias sesiones de trabajo abiertas eso pasa a menudo: las pruebas
 * acabarían apuntando al servidor de otra rama.
 */
const PUERTO = 4329;
export const BASE_URL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // En serie a propósito: todas las pruebas comparten una base de datos real y
  // el listado del panel cuenta filas. En paralelo se pisarían.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Sin reintentos ni en CI: el rate limit de /api/contact es por IP y en
  // memoria, así que un reintento gastaría cuota y volvería a fallar por 429.
  // Un fallo aquí es un fallo, no ruido que se arregle repitiendo.
  retries: 0,
  reporter: process.env.CI ? 'list' : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // `--ignore-lock`: no toca el archivo de bloqueo de Astro, así que este
    // servidor de pruebas y el `astro dev` normal conviven, y un `astro dev
    // stop` en otra terminal no se lleva este por delante.
    command: `pnpm astro dev --port ${PUERTO} --ignore-lock`,
    env: {
      // Astro 7 detecta que corre bajo un agente de IA y demoniza el servidor
      // solo: el proceso en primer plano termina y Playwright cree que murió
      // ("Process from config.webServer exited early"), además de dejar
      // servidores huérfanos. Definir esta variable apaga esa autodetección y
      // deja el servidor en primer plano, que es lo que Playwright necesita
      // para poder pararlo al terminar.
      ASTRO_DEV_BACKGROUND: '0',
    },
    url: BASE_URL,
    // Nunca reutilizar: el limitador por IP de /api/contact vive en memoria del
    // proceso y su ventana es de 10 minutos. Reutilizando el servidor, la cuota
    // gastada por una corrida hace fallar la siguiente. Un proceso nuevo por
    // corrida es lo que hace la suite determinista.
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
