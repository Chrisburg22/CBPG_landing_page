import { expect, test } from '@playwright/test';
import { credencialesAdmin, entrarAlPanel } from './apoyo';

test.describe('Acceso al panel', () => {
  test('sin sesión, /admin manda a la pantalla de acceso', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Panel de solicitudes' })).toBeVisible();
  });

  test('el panel no es indexable', async ({ request }) => {
    const respuesta = await request.get('/admin/login');
    expect(respuesta.headers()['x-robots-tag']).toContain('noindex');
    // Sin esto, el CDN podría cachear una respuesta con Set-Cookie y servirle
    // la sesión de una persona a otra.
    expect(respuesta.headers()['cache-control']).toContain('no-store');
  });

  test('rechaza una contraseña incorrecta', async ({ page }) => {
    const { email } = credencialesAdmin();
    await page.goto('/admin/login');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('esta-no-es');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/error=credenciales/);
    await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();
  });

  test('rechaza un correo fuera de la allowlist con el mismo mensaje', async ({ page }) => {
    const { password } = credencialesAdmin();
    await page.goto('/admin/login');
    await page.getByLabel('Correo').fill('intruso@ejemplo.com');
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Idéntico al caso anterior a propósito: distinguirlos dejaría averiguar
    // qué cuentas existen.
    await expect(page).toHaveURL(/error=credenciales/);
    await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible();
  });

  test('entra con las credenciales correctas y puede salir', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    await expect(page.getByRole('heading', { name: /doctora/ })).toBeVisible();
    await expect(page.getByText(credencialesAdmin().email)).toBeVisible();

    // Con sesión, la pantalla de acceso rebota al panel en vez de hacer bucle.
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin$/);

    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/salir=1/);

    // Y la sesión murió de verdad, no solo en pantalla.
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
