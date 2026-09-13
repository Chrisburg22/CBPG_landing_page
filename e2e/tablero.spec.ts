import { expect, test, type Page } from '@playwright/test';
import {
  entrarAlPanel,
  limpiar,
  nombreDePrueba,
  ponerSeguimiento,
  seguimientoDeSolicitud,
  sembrarCita,
  sembrarSolicitud,
} from './apoyo';

/**
 * La cola de «Hoy».
 *
 * Lo que se comprueba no es que los datos existan —eso ya lo prueban las demás—
 * sino la regla del tablero: cada pendiente aparece UNA vez, respeta la zona
 * horaria, y desaparece cuando se atiende. Un tablero que sigue enseñando lo ya
 * hecho deja de leerse a los tres días.
 */

function diaEnMexico(dias = 0): string {
  const fecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return fecha.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

/**
 * Un bloque de la cola, localizado por su encabezado.
 *
 * Por el encabezado y no por `hasText`: los nombres de prueba llevan palabras
 * como «vencido» o «cita», y `hasText` las encontraría dentro de cualquier fila
 * — devolviendo el bloque equivocado según qué haya sembrado la prueba anterior.
 */
function bloque(page: Page, titulo: string) {
  return page.locator('.cola', {
    has: page.getByRole('heading', { level: 3, name: titulo, exact: true }),
  });
}

test.describe('Tablero de inicio', () => {
  test('un prospecto sin contestar aparece una sola vez, con una acción', async ({ page }) => {
    const nombre = nombreDePrueba('cola');
    await sembrarSolicitud({ nombre, telefono: '3312345678', tratamiento: 'Retenedores' });

    await entrarAlPanel(page, '/admin');

    const fila = page.locator('.cola__fila', { hasText: nombre });
    await expect(fila).toHaveCount(1);
    await expect(fila.getByRole('link', { name: 'Contactar' })).toBeVisible();

    await limpiar(nombre);
  });

  test('un seguimiento vencido sale UNA vez en la cola y «Hecho» lo cierra', async ({ page }) => {
    const nombre = nombreDePrueba('vencido');
    const id = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Brackets metálicos',
    });
    // Ayer: vencido sin ninguna duda, en cualquier zona horaria.
    await ponerSeguimiento(id, new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString());

    await entrarAlPanel(page, '/admin');

    // Una sola fila en TODA la cola: este prospecto también está sin contestar,
    // y sin la deduplicación saldría en los dos bloques como si fueran dos.
    const fila = page.locator('.cola__fila', { hasText: nombre });
    await expect(fila).toHaveCount(1);
    await expect(bloque(page, 'Seguimiento').locator('.cola__fila', { hasText: nombre })).toHaveCount(1);

    await fila.getByRole('button', { name: 'Hecho' }).click();
    await page.waitForURL('**/admin');

    // Fuera del bloque de seguimiento y fuera de la base: las tres columnas
    // vuelven a vacío. Sigue apareciendo como «sin contestar», y así debe ser:
    // cerrar el recordatorio no significa haber hablado con la persona.
    await expect(bloque(page, 'Seguimiento').locator('.cola__fila', { hasText: nombre })).toHaveCount(0);
    await expect(bloque(page, 'Sin contestar').locator('.cola__fila', { hasText: nombre })).toHaveCount(1);
    const seguimiento = await seguimientoDeSolicitud(id);
    expect(seguimiento?.proxima_accion_en).toBeNull();

    await limpiar(nombre);
  });

  test('un seguimiento de dentro de una semana todavía no molesta', async ({ page }) => {
    const nombre = nombreDePrueba('futuro');
    const id = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Retenedores',
    });
    await ponerSeguimiento(id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    await entrarAlPanel(page, '/admin');
    // Sale como prospecto sin contestar, pero no como seguimiento: lo que se
    // comprueba es que el bloque de seguimiento no recoja lo que aún no toca.
    await expect(bloque(page, 'Sin contestar').locator('.cola__fila', { hasText: nombre })).toHaveCount(1);
    await expect(bloque(page, 'Seguimiento').locator('.cola__fila', { hasText: nombre })).toHaveCount(0);

    await limpiar(nombre);
  });

  test('las citas de hoy salen en el tablero y las de mañana no', async ({ page }) => {
    const deHoy = nombreDePrueba('hoy');
    const deManana = nombreDePrueba('manana');
    // 15:00 UTC son las 9 de la mañana en México: el mismo día en las dos zonas,
    // así que la prueba no depende de a qué hora se ejecute.
    await sembrarCita({ nombre: deHoy, iniciaEn: `${diaEnMexico()}T15:00:00.000Z` });
    await sembrarCita({ nombre: deManana, iniciaEn: `${diaEnMexico(1)}T15:00:00.000Z` });

    await entrarAlPanel(page, '/admin');
    // La agenda del día es su propia región, no un bloque de la cola: una cita
    // no es un pendiente, es un compromiso con hora.
    const citasDeHoy = page.getByRole('region', { name: 'Agenda de hoy' });
    await expect(citasDeHoy.getByRole('link', { name: deHoy })).toBeVisible();
    await expect(citasDeHoy.getByRole('link', { name: deManana })).toHaveCount(0);

    await limpiar(deHoy);
    await limpiar(deManana);
  });

  test('las métricas cambian de periodo sin romperse', async ({ page }) => {
    await entrarAlPanel(page, '/admin');
    await expect(page.getByText('Cómo va')).toBeVisible();

    await page.getByRole('link', { name: '7 días', exact: true }).click();
    await expect(page).toHaveURL(/periodo=7d/);
    // Por la etiqueta de la métrica, no por su texto suelto: «Solicitudes»
    // aparece también dentro de «Sin solicitudes que comparar».
    await expect(page.locator('.paso__k', { hasText: 'Solicitudes' })).toBeVisible();
    await expect(page.locator('.paso__k', { hasText: 'Convertidas' })).toBeVisible();
    await expect(page.getByRole('link', { name: '7 días', exact: true })).toHaveAttribute('aria-current', 'true');
  });

  test('el listado de prospectos filtra los seguimientos vencidos', async ({ page }) => {
    const atrasado = nombreDePrueba('atrasado');
    const alDia = nombreDePrueba('al dia');
    const idAtrasado = await sembrarSolicitud({ nombre: atrasado, telefono: '3312345678', tratamiento: 'Retenedores' });
    const idAlDia = await sembrarSolicitud({ nombre: alDia, telefono: '3312345678', tratamiento: 'Retenedores' });
    await ponerSeguimiento(idAtrasado, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
    await ponerSeguimiento(idAlDia, new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString());

    await entrarAlPanel(page, '/admin/prospectos');
    await page.getByRole('link', { name: /Seguimiento vencido/ }).click();
    await expect(page).toHaveURL(/seguimiento=vencido/);

    await expect(page.locator('tr', { hasText: atrasado })).toBeVisible();
    await expect(page.locator('tr', { hasText: alDia })).toHaveCount(0);

    await limpiar(atrasado);
    await limpiar(alDia);
  });
});
