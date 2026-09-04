import { expect, test } from '@playwright/test';
import { entrarAlPanel, enviarFormulario, limpiar, nombreDePrueba } from './apoyo';

/**
 * Recorrido grabado en vídeo, para enseñar el panel sin tener que abrirlo.
 *
 * No forma parte de `pnpm test`: el config principal lo excluye. Se corre con
 * `pnpm demo`, que usa playwright.demo.config.ts (vídeo, ventana grande y
 * `slowMo` para que se pueda seguir con la vista).
 *
 * Es la aplicación real contra la base real: lo que se ve en el vídeo es lo que
 * hace el sistema, no una maqueta.
 */
test('recorrido del panel', async ({ page }) => {
  const nombre = nombreDePrueba('demo María Fernanda Solís');
  const mensaje =
    'Vi su Instagram y me interesan los alineadores. ¿Tienen cita algún sábado por la mañana?';

  const pausa = (ms = 1400) => page.waitForTimeout(ms);

  // ---- 1. La paciente llena el formulario de la landing ----
  await enviarFormulario(page, {
    nombre,
    telefono: '33 9988 7766',
    tratamiento: 'Alineadores invisibles',
    mensaje,
  });
  await expect(page.getByText('¡Solicitud enviada!')).toBeVisible();
  await pausa(2200);

  // ---- 2. La doctora entra al panel ----
  await entrarAlPanel(page);
  await pausa(2000);

  // ---- 3. Su solicitud ya está en la lista ----
  const fila = page.locator('tr', { hasText: nombre });
  await expect(fila).toBeVisible();
  await expect(fila.locator('.chip')).toHaveText('Nueva');
  await pausa(2000);

  // ---- 4. Abre el detalle: mensaje completo y accesos de contacto ----
  await page.getByRole('link', { name: nombre }).click();
  await expect(page.getByText(mensaje)).toBeVisible();
  await pausa(2600);

  // ---- 5. La marca como contactada ----
  await page.getByLabel('Situación de esta paciente').selectOption('contactada');
  await pausa(700);
  await page.getByRole('button', { name: 'Guardar estado' }).click();
  await expect(page.getByText('Guardado.')).toBeVisible();
  await pausa(1600);

  // ---- 6. Y deja una nota interna ----
  await page
    .getByLabel('Solo para ti. La paciente no las ve.')
    .fill('Le escribí por WhatsApp. Prefiere sábados por la mañana.');
  await pausa(900);
  await page.getByRole('button', { name: 'Guardar notas' }).click();
  await expect(page.getByText('Guardado.')).toBeVisible();
  await pausa(1800);

  // ---- 7. De vuelta a la lista, el estado ya cambió ----
  await page.getByRole('link', { name: 'Todas las solicitudes' }).click();
  await expect(page.locator('tr', { hasText: nombre }).locator('.chip')).toHaveText('Contactada');
  await pausa(2400);

  await limpiar(nombre);
});
