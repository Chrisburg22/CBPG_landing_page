import { expect, test, type Locator } from '@playwright/test';
import {
  entrarAlPanel,
  estadoDeSolicitud,
  limpiar,
  nombreDePrueba,
  pacienteDeSolicitud,
  sembrarSolicitud,
} from './apoyo';

/**
 * Cambia el estado desde el listado y espera a que el POST-Redirect-GET termine.
 *
 * `selectOption` dispara el envío pero vuelve enseguida: sin esperar la recarga,
 * leer la base a continuación es una carrera que gana la lectura, y la prueba
 * falla informando del estado anterior.
 */
async function cambiarEstadoEnFila(fila: Locator, valor: string): Promise<void> {
  const select = fila.locator('select');
  await select.selectOption(valor);
  await expect(select).toHaveValue(valor);
}

/**
 * El momento en que un prospecto se vuelve paciente.
 *
 * Es la operación con más partes móviles del panel: escribe en dos tablas sin
 * transacción, cambia el estado de una solicitud a un valor que ningún selector
 * ofrece, y a partir de ahí esa solicitud deja de ser editable. Cada una de esas
 * tres cosas se comprueba abajo, y las dos primeras contra la base, no contra lo
 * que diga la pantalla.
 */
test.describe('Convertir un prospecto en paciente', () => {
  let nombre: string;
  let solicitudId: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('conv');
    solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '33 5566 7788',
      tratamiento: 'Alineadores invisibles',
      mensaje: 'Quiero empezar cuanto antes.',
    });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('crea la ficha y deja la solicitud como terminada', async ({ page }) => {
    await entrarAlPanel(page, `/admin/prospectos/${solicitudId}`);

    await page.getByRole('link', { name: 'Convertir en paciente' }).click();
    await expect(page.getByRole('heading', { name: 'Convertir en paciente' })).toBeVisible();

    // Los datos llegan heredados de la solicitud, no en blanco.
    await expect(page.getByLabel('Nombre completo')).toHaveValue(nombre);
    await expect(page.getByLabel('Teléfono')).toHaveValue('33 5566 7788');
    await expect(page.getByLabel('Tratamiento', { exact: true })).toHaveValue(
      'Alineadores invisibles'
    );

    // Y son editables antes de crear: la doctora acordó otro tratamiento.
    await page.getByLabel('Tratamiento', { exact: true }).fill('Brackets estéticos');
    await page.getByLabel('Notas').fill('Pidió empezar después de las vacaciones.');
    await page.getByRole('button', { name: 'Crear ficha de paciente' }).click();

    await expect(page).toHaveURL(/\/admin\/pacientes\/[0-9a-f-]{36}/);
    await expect(page.getByText('Ficha creada')).toBeVisible();

    // Contra la base, no contra la pantalla: lo que importa es lo que se grabó.
    const paciente = await pacienteDeSolicitud(solicitudId);
    expect(paciente).not.toBeNull();
    expect(paciente?.nombre).toBe(nombre);
    expect(paciente?.tratamiento).toBe('Brackets estéticos');
    expect(paciente?.estado).toBe('activo');

    expect(await estadoDeSolicitud(solicitudId)).toBe('terminado');
  });

  test('la solicitud convertida ya no se puede reabrir', async ({ page }) => {
    await entrarAlPanel(page, `/admin/prospectos/${solicitudId}`);
    await page.getByRole('link', { name: 'Convertir en paciente' }).click();
    await page.getByRole('button', { name: 'Crear ficha de paciente' }).click();
    await expect(page).toHaveURL(/\/admin\/pacientes\//);

    // De vuelta en el prospecto: ni selector de estado ni botón de convertir,
    // solo el enlace al paciente. Si el selector siguiera ahí, se podría dejar
    // una solicitud en «contactada» con una ficha de paciente ya creada.
    await page.goto(`/admin/prospectos/${solicitudId}`);
    await expect(page.getByLabel('Situación de este prospecto')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Convertir en paciente' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Ver ficha de/ })).toBeVisible();

    // Y en el listado el estado se muestra, pero no se edita.
    await page.goto('/admin/prospectos?estado=terminado');
    const fila = page.locator('tr', { hasText: nombre });
    await expect(fila.locator('.chip--terminado')).toBeVisible();
    await expect(fila.locator('select')).toHaveCount(0);
  });

  test('convertir dos veces no crea dos pacientes', async ({ page }) => {
    await entrarAlPanel(page, `/admin/prospectos/${solicitudId}/convertir`);
    await page.getByRole('button', { name: 'Crear ficha de paciente' }).click();
    await expect(page).toHaveURL(/\/admin\/pacientes\//);

    // Volver a la URL de conversión a mano, como quien tenía la pestaña abierta.
    // Debe llevar a la ficha que ya existe, no ofrecer crear otra.
    await page.goto(`/admin/prospectos/${solicitudId}/convertir`);
    await expect(page).toHaveURL(/\/admin\/pacientes\//);
  });
});

test.describe('Estado del prospecto desde el listado', () => {
  let nombre: string;
  let solicitudId: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('estado');
    solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '33 1212 3434',
      tratamiento: 'Ortodoncia infantil',
    });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  test('se cambia sin abrir la ficha', async ({ page }) => {
    await entrarAlPanel(page, '/admin/prospectos');

    // El select se envía solo con JavaScript; sin él quedaría el botón Guardar.
    await cambiarEstadoEnFila(page.locator('tr', { hasText: nombre }), 'agendada');
    expect(await estadoDeSolicitud(solicitudId)).toBe('agendada');
  });

  test('se puede volver atrás desde el listado', async ({ page }) => {
    await entrarAlPanel(page, '/admin/prospectos');
    await cambiarEstadoEnFila(page.locator('tr', { hasText: nombre }), 'descartada');
    expect(await estadoDeSolicitud(solicitudId)).toBe('descartada');

    // Descartar no es una puerta de un solo sentido: desde el propio filtro de
    // descartadas se puede devolver a contactada.
    await page.goto('/admin/prospectos?estado=descartada');
    const fila = page.locator('tr', { hasText: nombre });
    await fila.locator('select').selectOption('contactada');

    // El redirect conserva el filtro, así que la fila desaparece del listado:
    // ya no es descartada. Es lo correcto, y es también la señal de que se
    // guardó — esperar a que se vaya evita leer la base antes de tiempo.
    await expect(fila).toHaveCount(0);
    expect(await estadoDeSolicitud(solicitudId)).toBe('contactada');
  });

  test('también se cambia desde el resumen del inicio', async ({ page }) => {
    // El Inicio lista las que están sin contactar. Marcar a alguien como
    // contactado es lo primero que se hace tras escribirle, y es justo donde
    // está mirando la doctora al abrir el panel.
    await entrarAlPanel(page, '/admin');
    const fila = page.locator('tr', { hasText: nombre });
    await fila.locator('select').selectOption('contactada');

    // El Inicio solo lista las que siguen sin contactar, así que la fila se va
    // al guardarse. Eso es lo que mantiene la lista siendo de pendientes — y de
    // paso es la señal de que la escritura terminó.
    await expect(fila).toHaveCount(0);
    expect(await estadoDeSolicitud(solicitudId)).toBe('contactada');
  });

  test('«terminado» no se ofrece como opción manual', async ({ page }) => {
    await entrarAlPanel(page, '/admin/prospectos');
    const opciones = page.locator('tr', { hasText: nombre }).locator('select option');
    await expect(opciones).toHaveCount(4);
    await expect(opciones.filter({ hasText: 'Terminado' })).toHaveCount(0);
  });
});
