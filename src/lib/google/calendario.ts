/**
 * Adaptador de Google Calendar: la única parte del panel que sabe hablar HTTP
 * con Google.
 *
 * Todo lo de aquí recibe su `fetch` por parámetro. No es ceremonia: es lo que
 * permite probar creación, actualización, cancelación y fallo de red contra una
 * API simulada, sin cuenta de Google y sin red (ver `e2e/google.spec.ts`).
 *
 * Ninguna función de este archivo toca la base de datos ni decide qué hacer con
 * un error. Eso vive en `sincronizar.ts`, y la separación es a propósito: la
 * regla del producto —una cita nunca se pierde porque Google falle— se lee de
 * un vistazo allí, sin mezclarla con formatos de petición.
 */

export const AMBITOS = [
  // El mínimo para crear, mover y borrar eventos del calendario elegido.
  'https://www.googleapis.com/auth/calendar.events',
  // Solo para listar los calendarios en el selector, sin poder editarlos.
  'https://www.googleapis.com/auth/calendar.readonly',
  // Para enseñar de qué cuenta es el calendario conectado.
  'https://www.googleapis.com/auth/userinfo.email',
] as const;

const OAUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/calendar/v3';
const USUARIO = 'https://www.googleapis.com/oauth2/v2/userinfo';

export type Buscador = typeof fetch;

export class ErrorGoogle extends Error {
  readonly estado: number;
  /** `true` si el token ya no vale: hay que reconectar, no reintentar. */
  readonly reautenticar: boolean;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.name = 'ErrorGoogle';
    this.estado = estado;
    this.reautenticar = estado === 401 || estado === 403;
  }
}

