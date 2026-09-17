import { expect, test } from '@playwright/test';
import { DEMO, diaHabil, limpiarDemo, sembrarEscenario, telDemo, type Escenario } from './escenario';
import {
  entrarParaGrabar,
  irASeccion,
  limpiarVista,
  llevarA,
  pausa,
  prepararGrabacion,
  quitarRotulo,
  rotulo,
} from './manual';

/**
 * Videos del manual. Cada prueba es un video (manual-video/<prueba>/video.webm);
 * `scripts/videos-manual.mjs` los renombra por el número del título.
 *
 * En serie y sobre un solo escenario: el 05 convierte al prospecto que el 04
 * dejó con la valoración atendida, igual que pasaría en el consultorio.
 */

test.describe.configure({ mode: 'serial' });

let e: Escenario;
test.beforeAll(async () => {
  e = await sembrarEscenario();
});
test.afterAll(async () => {
  await limpiarDemo();
});
test.beforeEach(async ({ page, context }) => {
  await prepararGrabacion(page);
  // WhatsApp no se abre de verdad: una página de relleno en su lugar.
  await context.route(/https:\/\/(wa\.me|api\.whatsapp\.com)\/.*/, (ruta) =>
    ruta.fulfill({
      contentType: 'text/html',
      body: '<meta name="viewport" content="width=device-width"><body style="font:600 20px system-ui;display:grid;place-items:center;height:90vh;background:#e7fbe6;color:#075e54">Aquí se abre WhatsApp<br>con el mensaje escrito</body>',
    })
  );
});

/** Abre un enlace de WhatsApp, enseña la pestaña simulada y vuelve. */
async function pasarPorWhatsapp(page: import('@playwright/test').Page, enlace: import('@playwright/test').Locator) {
  const [popup] = await Promise.all([page.context().waitForEvent('page'), enlace.click()]);
  await popup.waitForLoadState();
  await pausa(page, 1800);
  await popup.close();
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await pausa(page, 800);
}

test('01-acceso', async ({ page }) => {
  await page.goto('/admin/login');
  await rotulo(page, 'Acceso', 'Abre el panel en el teléfono y entra con tu correo y contraseña.');
  const { credencialesAdmin } = await import('../apoyo');
  const { email, password } = credencialesAdmin();
  await page.getByLabel('Correo').pressSequentially(email, { delay: 25 });
  // La contraseña se escribe de golpe: el campo la enmascara, pero no hace falta alargarlo.
  await page.getByLabel('Contraseña').fill(password);
  await pausa(page, 600);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/admin');
  await limpiarVista(page);
  await rotulo(page, 'Inicio', 'Llegas a Inicio: lo que toca hoy y cómo va la captación.');
  await rotulo(
    page,
    'Consejo',
    'Instálalo: en iPhone, Compartir → «Añadir a pantalla de inicio». En Android, menú ⋮ → «Instalar app».',
    3800
  );
  await rotulo(page, 'Navegación', 'Abajo están las secciones. Arriba, tu rol y el botón Salir.');
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.waitForURL('**/admin/login');
  await rotulo(page, 'Salir', 'Al salir vuelves a la pantalla de acceso.');
  await quitarRotulo(page);
});

