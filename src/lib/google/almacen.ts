import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from 'astro:env/server';
import { crearClienteServicio } from '@/lib/supabase/servicio';
import type { IntegracionGoogle } from '@/lib/supabase/tipos';
import { cifrar, descifrar, hayClave } from './cripto';
import { refrescarToken, type Buscador, type Tokens } from './calendario';

/**
 * Dónde viven los tokens del calendario y cómo se sacan sin exponerlos.
 *
 * Este es el ÚNICO módulo que usa la clave secreta de Supabase fuera de
 * `/api/*`. `servicio.ts` avisa de que eso normalmente no se hace, y aquí la
 * excepción es deliberada: `integracion_google` tiene RLS sin políticas y sin
 * GRANT precisamente para que el cliente del panel —que lleva la sesión de
 * quien navega— no pueda ni rozarla. Sin la clave secreta no hay forma de
 * leerla, y leerla desde el servidor es todo el punto.
 *
 * La regla que sostiene esto: de aquí nunca sale un token hacia una página. Lo
 * que sale es `resumen()` (sin tokens) o el efecto de una llamada a Google.
 */

/** Lo que el panel puede enseñar: nada de tokens. */
export interface ResumenIntegracion {
  conectado: boolean;
  cuenta: string;
  calendarioId: string;
  calendarioNombre: string;
  conectadoEn: string | null;
  ultimoError: string;
}

/** `true` si la aplicación tiene credenciales para hablar con Google. */
export function hayCredenciales(): boolean {
  return !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET && hayClave();
}

