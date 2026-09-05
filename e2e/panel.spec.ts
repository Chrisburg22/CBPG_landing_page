import { expect, test } from '@playwright/test';
import {
  clienteAdmin,
  entrarAlPanel,
  enviarFormulario,
  limpiar,
  nombreDePrueba,
  sembrarSolicitud,
} from './apoyo';
import { TRATAMIENTO_SIN_DECIDIR } from '../src/lib/validate';

/**
 * El recorrido completo: una paciente llena el formulario de la landing y la
 * doctora ve esa misma solicitud en el panel. Es la prueba que justifica todo
 * el proyecto, así que va sobre datos reales de punta a punta — nada simulado.
 */
test.describe('Panel de solicitudes', () => {
  const telefono = '33 1122 3344';
  const mensaje = 'Me interesa saber el costo aproximado y si dan facilidades de pago.';
  let nombre: string;

  test.beforeEach(async () => {
    nombre = nombreDePrueba('panel');
    await sembrarSolicitud({ nombre, telefono, tratamiento: 'Alineadores invisibles', mensaje });
  });

  test.afterEach(async () => {
    await limpiar(nombre);
  });

  /**
   * La prueba que justifica el proyecto entero: una paciente llena el
   * formulario de la landing y la doctora ve esa misma solicitud en el panel.
   * Es la única que pasa por el formulario de verdad — ver `sembrarSolicitud`.
   */
  test('recorrido completo: del formulario de la landing al dashboard', async ({ page }) => {
    const delFormulario = nombreDePrueba('recorrido');
    const suMensaje = 'Vi su Instagram y quiero una valoración.';

    await enviarFormulario(page, {
      nombre: delFormulario,
      telefono: '33 9988 7766',
      tratamiento: 'Brackets metálicos',
      mensaje: suMensaje,
    });
    await expect(page.getByText('¡Solicitud enviada!')).toBeVisible();

    await entrarAlPanel(page);

    const fila = page.locator('tr', { hasText: delFormulario });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('33 9988 7766');
    await expect(fila).toContainText('Brackets metálicos');
    await expect(fila.locator('.chip')).toHaveText('Nueva');

    // Y el mensaje que escribió llega íntegro al detalle.
    await page.getByRole('link', { name: delFormulario }).click();
    await expect(page.getByText(suMensaje)).toBeVisible();

    await limpiar(delFormulario);
  });

  test('el dashboard lista las solicitudes con su estado', async ({ page }) => {
    await entrarAlPanel(page);

    const fila = page.locator('tr', { hasText: nombre });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText(telefono);
    await expect(fila).toContainText('Alineadores invisibles');
    await expect(fila.locator('.chip')).toHaveText('Nueva');

    // El contador de la cabecera cuenta exactamente las filas que hay en la tabla.
    const filas = await page.locator('tbody tr').count();
    await expect(page.locator('.admin-head p').first()).toContainText(`${filas} solicitud`);
  });

  test('el detalle muestra el mensaje completo y los accesos de contacto', async ({ page }) => {
    await entrarAlPanel(page);
    await page.getByRole('link', { name: nombre }).click();

    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
    await expect(page.getByText(mensaje)).toBeVisible();
    await expect(page.getByText(telefono)).toBeVisible();

    // El teléfono se normaliza a E.164 para que wa.me lo acepte.
    const whatsapp = page.getByRole('link', { name: 'WhatsApp' });
    await expect(whatsapp).toHaveAttribute('href', /wa\.me\/523311223344/);
    await expect(page.getByRole('link', { name: 'Llamar' })).toHaveAttribute(
      'href',
      'tel:+523311223344'
    );

    // Ya no hay correo que mostrar ni botón que lo use.
    await expect(page.getByRole('link', { name: 'Correo' })).toHaveCount(0);
  });

  test('cambiar el estado y guardar notas persiste de verdad', async ({ page }) => {
    await entrarAlPanel(page);
    await page.getByRole('link', { name: nombre }).click();

    await page.getByLabel('Situación de este prospecto').selectOption('agendada');
    await page.getByRole('button', { name: 'Guardar estado' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    const notas = 'Llamé el martes. Prefiere sábados por la mañana.';
    await page.getByLabel('Solo para ti. El prospecto no las ve.').fill(notas);
    await page.getByRole('button', { name: 'Guardar notas' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    // Recargar no basta como prueba: hay que mirar la base.
    const { data } = await clienteAdmin()
      .from('solicitudes')
      .select('estado, notas, creado_en, actualizado_en')
      .eq('nombre', nombre)
      .single();

    expect(data?.estado).toBe('agendada');
    expect(data?.notas).toBe(notas);
    // El trigger de actualizado_en hizo su trabajo.
    expect(new Date(data!.actualizado_en).getTime()).toBeGreaterThan(
      new Date(data!.creado_en).getTime()
    );

    // Y el listado refleja el cambio.
    await page.goto('/admin/prospectos');
    await expect(page.locator('tr', { hasText: nombre }).locator('.chip')).toHaveText('Agendada');
  });

  test('el filtro por estado y la búsqueda encuentran la solicitud', async ({ page }) => {
    await entrarAlPanel(page);

    await page.getByLabel('Buscar').fill(nombre.split(' ').slice(-1)[0]!);
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.locator('tr', { hasText: nombre })).toBeVisible();

    // Filtrada por un estado que no tiene, desaparece.
    await page.goto('/admin/prospectos?estado=descartada');
    await expect(page.locator('tr', { hasText: nombre })).toHaveCount(0);

    await page.goto('/admin/prospectos?estado=nueva');
    await expect(page.locator('tr', { hasText: nombre })).toBeVisible();
  });

  /**
   * Un filtro puesto y una tabla vacía se leen igual que "no hay nada", y ahí es
   * donde uno concluye que el panel está roto teniendo los datos delante. El
   * estado vacío tiene que decir que hay solicitudes escondidas y ofrecer la
   * salida en un clic.
   */
  test('un filtro que no encuentra nada avisa de que hay datos detrás', async ({ page }) => {
    await entrarAlPanel(page);
    // La solicitud sembrada es 'nueva'; este filtro no la alcanza.
    await page.goto('/admin/prospectos?estado=descartada');

    await expect(page.getByText('Nada con ese filtro')).toBeVisible();
    await expect(page.getByText(/Hay \d+ solicitudes? en total/)).toBeVisible();

    await page.getByRole('link', { name: 'Ver todas las solicitudes' }).click();
    await expect(page).toHaveURL(/\/admin\/prospectos$/);
    await expect(page.locator('tr', { hasText: nombre })).toBeVisible();
  });

  test('el enlace de WhatsApp lleva un mensaje armado con el formulario', async ({ page }) => {
    await entrarAlPanel(page);

    const enlace = page.locator('tr', { hasText: nombre }).getByRole('link', { name: 'WhatsApp' });
    const href = await enlace.getAttribute('href');
    const url = new URL(href!);

    // Teléfono normalizado a E.164, que es lo que wa.me espera.
    expect(url.pathname).toBe('/523311223344');

    // Se decodifica el parámetro en vez de buscar subcadenas en el href: así la
    // prueba lee el mensaje que recibe la persona, no su versión escapada.
    const texto = url.searchParams.get('text') ?? '';
    expect(texto).toContain('Hola E2E');
    expect(texto).toContain('Dra. Berenice Parada');
    expect(texto).toContain('alineadores invisibles');
    // Nunca el texto libre: puede llevar datos de salud y esto es una URL.
    expect(texto).not.toContain(mensaje);
  });

  test('sin tratamiento decidido, el mensaje no nombra ninguno', async ({ page }) => {
    const indeciso = nombreDePrueba('indeciso');
    await sembrarSolicitud({
      nombre: indeciso,
      telefono: '3312345678',
      // La quinta opción del formulario: "todavía no sé". Sin el caso especial,
      // el mensaje diría "su solicitud de valoración para aún no estoy seguro/a".
      tratamiento: TRATAMIENTO_SIN_DECIDIR,
    });

    await entrarAlPanel(page);
    const href = await page
      .locator('tr', { hasText: indeciso })
      .getByRole('link', { name: 'WhatsApp' })
      .getAttribute('href');
    const texto = new URL(href!).searchParams.get('text') ?? '';

    expect(texto).toContain('su solicitud de valoración.');
    expect(texto.toLowerCase()).not.toContain('seguro');
    expect(texto).not.toContain('para ');

    await limpiar(indeciso);
  });

  test('al volver de WhatsApp ofrece marcar como contactada', async ({ page, context }) => {
    // El enlace sale del sitio: se corta la petición para que la pestaña nueva
    // no cargue nada, y se cierra en cuanto aparece.
    await context.route('https://wa.me/**', (ruta) => ruta.abort());
    await entrarAlPanel(page);

    const emergente = context.waitForEvent('page');
    await page.locator('tr', { hasText: nombre }).getByRole('link', { name: 'WhatsApp' }).click();
    await (await emergente).close();

    // El script exige 1,5 s desde el clic: un refoco instantáneo significa que
    // WhatsApp no llegó a abrirse.
    await page.waitForTimeout(1700);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    const aviso = page.locator('[data-aviso-contacto]');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText(nombre);

    await aviso.getByRole('button', { name: 'Marcar como contactada' }).click();
    await expect(page.locator('tr', { hasText: nombre }).locator('.chip')).toHaveText('Contactada');

    const { data } = await clienteAdmin()
      .from('solicitudes')
      .select('estado')
      .eq('nombre', nombre)
      .single();
    expect(data?.estado).toBe('contactada');
  });

  test('una solicitud que no existe da 404, no un error del servidor', async ({ page }) => {
    await entrarAlPanel(page);
    const respuesta = await page.goto('/admin/prospectos/00000000-0000-4000-8000-000000000000');
    expect(respuesta?.status()).toBe(404);
  });
});
