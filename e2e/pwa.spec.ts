import { expect, test } from '@playwright/test';
import { entrarAlPanel, limpiar, nombreDePrueba, sembrarSolicitud } from './apoyo';

/**
 * El panel es instalable como app; la landing pública no.
 *
 * La prueba que de verdad importa aquí es «ningún dato de paciente acaba en
 * caché». El resto comprueba que la PWA funciona; esa comprueba que no filtra.
 * La Cache Storage vive en el disco del teléfono sin cifrar, es por origen y no
 * por usuaria, y sobrevive al cierre de sesión: un `cache.put()` de más en
 * public/panel-sw.js escribiría ahí el nombre y el teléfono de cada prospecta
 * que la doctora abriera. Nada en el servidor lo impediría, porque la Cache
 * Storage API ignora el `Cache-Control: no-store` del middleware.
 */
test.describe('PWA del panel', () => {
  /** Espera a que el worker controle la página. Posible gracias a clients.claim(). */
  async function esperarControl(page: import('@playwright/test').Page) {
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, {
      timeout: 15_000,
    });
  }

  test('el manifest y el worker se sirven sin pasar por el middleware', async ({ request }) => {
    // Sin sesión y sin seguir redirects: si alguno viviera bajo /admin, el
    // middleware lo mandaría a /admin/login y la app dejaría de ser instalable
    // (el navegador los pide sin credenciales). Por eso están en la raíz.
    for (const ruta of ['/panel.webmanifest', '/panel-sw.js', '/panel-sin-conexion.html']) {
      const respuesta = await request.get(ruta, { maxRedirects: 0 });
      expect(respuesta.status(), `${ruta} debería servirse tal cual`).toBe(200);
    }
  });

  test('el manifest describe el panel', async ({ request }) => {
    const manifest = await (await request.get('/panel.webmanifest')).json();

    // Sin barra final: el scope se compara como prefijo de cadena, así que
    // '/admin' cubre la portada del panel y todo lo que cuelga de ella.
    expect(manifest.scope).toBe('/admin');
    expect(manifest.start_url).toBe('/admin');
    expect(manifest.display).toBe('standalone');

    const tamanos = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(tamanos).toContain('192x192');
    expect(tamanos).toContain('512x512');
    // Sin un maskable, Android recorta el icono con su propia máscara y se
    // come el lomo de la «B».
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
  });

  test('solo el panel es instalable, la landing no', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/panel.webmanifest');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  });

  test('el worker se registra con scope /admin', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    await esperarControl(page);

    const scope = await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.getRegistration();
      return registro?.scope ?? '';
    });
    // Termina en /admin, no en / : un scope de raíz haría que el worker
    // controlara también la landing pública.
    expect(new URL(scope).pathname).toBe('/admin');
  });

  test('ningún dato de paciente acaba en la caché', async ({ page }) => {
    const nombre = nombreDePrueba('pwa');
    await sembrarSolicitud({ nombre, telefono: '33 4455 6677', tratamiento: 'Brackets metálicos' });

    try {
      await entrarAlPanel(page, '/admin/prospectos');
      await esperarControl(page);
      // Abrir el detalle: es la pantalla con más datos personales del panel.
      await page.getByRole('link', { name: nombre }).first().click();
      await page.waitForURL(/\/admin\/(prospectos|solicitudes)\//);

      const contenido = await page.evaluate(async () => {
        const salida: { url: string; cuerpo: string }[] = [];
        for (const nombreCache of await caches.keys()) {
          const cache = await caches.open(nombreCache);
          for (const peticion of await cache.keys()) {
            const respuesta = await cache.match(peticion);
            const tipo = respuesta?.headers.get('content-type') ?? '';
            salida.push({
              url: peticion.url,
              cuerpo: /text|json|javascript/.test(tipo) ? await respuesta!.text() : '',
            });
          }
        }
        return salida;
      });

      const rutas = contenido.map((e) => new URL(e.url).pathname);

      // Sin esto la prueba sería vacua: con la caché vacía los tres asertos de
      // abajo pasan solos. En dev no hay /_astro/ (Vite sirve desde /@fs/ y
      // /src/), pero el layout sí pide /favicon.svg y el manifest, que están en
      // la lista blanca, así que algo tiene que haber.
      expect(rutas.length, 'el worker no cacheó nada: la prueba no demuestra nada').toBeGreaterThan(0);

      // (a) Ninguna entrada del panel. El HTML de /admin lleva dentro nombres y
      //     teléfonos, y por eso navegacion() nunca guarda su respuesta.
      expect(rutas.filter((r) => r.startsWith('/admin'))).toEqual([]);

      // (b) Todo lo guardado cae en la lista blanca de estrategia().
      const permitida = (r: string) =>
        r.startsWith('/_astro/') ||
        r.startsWith('/iconos/') ||
        ['/favicon.svg', '/apple-touch-icon.png', '/panel.webmanifest', '/panel-sin-conexion.html'].includes(r);
      expect(rutas.filter((r) => !permitida(r))).toEqual([]);

      // (c) Y el nombre sembrado no aparece en ningún cuerpo.
      expect(contenido.filter((e) => e.cuerpo.includes(nombre)).map((e) => e.url)).toEqual([]);
    } finally {
      await limpiar(nombre);
    }
  });

  test('sin red aparece el respaldo, y al salir se vacía la caché de activos', async ({ page }) => {
    await entrarAlPanel(page, '/admin/prospectos');
    await esperarControl(page);

    await page.context().setOffline(true);
    // Un clic de verdad y no page.goto(): Playwright rechaza las navegaciones
    // por API estando offline, y lo que se quiere probar es justo el camino que
    // recorre la doctora.
    await page.getByRole('link', { name: 'Pacientes' }).first().click();
    await expect(page.getByRole('heading', { name: 'Sin conexión' })).toBeVisible();
    await page.context().setOffline(false);

    await page.goto('/admin/prospectos');
    await page.getByRole('button', { name: 'Salir' }).click();
    await page.waitForURL(/salir=1/);

    const cachesTras = await page.evaluate(async () => {
      // La purga corre en un .then() del script de login; darle una vuelta al
      // bucle de eventos evita leer antes de que escriba.
      await new Promise((r) => setTimeout(r, 500));
      return caches.keys();
    });
    expect(cachesTras.filter((n) => n.startsWith('panel-runtime-'))).toEqual([]);
    // El respaldo sobrevive: borrarlo dejaría el modo sin conexión roto hasta
    // la siguiente actualización del worker, que puede tardar semanas.
    expect(cachesTras.some((n) => n.startsWith('panel-respaldo-'))).toBe(true);
  });
});