async function fila(): Promise<IntegracionGoogle | null> {
  const { data, error } = await crearClienteServicio()
    .from('integracion_google')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la integración: ${error.message}`);
  return (data as IntegracionGoogle | null) ?? null;
}

export async function resumen(): Promise<ResumenIntegracion> {
  const actual = await fila().catch((e: unknown) => {
    console.error(
      '[google] no se pudo leer la integración:',
      e instanceof Error ? e.message : 'desconocido'
    );
    return null;
  });

  return {
    // Conectado = hay refresh token Y calendario elegido. Con token pero sin
    // calendario no hay a dónde escribir, y decir «conectado» sería mentira.
    conectado: !!actual?.refresh_token_cifrado && !!actual?.calendario_id,
    cuenta: actual?.cuenta ?? '',
    calendarioId: actual?.calendario_id ?? '',
    calendarioNombre: actual?.calendario_nombre ?? '',
    conectadoEn: actual?.conectado_en ?? null,
    ultimoError: actual?.ultimo_error ?? '',
  };
}

/** `true` si hay a dónde sincronizar. Decide si una cita nace «pendiente». */
export async function sincronizacionActiva(): Promise<boolean> {
  if (!hayCredenciales()) return false;
  return (await resumen()).conectado;
}

/**
 * Guarda lo que devolvió la autorización.
 *
 * El refresh token solo llega la primera vez de cada consentimiento: si Google
 * no lo manda, se conserva el que ya había en vez de machacarlo con vacío.
 */
export async function guardarAutorizacion(datos: {
  tokens: Tokens;
  cuenta: string;
}): Promise<void> {
  const anterior = await fila();
  const refresh = datos.tokens.refresh_token
    ? cifrar(datos.tokens.refresh_token)
    : (anterior?.refresh_token_cifrado ?? '');

  const { error } = await crearClienteServicio()
    .from('integracion_google')
    .upsert({
      id: 1,
      cuenta: datos.cuenta,
      refresh_token_cifrado: refresh,
      access_token_cifrado: cifrar(datos.tokens.access_token),
      access_expira_en: expiraEn(datos.tokens.expires_in),
      conectado_en: new Date().toISOString(),
      ultimo_error: '',
    });
  if (error) throw new Error(`No se pudo guardar la autorización: ${error.message}`);
}

export async function guardarCalendario(id: string, nombre: string): Promise<void> {
  const { error } = await crearClienteServicio()
    .from('integracion_google')
    .update({ calendario_id: id, calendario_nombre: nombre, ultimo_error: '' })
    .eq('id', 1);
  if (error) throw new Error(`No se pudo guardar el calendario: ${error.message}`);
}

export async function guardarUltimoError(mensaje: string): Promise<void> {
  const { error } = await crearClienteServicio()
    .from('integracion_google')
    .update({ ultimo_error: mensaje.slice(0, 500) })
    .eq('id', 1);
  if (error) {
    console.error('[google] no se pudo anotar el error:', error.message);
  }
}

/**
 * Corta la conexión.
 *
 * Vacía los tokens en vez de borrar la fila: así el panel puede seguir
 * enseñando de qué cuenta se desconectó y cuándo, en vez de volver a un estado
 * indistinguible de «nunca se conectó».
 */
export async function desconectar(): Promise<void> {
  const { error } = await crearClienteServicio()
    .from('integracion_google')
    .update({
      refresh_token_cifrado: '',
      access_token_cifrado: '',
      access_expira_en: null,
      calendario_id: '',
      calendario_nombre: '',
      conectado_en: null,
      ultimo_error: '',
    })
    .eq('id', 1);
  if (error) throw new Error(`No se pudo desconectar: ${error.message}`);
}

function expiraEn(segundos: number): string {
  // Un minuto de margen: un token que caduca mientras la petición viaja es un
  // 401 que nadie entiende.
  return new Date(Date.now() + Math.max(0, segundos - 60) * 1000).toISOString();
}

export interface Sesion {
  token: string;
  calendarioId: string;
}

/**
 * Un access token utilizable y el calendario destino, o `null` si no hay
 * conexión que valga.
 */
export async function sesionValida(buscar: Buscador = fetch): Promise<Sesion | null> {
  const actual = await fila().catch(() => null);
  if (!actual?.calendario_id) return null;
  const token = await accessToken(buscar);
  return token ? { token, calendarioId: actual.calendario_id } : null;
}

/**
 * Solo el token, sin exigir calendario elegido.
 *
 * Hace falta para el paso intermedio de la conexión: ya se autorizó, pero
 * todavía hay que preguntarle a Google qué calendarios tiene para poder
 * elegir uno.
 *
 * Refresca solo cuando toca y guarda el token nuevo cifrado: sin esto haría
 * falta una vuelta a Google en cada cita, y Google limita esas llamadas.
 */
export async function accessToken(buscar: Buscador = fetch): Promise<string | null> {
  if (!hayCredenciales()) return null;

  const actual = await fila();
  if (!actual?.refresh_token_cifrado) return null;

  const vigente =
    actual.access_expira_en && new Date(actual.access_expira_en).getTime() > Date.now();
  if (vigente) {
    const token = descifrar(actual.access_token_cifrado);
    if (token) return token;
  }

  const refresh = descifrar(actual.refresh_token_cifrado);
  if (!refresh) {
    // Casi seguro: se rotó GOOGLE_TOKEN_KEY. Hay que volver a conectar.
    await guardarUltimoError(
      'No se pudieron descifrar los tokens guardados. Vuelve a conectar el calendario.'
    );
    return null;
  }

  const tokens = await refrescarToken(buscar, {
    refreshToken: refresh,
    clientId: GOOGLE_CLIENT_ID ?? '',
    clientSecret: GOOGLE_CLIENT_SECRET ?? '',
  });

  const { error } = await crearClienteServicio()
    .from('integracion_google')
    .update({
      access_token_cifrado: cifrar(tokens.access_token),
      access_expira_en: expiraEn(tokens.expires_in),
      ...(tokens.refresh_token ? { refresh_token_cifrado: cifrar(tokens.refresh_token) } : {}),
    })
    .eq('id', 1);
  if (error) console.error('[google] no se pudo guardar el token renovado:', error.message);

  return tokens.access_token;
}