async function pedir<T>(
  buscar: Buscador,
  url: string,
  opciones: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...resto } = opciones;
  let respuesta: Response;
  try {
    respuesta = await buscar(url, {
      ...resto,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (e) {
    // Sin red no hay `status`: el 0 lo distingue de cualquier respuesta de
    // Google, y quien lo reciba sabe que reintentar tiene sentido.
    throw new ErrorGoogle(e instanceof Error ? e.message : 'No se pudo contactar a Google', 0);
  }

  if (!respuesta.ok) {
    // El cuerpo de error de Google trae un mensaje legible; si no se puede
    // leer, el código de estado ya dice bastante.
    let detalle = `HTTP ${respuesta.status}`;
    try {
      const cuerpo = (await respuesta.json()) as { error?: { message?: string } | string };
      const mensaje =
        typeof cuerpo.error === 'string' ? cuerpo.error : (cuerpo.error?.message ?? '');
      if (mensaje) detalle = mensaje;
    } catch {
      /* Respuesta sin JSON: nos quedamos con el código. */
    }
    throw new ErrorGoogle(detalle, respuesta.status);
  }

  // 204 (el DELETE de un evento) no trae cuerpo.
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

/* ------------------------------------------------------------------ OAuth */

/**
 * La URL a la que se manda a la doctora para autorizar.
 *
 * `access_type=offline` + `prompt=consent` es lo que hace que Google entregue un
 * refresh token. Sin los dos, la segunda vez que alguien autorice solo llegará
 * un access token de una hora y el calendario se desconectará solo esa tarde.
 */
export function urlDeAutorizacion(opciones: {
  clientId: string;
  redirectUri: string;
  estado: string;
}): string {
  const parametros = new URLSearchParams({
    client_id: opciones.clientId,
    redirect_uri: opciones.redirectUri,
    response_type: 'code',
    scope: AMBITOS.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: opciones.estado,
  });
  return `${OAUTH}?${parametros.toString()}`;
}

export interface Tokens {
  access_token: string;
  /** Solo llega en la primera autorización de cada consentimiento. */
  refresh_token?: string;
  expires_in: number;
}

export function intercambiarCodigo(
  buscar: Buscador,
  datos: { codigo: string; clientId: string; clientSecret: string; redirectUri: string }
): Promise<Tokens> {
  return pedir<Tokens>(buscar, TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: datos.codigo,
      client_id: datos.clientId,
      client_secret: datos.clientSecret,
      redirect_uri: datos.redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
}

export function refrescarToken(
  buscar: Buscador,
  datos: { refreshToken: string; clientId: string; clientSecret: string }
): Promise<Tokens> {
  return pedir<Tokens>(buscar, TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: datos.refreshToken,
      client_id: datos.clientId,
      client_secret: datos.clientSecret,
      grant_type: 'refresh_token',
    }).toString(),
  });
}

export async function correoDeLaCuenta(buscar: Buscador, token: string): Promise<string> {
  const datos = await pedir<{ email?: string }>(buscar, USUARIO, { token });
  return datos.email ?? '';
}

export interface CalendarioDisponible {
  id: string;
  nombre: string;
  /** Solo los que admiten escritura sirven como destino. */
  escribible: boolean;
}

export async function listarCalendarios(
  buscar: Buscador,
  token: string
): Promise<CalendarioDisponible[]> {
  const datos = await pedir<{
    items?: { id: string; summary?: string; accessRole?: string }[];
  }>(buscar, `${API}/users/me/calendarList?minAccessRole=writer&maxResults=100`, { token });

  return (datos.items ?? []).map((item) => ({
    id: item.id,
    nombre: item.summary ?? item.id,
    escribible: item.accessRole === 'writer' || item.accessRole === 'owner',
  }));
}

/* ----------------------------------------------------------------- Eventos */

export interface EventoCita {
  titulo: string;
  /** Instantes UTC en ISO. */
  inicia_en: string;
  termina_en: string;
  descripcion: string;
  zona: string;
}

function cuerpoEvento(evento: EventoCita) {
  return {
    summary: evento.titulo,
    description: evento.descripcion,
    start: { dateTime: evento.inicia_en, timeZone: evento.zona },
    end: { dateTime: evento.termina_en, timeZone: evento.zona },
  };
}

export async function crearEvento(
  buscar: Buscador,
  datos: { token: string; calendarioId: string; evento: EventoCita }
): Promise<string> {
  const creado = await pedir<{ id: string }>(
    buscar,
    `${API}/calendars/${encodeURIComponent(datos.calendarioId)}/events`,
    {
      method: 'POST',
      token: datos.token,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpoEvento(datos.evento)),
    }
  );
  return creado.id;
}

export async function actualizarEvento(
  buscar: Buscador,
  datos: { token: string; calendarioId: string; eventoId: string; evento: EventoCita }
): Promise<void> {
  // PATCH y no PUT: si alguien añadió invitados o una nota desde Google, un PUT
  // los borraría. Aquí solo mandamos lo que el panel gobierna.
  await pedir(
    buscar,
    `${API}/calendars/${encodeURIComponent(datos.calendarioId)}/events/${encodeURIComponent(datos.eventoId)}`,
    {
      method: 'PATCH',
      token: datos.token,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpoEvento(datos.evento)),
    }
  );
}

/**
 * Borra el evento del calendario.
 *
 * Un 404 o un 410 no son un fallo: significan que allá ya no está, que es justo
 * lo que queríamos. Tratarlos como error dejaría citas canceladas marcadas para
 * siempre como «pendientes de sincronizar».
 */
export async function cancelarEvento(
  buscar: Buscador,
  datos: { token: string; calendarioId: string; eventoId: string }
): Promise<void> {
  try {
    await pedir(
      buscar,
      `${API}/calendars/${encodeURIComponent(datos.calendarioId)}/events/${encodeURIComponent(datos.eventoId)}`,
      { method: 'DELETE', token: datos.token }
    );
  } catch (e) {
    if (e instanceof ErrorGoogle && (e.estado === 404 || e.estado === 410)) return;
    throw e;
  }
}
