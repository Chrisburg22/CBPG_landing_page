import { expect, test } from '@playwright/test';
import {
  accionesDeSolicitud,
  citasDeSolicitud,
  entrarAlPanel,
  estadoDeSolicitud,
  limpiar,
  nombreDePrueba,
  sembrarCita,
  sembrarSolicitud,
} from './apoyo';

/**
 * La agenda, recorrida como la recorre el consultorio: desde el prospecto hasta
 * la cita atendida.
 *
 * Las horas se tecletean en hora de México y se comprueban leyendo la base, que
 * las devuelve en UTC. Es la comprobación que importa: un desfase de seis horas
 * no se ve en pantalla —ahí todo se pinta en México— y solo aparece cuando la
 * cita llega al calendario compartido.
 */

/** 'AAAA-MM-DD' de dentro de `dias` días, en hora de México. */
function diaEnMexico(dias = 0): string {
  const fecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return fecha.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

test.describe('Agenda', () => {
  test('se agenda una cita desde un prospecto y queda ligada a él', async ({ page }) => {
    const nombre = nombreDePrueba('agenda');
    const solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Alineadores invisibles',
    });

    await entrarAlPanel(page, `/admin/prospectos/${solicitudId}`);
    await page.getByRole('link', { name: '+ Agendar' }).click();
    await expect(page).toHaveURL(/\/admin\/agenda\/nueva/);

    // El formulario llega precargado con lo que la persona puso en el sitio.
    await expect(page.getByLabel('Nombre de quien viene')).toHaveValue(nombre);
    await expect(page.getByLabel('Teléfono')).toHaveValue('3312345678');

    const dia = diaEnMexico(1);
    await page.getByLabel('Fecha y hora').fill(`${dia}T16:30`);
    await page.getByLabel('Duración (minutos)').fill('45');
    await page.getByLabel('Tipo').selectOption('valoracion');
    await page.getByLabel('Nota para la agenda').fill('Viene acompañada');
    await page.getByRole('button', { name: 'Guardar cita' }).click();

    await page.waitForURL('**/admin/agenda**');
    await expect(page.getByRole('link', { name: nombre })).toBeVisible();

    const citas = await citasDeSolicitud(solicitudId);
    expect(citas).toHaveLength(1);
    expect(citas[0]!.duracion_min).toBe(45);
    expect(citas[0]!.tipo).toBe('valoracion');
    expect(citas[0]!.estado).toBe('programada');
    // 16:30 en México son las 22:30 UTC. Aquí es donde se vería el desfase.
    expect(citas[0]!.inicia_en).toBe(`${dia}T22:30:00+00:00`);

    // Agendar mueve el prospecto y deja rastro en su historial.
    expect(await estadoDeSolicitud(solicitudId)).toBe('agendada');
    const acciones = await accionesDeSolicitud(solicitudId);
    expect(acciones.map((a) => a.tipo)).toContain('cita_creada');

    await limpiar(nombre);
  });

  test('reprogramar cambia la hora y lo apunta en el historial', async ({ page }) => {
    const nombre = nombreDePrueba('reprogramar');
    const solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Brackets metálicos',
    });
    const dia = diaEnMexico(2);
    const citaId = await sembrarCita({
      nombre,
      solicitudId,
      iniciaEn: `${dia}T18:00:00.000Z`,
    });

    await entrarAlPanel(page, `/admin/agenda/${citaId}`);
    await page.getByLabel('Fecha y hora').fill(`${dia}T09:00`);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    const citas = await citasDeSolicitud(solicitudId);
    expect(citas[0]!.inicia_en).toBe(`${dia}T15:00:00+00:00`);

    const acciones = await accionesDeSolicitud(solicitudId);
    expect(acciones.map((a) => a.tipo)).toContain('cita_reprogramada');

    await limpiar(nombre);
  });

  test('marcar la cita como atendida ofrece convertir, sin convertir sola', async ({ page }) => {
    const nombre = nombreDePrueba('atendida');
    const solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Ortodoncia infantil',
    });
    const citaId = await sembrarCita({
      nombre,
      solicitudId,
      iniciaEn: `${diaEnMexico()}T17:00:00.000Z`,
    });

    await entrarAlPanel(page, `/admin/agenda/${citaId}`);

    // Antes de atenderla no se ofrece nada: que alguien tenga cita no significa
    // que haya aceptado el tratamiento.
    await expect(page.getByRole('link', { name: 'Convertir en paciente' })).toHaveCount(0);

    await page.getByLabel('Cómo quedó esta cita').selectOption('atendida');
    await page.getByRole('button', { name: 'Guardar asistencia' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Convertir en paciente' })).toBeVisible();
    // Ofrecer no es hacer: el prospecto sigue sin ficha hasta que se pulse.
    expect(await estadoDeSolicitud(solicitudId)).not.toBe('terminado');

    await limpiar(nombre);
  });

  test('cancelar deja la cita en la agenda, marcada, no borrada', async ({ page }) => {
    const nombre = nombreDePrueba('cancelar');
    const solicitudId = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Retenedores',
    });
    const citaId = await sembrarCita({
      nombre,
      solicitudId,
      iniciaEn: `${diaEnMexico(3)}T17:00:00.000Z`,
    });

    await entrarAlPanel(page, `/admin/agenda/${citaId}`);
    await page.getByLabel('Cómo quedó esta cita').selectOption('cancelada');
    await page.getByRole('button', { name: 'Guardar asistencia' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    const citas = await citasDeSolicitud(solicitudId);
    // Sigue existiendo: el hueco que ocupó y el motivo se pierden si se borra.
    expect(citas).toHaveLength(1);
    expect(citas[0]!.estado).toBe('cancelada');

    const acciones = await accionesDeSolicitud(solicitudId);
    expect(acciones.map((a) => a.tipo)).toContain('cita_cancelada');

    await limpiar(nombre);
  });

  test('la vista semanal enseña el día de la cita y la diaria no lo esconde', async ({ page }) => {
    const nombre = nombreDePrueba('semana');
    const dia = diaEnMexico(1);
    await sembrarCita({ nombre, iniciaEn: `${dia}T17:00:00.000Z` });

    // Una sola vez: `entrarAlPanel` pasa por /admin/login, y con la sesión ya
    // abierta el middleware redirige a /admin y el formulario no existe.
    await entrarAlPanel(page, `/admin/agenda?vista=semana&dia=${dia}`);
    await expect(page.getByRole('link', { name: nombre })).toBeVisible();

    await page.goto(`/admin/agenda?dia=${dia}`);
    await expect(page.getByRole('link', { name: nombre })).toBeVisible();

    // Y el día anterior no la enseña: el filtro por día tiene que filtrar.
    await page.goto(`/admin/agenda?dia=${diaEnMexico(-3)}`);
    await expect(page.getByRole('link', { name: nombre })).toHaveCount(0);

    await limpiar(nombre);
  });
});
