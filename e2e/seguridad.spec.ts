import { expect, test } from '@playwright/test';
import {
  CLAVE_PUBLICABLE,
  URL_SUPABASE,
  entrarAlPanel,
  limpiar,
  nombreDePrueba,
  sembrarSolicitud,
} from './apoyo';

test.describe('Barreras del panel', () => {
  test('un POST sin cabecera Origin se rechaza (CSRF)', async ({ request }) => {
    const respuesta = await request.post('/admin/auth/entrar', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: '' },
      form: { email: 'quien@sea.com', password: 'lo-que-sea' },
      maxRedirects: 0,
    });
    // checkOrigin de Astro, activo por defecto. Por eso las mutaciones del panel
    // son formularios HTML y no fetch con JSON: checkOrigin no cubre JSON.
    expect(respuesta.status()).toBe(403);
  });

  test('la clave publicable no puede leer solicitudes', async ({ request }) => {
    const respuesta = await request.get(`${URL_SUPABASE()}/rest/v1/solicitudes?select=*`, {
      headers: { apikey: CLAVE_PUBLICABLE() },
    });
    // 401 y no 403 porque no hay JWT ninguno: PostgREST reserva el 403 para un
    // token válido sin privilegios suficientes, que es lo que prueba el caso de
    // más abajo. Lo que importa aquí es el 42501: falla en la capa de GRANT,
    // antes incluso de que RLS entre a opinar.
    expect(respuesta.status()).toBe(401);
    expect((await respuesta.json()).code).toBe('42501');
  });

  test('la clave publicable no puede insertar ni leer administradoras', async ({ request }) => {
    const insercion = await request.post(`${URL_SUPABASE()}/rest/v1/solicitudes`, {
      headers: { apikey: CLAVE_PUBLICABLE(), 'Content-Type': 'application/json' },
      data: { nombre: 'intruso', telefono: '3300000000', tratamiento: 'Alineadores invisibles' },
    });
    expect(insercion.status()).toBe(401);

    const admins = await request.get(`${URL_SUPABASE()}/rest/v1/admins?select=*`, {
      headers: { apikey: CLAVE_PUBLICABLE() },
    });
    expect(admins.status()).toBe(401);
  });

  test('es_admin no está expuesta como RPC', async ({ request }) => {
    const respuesta = await request.post(`${URL_SUPABASE()}/rest/v1/rpc/es_admin`, {
      headers: { apikey: CLAVE_PUBLICABLE(), 'Content-Type': 'application/json' },
      data: {},
    });
    // Vive en el esquema `privado`, que PostgREST no publica.
    expect(respuesta.status()).toBe(404);
  });

  test('la doctora no puede alterar lo que escribió la paciente', async ({ page, request }) => {
    const nombre = nombreDePrueba('grants');
    const id = await sembrarSolicitud({
      nombre,
      telefono: '3355667788',
      tratamiento: 'Ortodoncia infantil',
    });

    await entrarAlPanel(page);

    // El token real de la sesión, sacado de la cookie que escribió @supabase/ssr.
    const cookies = await page.context().cookies();
    const cruda = cookies.find((c) => c.name.includes('auth-token'))?.value ?? '';
    const json = JSON.parse(
      Buffer.from(cruda.replace(/^base64-/, ''), 'base64').toString('utf8')
    );
    const token: string = json.access_token;
    expect(token).toBeTruthy();

    const cabeceras = {
      apikey: CLAVE_PUBLICABLE(),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const url = `${URL_SUPABASE()}/rest/v1/solicitudes?id=eq.${id}`;

    // Columna prohibida por el GRANT: ni con su propio token.
    const alterar = await request.fetch(url, {
      method: 'PATCH', headers: cabeceras, data: { nombre: 'alterado' },
    });
    expect(alterar.status()).toBe(403);

    // Columna permitida: sí.
    const permitido = await request.fetch(url, {
      method: 'PATCH', headers: cabeceras, data: { estado: 'contactada' },
    });
    expect(permitido.status()).toBe(204);

    // Y borrar no puede nadie desde la API: no hay policy de DELETE.
    const borrar = await request.fetch(url, { method: 'DELETE', headers: cabeceras });
    expect(borrar.status()).toBe(403);

    await limpiar(nombre);
  });

  /**
   * Va la última del archivo a propósito: agota la cuota de la IP y dejaría sin
   * envíos a cualquier prueba posterior. El límite es en memoria del servidor,
   * así que se reinicia solo con el siguiente arranque.
   */
  test('un exceso de envíos seguidos se corta con 429', async ({ request }) => {
    const cuerpo = (n: number) => ({
      nombre: nombreDePrueba(`rafaga-${n}`),
      telefono: '3300000000',
      tratamiento: 'Alineadores invisibles',
      mensaje: '',
      consentimiento: true,
    });

    const codigos: number[] = [];
    for (let n = 0; n < 8; n++) {
      const r = await request.post('/api/contact', { data: cuerpo(n) });
      codigos.push(r.status());
      if (r.status() === 429) break;
    }

    expect(codigos).toContain(429);
    await limpiar();
  });
});
