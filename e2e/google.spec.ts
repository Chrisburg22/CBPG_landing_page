import { expect, test } from '@playwright/test';
import {
  actualizarEvento,
  cancelarEvento,
  crearEvento,
  ErrorGoogle,
  listarCalendarios,
  refrescarToken,
  urlDeAutorizacion,
  type Buscador,
} from '../src/lib/google/calendario';
import { planDeSincronizacion } from '../src/lib/google/plan';
import { deMexicoAIso, diaEnMexico, finDeCita, limitesDelDia, lunesDeLaSemana } from '../src/lib/tiempo';

/**
 * El adaptador de Google y las cuentas de horas, contra una API simulada.
 *
 * Sin navegador y sin red: `fetch` se inyecta. Son las dos piezas donde un
 * error no se ve en pantalla —una cita en el calendario equivocado, o a la hora
 * equivocada— y donde probar contra la API de verdad significaría una cuenta de
 * Google por cada quien corra las pruebas.
 */

interface Llamada {
  url: string;
  metodo: string;
  cuerpo: unknown;
  autorizacion: string | null;
}

/** Un `fetch` de mentira que apunta lo que le piden y responde lo que se le diga. */
function simular(respuestas: (Response | Error)[]): { buscar: Buscador; llamadas: Llamada[] } {
  const llamadas: Llamada[] = [];
  let i = 0;

  const buscar = (async (url: string | URL | Request, opciones?: RequestInit) => {
    const cabeceras = new Headers(opciones?.headers);
    llamadas.push({
      url: String(url),
      metodo: opciones?.method ?? 'GET',
      cuerpo: opciones?.body ? intentarJson(String(opciones.body)) : null,
      autorizacion: cabeceras.get('authorization'),
    });
    const siguiente = respuestas[i++] ?? new Response('{}', { status: 200 });
    if (siguiente instanceof Error) throw siguiente;
    return siguiente;
  }) as Buscador;

  return { buscar, llamadas };
}

function intentarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'content-type': 'application/json' },
  });
}

test.describe('adaptador de Google Calendar', () => {
  test('crear manda el evento al calendario y devuelve su id', async () => {
    const { buscar, llamadas } = simular([json({ id: 'evt_123' })]);

    const id = await crearEvento(buscar, {
      token: 'tok',
      calendarioId: 'consultorio@group.calendar.google.com',
      evento: {
        titulo: 'Valoración · Ana',
        inicia_en: '2026-09-11T16:30:00.000Z',
        termina_en: '2026-09-11T17:00:00.000Z',
        descripcion: 'Tel. 33 1234 5678',
        zona: 'America/Mexico_City',
      },
    });

    expect(id).toBe('evt_123');
    const llamada = llamadas[0]!;
    expect(llamada.metodo).toBe('POST');
    expect(llamada.autorizacion).toBe('Bearer tok');
    // El id del calendario lleva @ y puntos: sin codificar, la URL se rompe.
    expect(llamada.url).toContain(
      encodeURIComponent('consultorio@group.calendar.google.com')
    );
    expect(llamada.cuerpo).toMatchObject({
      summary: 'Valoración · Ana',
      start: { dateTime: '2026-09-11T16:30:00.000Z', timeZone: 'America/Mexico_City' },
    });
  });

  test('actualizar usa PATCH para no borrar lo que se añadió desde Google', async () => {
    const { buscar, llamadas } = simular([json({ id: 'evt_123' })]);

    await actualizarEvento(buscar, {
      token: 'tok',
      calendarioId: 'cal',
      eventoId: 'evt_123',
      evento: {
        titulo: 'Control · Ana',
        inicia_en: '2026-09-12T16:30:00.000Z',
        termina_en: '2026-09-12T17:00:00.000Z',
        descripcion: '',
        zona: 'America/Mexico_City',
      },
    });

    expect(llamadas[0]!.metodo).toBe('PATCH');
    expect(llamadas[0]!.url).toContain('/events/evt_123');
  });

  test('cancelar borra el evento', async () => {
    const { buscar, llamadas } = simular([new Response(null, { status: 204 })]);
    await cancelarEvento(buscar, { token: 'tok', calendarioId: 'cal', eventoId: 'evt_123' });
    expect(llamadas[0]!.metodo).toBe('DELETE');
  });

  test('cancelar un evento que ya no existe no es un fallo', async () => {
    // 404 y 410 significan «allá ya no está», que es justo lo que se quería.
    // Tratarlos como error dejaría la cita marcada como pendiente para siempre.
    for (const estado of [404, 410]) {
      const { buscar } = simular([json({ error: { message: 'Not Found' } }, estado)]);
      await expect(
        cancelarEvento(buscar, { token: 'tok', calendarioId: 'cal', eventoId: 'evt' })
      ).resolves.toBeUndefined();
    }
  });

  test('un error de Google llega con su mensaje y su código', async () => {
    const { buscar } = simular([json({ error: { message: 'Rate Limit Exceeded' } }, 429)]);

    const fallo = await crearEvento(buscar, {
      token: 'tok',
      calendarioId: 'cal',
      evento: {
        titulo: 'x',
        inicia_en: '2026-09-11T16:30:00.000Z',
        termina_en: '2026-09-11T17:00:00.000Z',
        descripcion: '',
        zona: 'America/Mexico_City',
      },
    }).catch((e: unknown) => e);

    expect(fallo).toBeInstanceOf(ErrorGoogle);
    const error = fallo as ErrorGoogle;
    expect(error.estado).toBe(429);
    expect(error.message).toBe('Rate Limit Exceeded');
    // 429 se reintenta; solo 401/403 exigen volver a conectar la cuenta.
    expect(error.reautenticar).toBe(false);
  });

  test('un 401 pide reconectar, no reintentar', async () => {
    const { buscar } = simular([json({ error: { message: 'Invalid Credentials' } }, 401)]);
    const fallo = (await cancelarEvento(buscar, {
      token: 'viejo',
      calendarioId: 'cal',
      eventoId: 'evt',
    }).catch((e: unknown) => e)) as ErrorGoogle;
    expect(fallo.reautenticar).toBe(true);
  });

  test('sin red, el error no trae código de estado', async () => {
    const { buscar } = simular([new TypeError('fetch failed')]);
    const fallo = (await refrescarToken(buscar, {
      refreshToken: 'r',
      clientId: 'c',
      clientSecret: 's',
    }).catch((e: unknown) => e)) as ErrorGoogle;

    expect(fallo).toBeInstanceOf(ErrorGoogle);
    // 0 distingue «no llegamos a Google» de cualquier respuesta suya.
    expect(fallo.estado).toBe(0);
  });

  test('solo se ofrecen calendarios donde se puede escribir', async () => {
    const { buscar, llamadas } = simular([
      json({
        items: [
          { id: 'a', summary: 'Consultorio', accessRole: 'owner' },
          { id: 'b', summary: 'Festivos', accessRole: 'reader' },
        ],
      }),
    ]);

    const lista = await listarCalendarios(buscar, 'tok');
    expect(llamadas[0]!.url).toContain('minAccessRole=writer');
    expect(lista.map((c) => c.id)).toEqual(['a', 'b']);
    expect(lista[0]!.escribible).toBe(true);
    expect(lista[1]!.escribible).toBe(false);
  });

  test('la URL de autorización pide refresh token y lleva el state', () => {
    const url = new URL(
      urlDeAutorizacion({
        clientId: 'cliente.apps.googleusercontent.com',
        redirectUri: 'https://ejemplo.mx/admin/integracion/google/callback',
        estado: 'abc-123',
      })
    );

    // Sin estos dos, la segunda autorización no devuelve refresh token y el
    // calendario se desconecta solo a la hora.
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('state')).toBe('abc-123');
    expect(url.searchParams.get('scope')).toContain('calendar.events');
  });
});

