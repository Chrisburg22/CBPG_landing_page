import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cita, Database } from '@/lib/supabase/tipos';
import {
  actualizarEvento,
  cancelarEvento,
  crearEvento,
  ErrorGoogle,
  type Buscador,
} from './calendario';
import { eventoDeCita, planDeSincronizacion } from './plan';
import { guardarUltimoError, sesionValida, type Sesion } from './almacen';

type Cliente = SupabaseClient<Database>;

/**
 * La regla del producto, en un sitio: **la cita ya está guardada cuando esto
 * corre**. Aquí solo se intenta reflejarla en Google.
 *
 * Nada de este archivo lanza hacia arriba. Un fallo se anota en la propia cita
 * (`google_sync = 'error'`, `google_error` con el motivo) y la vida sigue: la
 * agenda del panel es la fuente de verdad y el reintento es un botón, no un
 * requisito para poder trabajar.
 */

export interface Resultado {
  ok: boolean;
  /** Motivo legible cuando `ok` es falso. Vacío si salió bien. */
  error: string;
}

const BIEN: Resultado = { ok: true, error: '' };

/**
 * Refleja una cita en Google. Devuelve si se pudo, nunca lanza.
 *
 * `buscar` se inyecta para las pruebas; en producción es el `fetch` global.
 */
export async function sincronizar(
  supabase: Cliente,
  cita: Cita,
  buscar: Buscador = fetch
): Promise<Resultado> {
  const plan = planDeSincronizacion(cita);

  let sesion: Sesion | null = null;
  try {
    sesion = await sesionValida(buscar);
  } catch (e) {
    return await anotarFallo(supabase, cita.id, mensajeDe(e));
  }

  // Sin calendario conectado no hay nada pendiente: la cita queda
  // `desactivada`, no `error`. Un consultorio que no usa Google no tiene por
  // qué ver un aviso rojo para siempre.
  if (!sesion) {
    await marcar(supabase, cita.id, { google_sync: 'desactivada', google_error: '' });
    return BIEN;
  }

  if (plan === 'nada') {
    await marcar(supabase, cita.id, { google_sync: 'sincronizada', google_error: '' });
    return BIEN;
  }

  try {
    if (plan === 'crear') {
      const eventoId = await crearEvento(buscar, {
        token: sesion.token,
        calendarioId: sesion.calendarioId,
        evento: eventoDeCita(cita),
      });
      await marcar(supabase, cita.id, {
        google_evento_id: eventoId,
        google_sync: 'sincronizada',
        google_error: '',
      });
    } else if (plan === 'actualizar') {
      await actualizarEvento(buscar, {
        token: sesion.token,
        calendarioId: sesion.calendarioId,
        eventoId: cita.google_evento_id,
        evento: eventoDeCita(cita),
      });
      await marcar(supabase, cita.id, { google_sync: 'sincronizada', google_error: '' });
    } else {
      await cancelarEvento(buscar, {
        token: sesion.token,
        calendarioId: sesion.calendarioId,
        eventoId: cita.google_evento_id,
      });
      // El evento ya no existe allá: se olvida su id para que un reintento no
      // vuelva a intentar borrar lo borrado.
      await marcar(supabase, cita.id, {
        google_evento_id: '',
        google_sync: 'sincronizada',
        google_error: '',
      });
    }
    return BIEN;
  } catch (e) {
    const mensaje = mensajeDe(e);
    // Un 401/403 no se arregla reintentando: hay que reconectar el calendario.
    // Anotarlo también en la integración es lo que permite decirlo en la
    // pantalla de ajustes y no solo en una cita suelta.
    if (e instanceof ErrorGoogle && e.reautenticar) {
      await guardarUltimoError(`${mensaje}. Vuelve a conectar el calendario.`);
    }
    return await anotarFallo(supabase, cita.id, mensaje);
  }
}

/**
 * Reintenta todas las que quedaron a medias. Devuelve cuántas se arreglaron y
 * cuántas siguen mal.
 */
export async function reintentar(
  supabase: Cliente,
  citas: Cita[],
  buscar: Buscador = fetch
): Promise<{ hechas: number; fallidas: number }> {
  let hechas = 0;
  let fallidas = 0;
  // En serie y no en paralelo: son pocas, y una ráfaga simultánea contra Google
  // es la forma más rápida de toparse con su límite de peticiones.
  for (const cita of citas) {
    const resultado = await sincronizar(supabase, cita, buscar);
    if (resultado.ok) hechas += 1;
    else fallidas += 1;
  }
  return { hechas, fallidas };
}

function mensajeDe(e: unknown): string {
  if (e instanceof ErrorGoogle) {
    return e.estado === 0 ? `No se pudo contactar a Google: ${e.message}` : e.message;
  }
  return e instanceof Error ? e.message : 'Error desconocido';
}

async function anotarFallo(supabase: Cliente, id: string, mensaje: string): Promise<Resultado> {
  await marcar(supabase, id, { google_sync: 'error', google_error: mensaje.slice(0, 500) });
  return { ok: false, error: mensaje };
}

/**
 * Escribe el resultado en la cita. Si esto falla, se queda en el registro y ya:
 * la cita sigue existiendo, que es lo que importa, y el peor caso es que el
 * panel enseñe un estado de sincronización desfasado hasta el siguiente intento.
 */
async function marcar(
  supabase: Cliente,
  id: string,
  cambios: Partial<Pick<Cita, 'google_evento_id' | 'google_sync' | 'google_error'>>
): Promise<void> {
  const { error } = await supabase.from('citas').update(cambios).eq('id', id);
  if (error) console.error('[google] no se pudo anotar la sincronización:', error.message);
}
