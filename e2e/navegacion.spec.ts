import { expect, test } from '@playwright/test';
import { entrarAlPanel, limpiar, nombreDePrueba, sembrarSolicitud } from './apoyo';

/**
 * El panel dejó de ser una sola pantalla. Estas pruebas cubren lo que se rompe
 * al partirlo en secciones: que todas se alcancen, que la activa se note, y que
 * los enlaces que la doctora tuviera guardados de la versión anterior sigan
 * llevando a algún sitio.
 */
test.describe('Navegación del panel', () => {
  let nombre: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('nav');
    await sembrarSolicitud({ nombre, telefono: '33 4455 6677', tratamiento: 'Brackets metálicos' });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('las cuatro secciones se alcanzan desde la navegación', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    const nav = page.getByRole('navigation', { name: 'Secciones del panel' });

    for (const [enlace, url, encabezado] of [
      [/^Pacientes$/, /\/admin\/pacientes$/, 'Pacientes'],
      [/^Prospectos/, /\/admin\/prospectos$/, 'Prospectos'],
      [/^Pagos$/, /\/admin\/pagos$/, 'Pagos'],
    ] as const) {
      await nav.getByRole('link', { name: enlace }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { level: 1, name: encabezado })).toBeVisible();
      // La sección abierta se marca para lectores de pantalla, no solo con color.
      await expect(nav.getByRole('link', { name: enlace })).toHaveAttribute('aria-current', 'page');
    }

    await nav.getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('el inicio resume los prospectos y lleva al listado', async ({ page }) => {
    await entrarAlPanel(page, '/admin');

    // La solicitud recién sembrada es 'nueva', así que hay al menos una sin atender.
    await expect(page.locator('.metrica__k', { hasText: 'Sin atender' })).toBeVisible();
    await expect(page.locator('tr', { hasText: nombre })).toBeVisible();

    await page.getByRole('link', { name: 'Ver todos' }).click();
    await expect(page).toHaveURL(/\/admin\/prospectos$/);
    await expect(page.locator('tr', { hasText: nombre })).toBeVisible();
  });

  test('la navegación avisa de cuántos prospectos quedan sin atender', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    const cuenta = page.locator('.nav-panel__cuenta');
    await expect(cuenta).toBeVisible();
    expect(Number(await cuenta.innerText())).toBeGreaterThan(0);

    // El número no puede vivir solo en el punto de color: quien use lector de
    // pantalla tiene que oírlo en el nombre del enlace.
    await expect(
      page.getByRole('navigation', { name: 'Secciones del panel' }).getByRole('link', {
        name: /Prospectos, \d+ sin atender/,
      })
    ).toBeVisible();
  });

  /**
   * La ficha vivía en /admin/solicitudes/<id>. Romper ese enlace sería fácil y
   * silencioso: la doctora abriría un marcador y se encontraría un 404.
   */
  test('la ruta antigua de una ficha sigue llevando a la ficha', async ({ page }) => {
    await entrarAlPanel(page);
    await page.getByRole('link', { name: nombre }).click();
    const idEnLaUrl = new URL(page.url()).pathname.split('/').pop()!;

    const respuesta = await page.goto(`/admin/solicitudes/${idEnLaUrl}`);
    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/admin/prospectos/${idEnLaUrl}$`));
    await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  });
});