test.describe('qué hacer con cada cita', () => {
  test('sin evento se crea; con evento se actualiza', () => {
    expect(planDeSincronizacion({ estado: 'programada', google_evento_id: '' })).toBe('crear');
    expect(planDeSincronizacion({ estado: 'confirmada', google_evento_id: 'evt' })).toBe(
      'actualizar'
    );
  });

  test('cancelada con evento se borra; cancelada sin evento no hace nada', () => {
    expect(planDeSincronizacion({ estado: 'cancelada', google_evento_id: 'evt' })).toBe(
      'cancelar'
    );
    expect(planDeSincronizacion({ estado: 'cancelada', google_evento_id: '' })).toBe('nada');
  });
});

test.describe('horas de la agenda', () => {
  test('la hora tecleada se guarda como el instante mexicano correcto', () => {
    // 16:30 en México son las 22:30 UTC (−06:00). Sin la conversión explícita,
    // el servidor de Vercel —que corre en UTC— la guardaría a las 16:30 UTC y
    // la cita aparecería seis horas antes.
    expect(deMexicoAIso('2026-09-11T16:30')).toBe('2026-09-11T22:30:00.000Z');
  });

  test('ida y vuelta: lo guardado vuelve a ser la misma hora de pared', () => {
    const iso = deMexicoAIso('2026-01-05T08:00');
    expect(iso).not.toBeNull();
    expect(diaEnMexico(iso!)).toBe('2026-01-05');
  });

  test('una cadena que no es fecha devuelve null en vez de una fecha inventada', () => {
    expect(deMexicoAIso('')).toBeNull();
    expect(deMexicoAIso('mañana')).toBeNull();
  });

  test('el día mexicano no se adelanta con las citas de la tarde', () => {
    // 19:00 en México ya es el día siguiente en UTC: el agrupado por día tiene
    // que seguir diciendo el 11.
    const iso = deMexicoAIso('2026-09-11T19:00')!;
    expect(iso.startsWith('2026-09-12')).toBe(true);
    expect(diaEnMexico(iso)).toBe('2026-09-11');
  });

  test('los límites del día cubren de medianoche a medianoche', () => {
    const { desde, hasta } = limitesDelDia('2026-09-11');
    expect(desde).toBe('2026-09-11T06:00:00.000Z');
    expect(hasta).toBe('2026-09-12T06:00:00.000Z');
  });

  test('la semana empieza en lunes', () => {
    expect(lunesDeLaSemana('2026-09-11')).toBe('2026-09-07'); // viernes → lunes
    expect(lunesDeLaSemana('2026-09-07')).toBe('2026-09-07'); // lunes → él mismo
    expect(lunesDeLaSemana('2026-09-13')).toBe('2026-09-07'); // domingo → su lunes
  });

  test('el fin de la cita es el inicio más su duración', () => {
    expect(finDeCita('2026-09-11T22:30:00.000Z', 45)).toBe('2026-09-11T23:15:00.000Z');
  });
});
