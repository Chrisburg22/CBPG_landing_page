import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cita, Database, EstadoCita, TipoCita } from './supabase/tipos';
import { ESTADOS_CITA, TIPOS_CITA } from './supabase/tipos';
import { limitesDelRango } from './tiempo';

type Cliente = SupabaseClient<Database>;

/** Techo del listado. Un día de consultorio no pasa de dos docenas de citas. */
const LIMITE_LISTADO = 200;

export function esTipoCita(valor: unknown): valor is TipoCita {
  return typeof valor === 'string' && (TIPOS_CITA as readonly string[]).includes(valor);
}

export function esEstadoCita(valor: unknown): valor is EstadoCita {
  return typeof valor === 'string' && (ESTADOS_CITA as readonly string[]).includes(valor);
}

export interface DatosCita {
  solicitud_id: string | null;
  paciente_id: string | null;
  nombre_contacto: string;
  telefono_contacto: string;
  /** Instante UTC en ISO. Se arma con `deMexicoAIso()`, nunca con `new Date(local)`. */
  inicia_en: string;
  duracion_min: number;
  tipo: TipoCita;
  nota: string;
}

export interface FiltroAgenda {
  estado?: EstadoCita | undefined;
  /** `user_id` de quien la creó. */
  responsable?: string | undefined;
}

/**
 * Las citas de un día (o de un rango), ordenadas por hora.
 *
 * El rango se calcula en hora de México y se consulta en UTC: preguntar
 * `inicia_en::date = '2026-09-11'` compararía contra el día UTC y se llevaría
 * las citas de después de las 18:00 al día siguiente.
 */
export async function listarEntre(
  supabase: Cliente,
  primerDia: string,
  ultimoDia: string,
  filtro: FiltroAgenda = {}
): Promise<Cita[]> {
  const { desde, hasta } = limitesDelRango(primerDia, ultimoDia);

  let consulta = supabase
    .from('citas')
    .select('*')
    .gte('inicia_en', desde)
    .lt('inicia_en', hasta)
    .order('inicia_en', { ascending: true })
    .limit(LIMITE_LISTADO);

  if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
  if (filtro.responsable) consulta = consulta.eq('responsable', filtro.responsable);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo cargar la agenda: ${error.message}`);
  return (data ?? []) as Cita[];
}

export function listarDelDia(supabase: Cliente, dia: string, filtro: FiltroAgenda = {}) {
  return listarEntre(supabase, dia, dia, filtro);
}

export async function obtener(supabase: Cliente, id: string): Promise<Cita | null> {
  const { data, error } = await supabase.from('citas').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la cita: ${error.message}`);
  return (data as Cita | null) ?? null;
}

/** Las citas de un prospecto, de la más reciente a la más vieja. */
export async function porSolicitud(supabase: Cliente, solicitudId: string): Promise<Cita[]> {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('inicia_en', { ascending: false })
    .limit(50);
  if (error) throw new Error(`No se pudieron cargar las citas: ${error.message}`);
  return (data ?? []) as Cita[];
}

export async function porPaciente(supabase: Cliente, pacienteId: string): Promise<Cita[]> {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('inicia_en', { ascending: false })
    .limit(50);
  if (error) throw new Error(`No se pudieron cargar las citas: ${error.message}`);
  return (data ?? []) as Cita[];
}

/**
 * Crea la cita EN LA BASE y nada más.
 *
 * La sincronización con Google va aparte, en `@/lib/google/sincronizar`, y
 * siempre después: una cita tiene que sobrevivir a que Google no conteste. Por
 * eso nace con `google_sync = 'pendiente'` y es el adaptador quien la mueve a
 * `sincronizada` o a `error`.
 */
export async function crear(
  supabase: Cliente,
  datos: DatosCita,
  sincronizable: boolean
): Promise<string> {
  const { data, error } = await supabase
    .from('citas')
    .insert({
      ...datos,
      estado: 'programada',
      google_sync: sincronizable ? 'pendiente' : 'desactivada',
    })
    .select('id')
    .single();
  if (error) throw new Error(`No se pudo crear la cita: ${error.message}`);
  return data.id;
}

export interface CambiosCita {
  inicia_en?: string;
  duracion_min?: number;
  tipo?: TipoCita;
  nombre_contacto?: string;
  telefono_contacto?: string;
  nota?: string;
}

export async function actualizar(
  supabase: Cliente,
  id: string,
  cambios: CambiosCita,
  sincronizable: boolean
): Promise<void> {
  const { error } = await supabase
    .from('citas')
    // Cualquier cambio de la cita vuelve a dejar el evento por sincronizar: el
    // de Google ya no coincide con esto hasta que el adaptador lo actualice.
    .update({ ...cambios, ...(sincronizable ? { google_sync: 'pendiente' as const } : {}) })
    .eq('id', id);
  if (error) throw new Error(`No se pudo guardar la cita: ${error.message}`);
}

/**
 * Cambia el estado de asistencia.
 *
 * Cancelar también toca a Google —el evento se borra allá—, así que vuelve a
 * marcar la cita como pendiente de sincronizar. Marcar «atendida» o «no asistió»
 * no: el evento ya pasó y reescribirlo no le dice nada a nadie.
 */
export async function cambiarEstado(
  supabase: Cliente,
  id: string,
  estado: EstadoCita,
  sincronizable: boolean
): Promise<void> {
  const tocaGoogle = sincronizable && estado === 'cancelada';
  const { error } = await supabase
    .from('citas')
    .update({ estado, ...(tocaGoogle ? { google_sync: 'pendiente' as const } : {}) })
    .eq('id', id);
  if (error) throw new Error(`No se pudo cambiar el estado de la cita: ${error.message}`);
}

/** Las que se quedaron sin espejo en Google. Para el botón de reintentar. */
export async function pendientesDeSincronizar(supabase: Cliente, limite = 50): Promise<Cita[]> {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .in('google_sync', ['pendiente', 'error'])
    .order('inicia_en', { ascending: true })
    .limit(limite);
  if (error) throw new Error(`No se pudo revisar la sincronización: ${error.message}`);
  return (data ?? []) as Cita[];
}

export async function contarPendientesDeSincronizar(supabase: Cliente): Promise<number> {
  const { count, error } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .in('google_sync', ['pendiente', 'error']);
  if (error) throw new Error(`No se pudo revisar la sincronización: ${error.message}`);
  return count ?? 0;
}

/**
 * Convierte lo tecleado en una duración válida, o `null`.
 *
 * El CHECK de la tabla ya la acota entre 5 y 480 minutos; esto lo repite aquí
 * para poder decirlo en español en vez de devolver el error de Postgres.
 */
export function aDuracion(bruto: string): number | null {
  const numero = Number(bruto.trim());
  if (!Number.isInteger(numero) || numero < 5 || numero > 480) return null;
  return numero;
}
