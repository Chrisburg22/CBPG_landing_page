import { expect, test } from '@playwright/test';
import {
  CLAVE_PUBLICABLE,
  URL_SUPABASE,
  credencialesRecepcion,
  entrarAlPanel,
  limpiar,
  nombreDePrueba,
  sembrarSolicitud,
} from './apoyo';
import { puedeVer } from '../src/lib/roles';

/**
 * Los dos roles.
 *
 * La parte que se puede probar sin cuenta aparte va suelta y siempre corre: qué
 * rutas deja pasar `puedeVer()`. El recorrido completo de la recepcionista
 * necesita una cuenta de verdad, porque entrar al panel exige estar TAMBIÉN en
 * `ADMIN_EMAILS` —una variable del servidor— y una prueba no puede reescribir
 * la configuración con la que ese servidor arrancó.
 *
 * Para activarlo:
 *   1. Crear la cuenta en Supabase Auth y una fila en `admins` con
 *      `rol = 'recepcionista'`.
 *   2. Añadir su correo a `ADMIN_EMAILS`.
 *   3. Poner `E2E_RECEPCION_EMAIL` y `E2E_RECEPCION_PASSWORD` en el `.env`.
 */

test.describe('Fronteras entre roles', () => {
  test('las rutas de la doctora no se abren con rol de recepción', () => {
    for (const ruta of [
      '/admin/pacientes',
      '/admin/pacientes/nuevo',
      '/admin/pacientes/abc-123',
      '/admin/pagos',
      '/admin/pagos/nuevo',
      '/admin/integracion/google',
      '/admin/prospectos/abc-123/convertir',
    ]) {
      expect(puedeVer('recepcionista', ruta), ruta).toBe(false);
      expect(puedeVer('doctora', ruta), ruta).toBe(true);
    }
  });

  test('lo compartido sí se abre con rol de recepción', () => {
    for (const ruta of [
      '/admin',
      '/admin/agenda',
      '/admin/agenda/nueva',
      '/admin/agenda/abc-123',
      '/admin/prospectos',
      '/admin/prospectos/abc-123',
    ]) {
      expect(puedeVer('recepcionista', ruta), ruta).toBe(true);
    }
  });
});

const recepcion = credencialesRecepcion();

test.describe('Recepción, con cuenta real', () => {
  test.skip(
    !recepcion,
    'Sin E2E_RECEPCION_EMAIL / E2E_RECEPCION_PASSWORD. Ver la cabecera de este archivo.'
  );

  test('no ve las secciones de la doctora ni llegando por la URL', async ({ page }) => {
    await entrarAlPanel(page, '/admin', recepcion!);

    // Ni en la navegación...
    await expect(page.getByRole('link', { name: 'Pacientes' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Pagos' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Agenda' })).toBeVisible();

    // ...ni escribiendo la dirección a mano.
    for (const ruta of ['/admin/pacientes', '/admin/pagos', '/admin/integracion/google']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/admin\?acceso=denegado/);
    }
  });

  test('un POST a una sección ajena se corta con 403, no con un redirect', async ({ page }) => {
    await entrarAlPanel(page, '/admin', recepcion!);
    // Un 303 a /admin convertiría la escritura en un GET y parecería que se
    // hizo. El 403 dice lo que pasó.
    const respuesta = await page.request.post('/admin/pagos', {
      form: { id: 'lo-que-sea' },
      maxRedirects: 0,
    });
    expect(respuesta.status()).toBe(403);
  });

  test('la base tampoco le da pacientes, planes ni pagos', async ({ page, request }) => {
    await entrarAlPanel(page, '/admin', recepcion!);

    const cookies = await page.context().cookies();
    const cruda = cookies.find((c) => c.name.includes('auth-token'))?.value ?? '';
    const token: string = JSON.parse(
      Buffer.from(cruda.replace(/^base64-/, ''), 'base64').toString('utf8')
    ).access_token;
    expect(token).toBeTruthy();

    const cabeceras = { apikey: CLAVE_PUBLICABLE(), Authorization: `Bearer ${token}` };

    // Con su propio token válido: RLS devuelve cero filas, no un error. Es la
    // barrera de verdad — la de las rutas solo evita pantallas vacías.
    for (const tabla of ['pacientes', 'planes_tratamiento', 'pagos', 'recordatorios_cobro']) {
      const respuesta = await request.get(`${URL_SUPABASE()}/rest/v1/${tabla}?select=*`, {
        headers: cabeceras,
      });
      expect(respuesta.status(), tabla).toBe(200);
      expect(await respuesta.json(), tabla).toEqual([]);
    }
  });

  test('sí puede trabajar prospectos y agenda', async ({ page }) => {
    const nombre = nombreDePrueba('recepcion');
    const id = await sembrarSolicitud({
      nombre,
      telefono: '3312345678',
      tratamiento: 'Alineadores invisibles',
    });

    await entrarAlPanel(page, `/admin/prospectos/${id}`, recepcion!);
    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();

    // Puede dejar preparado el siguiente paso...
    await page.getByLabel('Cuándo').fill(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    );
    await page.getByLabel('Qué toca').selectOption('llamada');
    await page.getByRole('button', { name: 'Guardar seguimiento' }).click();
    await expect(page.getByText('Guardado.')).toBeVisible();

    // ...y agendar. Lo que no ve es el botón de convertir: eso crea una ficha.
    await expect(page.getByRole('link', { name: 'Convertir en paciente' })).toHaveCount(0);
    await page.getByRole('link', { name: '+ Agendar' }).click();
    await expect(page.getByLabel('Nombre de quien viene')).toHaveValue(nombre);

    await limpiar(nombre);
  });
});