test('02-inicio', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await rotulo(page, 'Inicio · Hoy', 'La cola de «Hoy» junta lo pendiente: cada persona aparece una sola vez.', 2800);

  const hoy = page.getByRole('region', { name: /^Hoy/ });
  await llevarA(page, hoy.getByRole('heading', { name: 'Sin contestar' }));
  await rotulo(page, 'Sin contestar', 'Prospectos nuevos. «Contactar» abre WhatsApp con el mensaje listo.');

  await llevarA(page, hoy.getByRole('heading', { name: 'Seguimiento' }));
  await rotulo(page, 'Seguimiento', 'Lo que dejaste apuntado. En rojo lo que ya venció. «Hecho» lo saca de la cola.');
  const fila = hoy.locator('li', { hasText: DEMO.contactada });
  await fila.getByRole('button', { name: 'Hecho' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Hecho', 'Listo: queda anotado en su historial y desaparece de la cola.');

  const cuotas = page.getByRole('heading', { name: 'Cuotas vencidas' });
  if (await cuotas.count()) {
    await llevarA(page, cuotas);
    await rotulo(page, 'Cuotas vencidas', 'Mensualidades vencidas y si ya se recordaron. «Cobrar» abre WhatsApp.');
  }

  await llevarA(page, page.getByRole('heading', { name: 'Agenda de hoy' }));
  await rotulo(page, 'Agenda de hoy', 'Las citas del día, con la marca de «ahora».');

  await llevarA(page, page.getByRole('heading', { name: 'Cómo va la captación' }));
  await rotulo(page, 'Captación', 'El embudo: solicitudes → contactadas → agendadas → convertidas.');
  await page.getByRole('navigation', { name: 'Periodo de las métricas' }).getByRole('link', { name: '90 días' }).click();
  await limpiarVista(page);
  await llevarA(page, page.getByRole('heading', { name: 'Cómo va la captación' }));
  await rotulo(page, 'Periodo', 'Cambia el periodo: 7 días, 30 días, este mes o 90 días.');
  await quitarRotulo(page);
});

test('03-prospectos', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await irASeccion(page, /^Prospectos/);
  await rotulo(page, 'Prospectos', 'Cada solicitud del sitio llega aquí como «Nueva».');

  await page.getByRole('link', { name: /Seguimiento vencido/ }).click();
  await limpiarVista(page);
  await rotulo(page, 'Filtros', 'Filtra por estado, por origen o por seguimiento vencido.');
  await page.getByRole('link', { name: 'Quitar filtro' }).click();
  await limpiarVista(page);

  await page.getByRole('searchbox', { name: 'Buscar' }).pressSequentially('Valeria', { delay: 60 });
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Buscar', 'Busca por nombre o teléfono.');

  await page.getByRole('link', { name: DEMO.nueva }).click();
  await limpiarVista(page);
  await rotulo(page, 'Ficha', 'La ficha: estado, origen, mensaje y botones para contactar.');

  await pasarPorWhatsapp(page, page.getByRole('link', { name: 'WhatsApp' }).first());
  const aviso = page.getByRole('button', { name: 'Marcar como contactada' });
  if (await aviso.isVisible()) {
    await rotulo(page, 'Al volver', 'El panel pregunta si le escribiste. Un toque y queda como contactada.');
    await aviso.click();
    await limpiarVista(page);
  }

  const seguimiento = page.locator('#seguimiento');
  await llevarA(page, seguimiento);
  await rotulo(page, 'Próxima acción', 'Deja apuntado el siguiente paso: aparecerá en Inicio ese día.');
  const cuando = seguimiento.getByLabel('Cuándo');
  if (!(await cuando.isVisible())) await seguimiento.getByText('Poner seguimiento').click();
  await seguimiento.getByLabel('Qué toca').selectOption('llamada');
  await seguimiento.getByLabel('Nota corta').pressSequentially('Preguntar si lo habló en casa', { delay: 30 });
  await seguimiento.getByRole('button', { name: 'Guardar seguimiento' }).click();
  await limpiarVista(page);
  await llevarA(page, page.locator('#seguimiento'));
  await rotulo(page, 'Guardado', 'La próxima acción queda arriba, con «Marcar como hecho».');

  const notas = page.getByLabel('Solo para ti. El prospecto no las ve.');
  await llevarA(page, notas);
  await notas.pressSequentially('Prefiere tardes. Pregunta por pagos a meses.', { delay: 25 });
  await page.getByRole('button', { name: 'Guardar notas' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Notas', 'Las notas son privadas: el prospecto nunca las ve.');
  await quitarRotulo(page);
});

test('04-agenda', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await irASeccion(page, /^Agenda/);
  await rotulo(page, 'Agenda', 'La agenda por horas. Arriba eliges el día de la semana.');

  const bloque = page.locator(`a[data-cita="${e.citas.agendadaHoy}"]`);
  await llevarA(page, bloque);
  await rotulo(page, 'Cita', 'Cada bloque mide lo que dura la cita. Tócalo para ver el detalle.');
  await bloque.click();
  await limpiarVista(page);
  await rotulo(page, 'Detalle', 'Contacto, editar o reprogramar y la asistencia, sin salir de la agenda.');

  // Agendar desde un prospecto: el camino más común.
  await page.goto(`/admin/prospectos/${e.solicitudes.contactada}`);
  await limpiarVista(page);
  await rotulo(page, 'Agendar', 'Desde la ficha del prospecto, toca «Agendar cita».');
  await page.getByRole('link', { name: 'Agendar cita' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Nueva cita', 'Nombre y teléfono ya vienen puestos.');
  const dia = diaHabil(1);
  await page.getByLabel('Fecha y hora').fill(`${dia}T12:30`);
  await page.getByRole('button', { name: '45', exact: false }).first().click();
  await page.getByLabel('Nota para la agenda').pressSequentially('Primera valoración', { delay: 30 });
  await rotulo(page, 'Cuándo', 'Elige fecha, hora, tipo y duración. La franja enseña lo ocupado.');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await page.waitForURL('**/admin/agenda?**');
  await limpiarVista(page);
  await rotulo(page, 'Guardada', 'Te lleva al día de la cita, con el detalle abierto. El prospecto pasa a «Agendada».', 2800);

  await page.getByRole('link', { name: 'Editar o reprogramar' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Reprogramar', 'Cambia la hora y guarda: queda en el historial del prospecto.');
  await page.getByLabel('Fecha y hora').fill(`${dia}T13:00`);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await limpiarVista(page);

  // Asistencia de la valoración de ayer, que el video 05 convierte.
  await page.goto(`/admin/agenda/${e.citas.valoradaAyer}`);
  await limpiarVista(page);
  await rotulo(page, 'Asistencia', 'Después de la cita, marca cómo quedó: atendida, no asistió o cancelada.');
  const asistencia = page.getByLabel('Cómo quedó esta cita');
  await llevarA(page, asistencia);
  await asistencia.selectOption('atendida');
  await page.getByRole('button', { name: 'Guardar asistencia' }).click();
  await limpiarVista(page);
  await llevarA(page, page.getByRole('heading', { name: '¿Aceptó el tratamiento?' }));
  await rotulo(page, 'Siguiente paso', 'Si fue valoración, te ofrece convertirlo en paciente.');
  await quitarRotulo(page);
});

test('05-convertir', async ({ page }) => {
  await entrarParaGrabar(page, `/admin/agenda/${e.citas.valoradaAyer}`);
  const convertir = page.getByRole('link', { name: 'Convertir en paciente' });
  await llevarA(page, convertir);
  await rotulo(page, 'Convertir', 'Aceptó el tratamiento: toca «Convertir en paciente».');
  await convertir.click();
  await limpiarVista(page);
  await rotulo(page, 'Revisar', 'Los datos vienen del prospecto. Revisa tratamiento, inicio y estado.');
  await page.getByLabel('Tratamiento').fill('Alineadores invisibles');
  const crear = page.getByRole('button', { name: /Crear paciente|Convertir/ });
  await llevarA(page, crear);
  await crear.click();
  await page.waitForURL('**/admin/pacientes/**');
  await limpiarVista(page);
  await rotulo(page, 'Paciente', 'Ya tiene ficha. El prospecto queda «Terminado» con su historial.', 2800);
  await rotulo(page, 'Siguiente', 'Ahora puedes crear su plan de pagos y agendar su primer control.');
  await quitarRotulo(page);
});

test('06-pacientes', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await irASeccion(page, /^Pacientes/);
  await rotulo(page, 'Pacientes', 'Todas las fichas, con su saldo y cuotas vencidas.');

  await page.getByRole('link', { name: /Nuevo paciente/ }).first().click();
  await limpiarVista(page);
  await rotulo(page, 'Alta directa', 'Para quien no llegó por el sitio: nombre, teléfono y tratamiento.');
  await page.getByLabel('Nombre completo').pressSequentially(DEMO.pacienteNuevo, { delay: 25 });
  await page.getByLabel('Teléfono').fill(telDemo(20));
  await page.getByLabel('Tratamiento').fill('Brackets metálicos');
  await page.getByRole('button', { name: 'Crear paciente' }).click();
  await page.waitForURL('**/admin/pacientes/**');
  await limpiarVista(page);

  await rotulo(page, 'Plan', 'Sin plan todavía. «Crear plan» define costo, enganche y mensualidades.');
  await page.getByRole('link', { name: 'Crear plan' }).first().click();
  await limpiarVista(page);
  await page.getByLabel('Costo total').fill('18000');
  await page.getByLabel('Enganche').fill('3000');
  await page.getByLabel('Mensualidades').fill('10');
  await rotulo(page, 'Plan', 'Las mensualidades se calculan solas con el día de corte.');
  await page.getByRole('button', { name: /Guardar|Crear/ }).last().click();
  await page.waitForURL(/\/admin\/pacientes\/[^/]+\?plan=1/);
  await limpiarVista(page);
  await rotulo(page, 'Ficha', 'Resumen de saldo, mensualidades, pagos y citas en una sola pantalla.', 2600);

  await page.getByRole('link', { name: '+ Agendar' }).first().click();
  await limpiarVista(page);
  await rotulo(page, 'Control', 'Agenda su control desde la ficha: el tipo ya viene como «Control».');
  await page.getByLabel('Fecha y hora').fill(`${diaHabil(2)}T11:00`);
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await page.waitForURL('**/admin/agenda?**');
  await limpiarVista(page);

  // La ficha del paciente con historial, para enseñar mensualidades vencidas.
  await page.goto(`/admin/pacientes/${e.pacientes.paciente}`);
  await limpiarVista(page);
  const mensualidades = page.locator('#mensualidades');
  await llevarA(page, mensualidades);
  await rotulo(page, 'Mensualidades', 'Lo vencido arriba, con «Cobrar» por WhatsApp y «Marcar enviado».', 2800);
  await quitarRotulo(page);
});

test('07-pagos', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await irASeccion(page, /^Pagos/);
  await rotulo(page, 'Pagos', 'Lo cobrado del mes, lo vencido y quién falta por recordar.');

  const fila = page.locator('tr', { hasText: DEMO.paciente }).first();
  await llevarA(page, fila);
  await rotulo(page, 'Por cobrar', 'Cada cuota vencida con su monto. WhatsApp abre el mensaje de cobro.');
  await pasarPorWhatsapp(page, fila.getByRole('link', { name: 'WhatsApp' }));
  await fila.getByRole('button', { name: 'Marcar enviado' }).click();
  await limpiarVista(page);
  await llevarA(page, page.locator('tr', { hasText: DEMO.paciente }).first());
  await rotulo(page, 'Recordado', '«Marcar enviado» evita volver a cobrarle el mismo día.');

  await page.locator('tr', { hasText: DEMO.paciente }).first().getByRole('link', { name: 'Registrar' }).click();
  await limpiarVista(page);
  await rotulo(page, 'Registrar pago', 'Paciente, mensualidad y monto ya vienen puestos.');
  await page.getByText('Transferencia', { exact: true }).click();
  await page.getByLabel('Nota').pressSequentially('SPEI ref. 4821', { delay: 30 });
  const guardar = page.getByRole('button', { name: 'Guardar pago' });
  await llevarA(page, guardar);
  await rotulo(page, 'Saldo', 'El lateral enseña cómo queda el saldo después de este pago.');
  await guardar.click();
  await page.waitForURL('**/admin/pacientes/**');
  await limpiarVista(page);
  await rotulo(page, 'Listo', 'Vuelves a la ficha con el pago registrado y el saldo al día.');
  await quitarRotulo(page);
});

test('08-google', async ({ page }) => {
  await entrarParaGrabar(page, '/admin');
  await irASeccion(page, /^Agenda/);
  const boton = page.getByRole('link', { name: /Google/ }).first();
  await rotulo(page, 'Google Calendar', 'Desde la agenda, el botón de Google lleva a la conexión.');
  await boton.click();
  await limpiarVista(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Google Calendar' })).toBeVisible();
  await rotulo(page, 'Conectar', 'La doctora conecta su cuenta una vez y elige el calendario destino.', 2800);
  await rotulo(page, 'Espejo', 'El panel manda: si Google falla, la cita se guarda igual y se reintenta.', 2800);
  await quitarRotulo(page);
});
