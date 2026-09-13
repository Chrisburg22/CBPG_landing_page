import { expect, test } from '@playwright/test';
import {
  accionesDeSolicitud,
  citasDePaciente,
  citasDeSolicitud,
  entrarAlPanel,
  estadoDeSolicitud,
  limpiar,
  nombreDePrueba,
  sembrarCita,
  sembrarPaciente,
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
    // Dentro de la rejilla: el resumen lateral también enlaza a la siguiente
    // cita, y lo que se comprueba aquí es que la rejilla la dibuje.
    const rejilla = page.getByRole('region', { name: /por hora/ });

    await entrarAlPanel(page, `/admin/agenda?vista=semana&dia=${dia}`);
    await expect(rejilla.getByRole('link', { name: nombre })).toBeVisible();

    await page.goto(`/admin/agenda?dia=${dia}`);
    await expect(rejilla.getByRole('link', { name: nombre })).toBeVisible();

    // Y el día anterior no la enseña: el filtro por día tiene que filtrar.
    await page.goto(`/admin/agenda?dia=${diaEnMexico(-3)}`);
    await expect(page.getByRole('link', { name: nombre })).toHaveCount(0);

    await limpiar(nombre);
  });

  test('la rejilla coloca la cita en su hora y con el alto de su duración', async ({ page }) => {
    const nombre = nombreDePrueba('rejilla');
    const dia = diaEnMexico(1);
    // 16:30 en México durante 45 minutos. La jornada va de 9 a 19 (600 min):
    // empieza al 75 % y ocupa el 7.5 %. En porcentaje y no en píxeles, para que
    // valga igual en el teléfono, donde la hora mide menos.
    const citaId = await sembrarCita({ nombre, iniciaEn: `${dia}T22:30:00.000Z`, duracionMin: 45 });

    await entrarAlPanel(page, `/admin/agenda?dia=${dia}`);
    const bloque = page.locator(`a[data-cita="${citaId}"]`);
    await expect(bloque).toBeVisible();
    const estilo = (await bloque.getAttribute('style')) ?? '';
    expect(estilo).toContain('top: 75%');
    expect(estilo).toContain('height: 7.5%');

    // Al tocarla se abre el detalle sin salir de la agenda.
    await bloque.click();
    await expect(page).toHaveURL(new RegExp(`cita=${citaId}`));
    await expect(page.getByRole('heading', { level: 2, name: nombre })).toBeVisible();

    await limpiar(nombre);
  });

  test('un doble clic en «Guardar cita» crea una sola cita', async ({ page }) => {
    const nombre = nombreDePrueba('doble');
    const pacienteId = await sembrarPaciente({ nombre, telefono: '3312345678' });

    await entrarAlPanel(page, `/admin/agenda/nueva?paciente=${pacienteId}`);
    await page.getByLabel('Fecha y hora').fill(`${diaEnMexico(2)}T11:00`);
    // Dos clics seguidos: sin la guarda del layout, el segundo envío llegaba
    // antes de que la primera respuesta redirigiera y se creaban dos citas.
    await page.getByRole('button', { name: 'Guardar cita' }).dblclick();
    await page.waitForURL('**/admin/agenda?**');

    expect(await citasDePaciente(pacienteId)).toHaveLength(1);

    await limpiar(nombre);
  });

  test('se agenda desde la ficha del paciente y la cita aparece en ella', async ({ page }) => {
    const nombre = nombreDePrueba('ficha paciente');
    const pacienteId = await sembrarPaciente({ nombre, telefono: '33 9988 7766' });

    await entrarAlPanel(page, `/admin/pacientes/${pacienteId}`);
    await page.getByRole('link', { name: '+ Agendar' }).click();
    await expect(page).toHaveURL(new RegExp(`paciente=${pacienteId}`));
    await expect(page.getByLabel('Nombre de quien viene')).toHaveValue(nombre);

    const dia = diaEnMexico(3);
    await page.getByLabel('Fecha y hora').fill(`${dia}T12:00`);
    await page.getByLabel('Tipo').selectOption('control');
    await page.getByRole('button', { name: 'Guardar cita' }).click();
    await page.waitForURL('**/admin/agenda?**');

    const citas = await citasDePaciente(pacienteId);
    expect(citas).toHaveLength(1);
    expect(citas[0]!.tipo).toBe('control');

    // De vuelta en la ficha, la cita es la próxima.
    await page.goto(`/admin/pacientes/${pacienteId}`);
    await expect(page.getByRole('region', { name: 'Citas' })).toContainText('Próxima');

    await limpiar(nombre);
  });
});
