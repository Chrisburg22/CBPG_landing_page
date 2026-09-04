import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EstadoSolicitud, Solicitud } from './supabase/tipos';
import { ESTADOS } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

/** Techo de filas del listado. Muy por encima del volumen real de un consultorio. */
const LIMITE_LISTADO = 200;

export interface FiltroListado {
  estado?: EstadoSolicitud | undefined;
  busqueda?: string | undefined;
}

/** `true` si el valor es uno de los cuatro estados. Para validar querystrings y formularios. */
export function esEstado(valor: unknown): valor is EstadoSolicitud {
  return typeof valor === 'string' && (ESTADOS as readonly string[]).includes(valor);
}

/**
 * El filtro `or` de PostgREST se escribe como una cadena delimitada por comas y
 * paréntesis. Meter texto del usuario sin limpiar deja cambiar la consulta, así
 * que fuera todo lo que tenga significado sintáctico.
 */
function limpiarBusqueda(bruto: string): string {
  return bruto
    .replace(/[,()*\\"']/g, ' ')
    .trim()
    .slice(0, 80);
}

/** Las columnas del listado. `mensaje` no se trae: no se muestra y puede llevar datos de salud. */
const COLUMNAS_LISTADO =
  'id, creado_en, nombre, telefono, email, tratamiento, estado, notificada';

export type SolicitudListado = Pick<
  Solicitud,
  'id' | 'creado_en' | 'nombre' | 'telefono' | 'email' | 'tratamiento' | 'estado' | 'notificada'
>;

export async function listar(
  supabase: Cliente,
  filtro: FiltroListado = {}
): Promise<SolicitudListado[]> {
  let consulta = supabase
    .from('solicitudes')
    .select(COLUMNAS_LISTADO)
    .order('creado_en', { ascending: false })
    .limit(LIMITE_LISTADO);

  if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);

  const busqueda = filtro.busqueda ? limpiarBusqueda(filtro.busqueda) : '';
  if (busqueda) {
    consulta = consulta.or(
      `nombre.ilike.%${busqueda}%,email.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`
    );
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo listar: ${error.message}`);
  return (data ?? []) as SolicitudListado[];
}

/** Cuántas quedan sin atender. Alimenta el contador de la barra. */
export async function contarNuevas(supabase: Cliente): Promise<number> {
  const { count, error } = await supabase
    .from('solicitudes')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'nueva');
  if (error) throw new Error(`No se pudo contar: ${error.message}`);
  return count ?? 0;
}

/** `null` si no existe o si RLS la oculta: para quien consulta, son lo mismo. */
export async function obtener(supabase: Cliente, id: string): Promise<Solicitud | null> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar la solicitud: ${error.message}`);
  return (data as Solicitud | null) ?? null;
}

export async function cambiarEstado(
  supabase: Cliente,
  id: string,
  estado: EstadoSolicitud
): Promise<void> {
  const { error } = await supabase.from('solicitudes').update({ estado }).eq('id', id);
  if (error) throw new Error(`No se pudo cambiar el estado: ${error.message}`);
}

export async function guardarNotas(supabase: Cliente, id: string, notas: string): Promise<void> {
  const { error } = await supabase
    .from('solicitudes')
    .update({ notas: notas.slice(0, 4000) })
    .eq('id', id);
  if (error) throw new Error(`No se pudieron guardar las notas: ${error.message}`);
}

/** Formato corto para la tabla; largo para el detalle. Siempre hora de Ciudad de México. */
export function fecha(iso: string, largo = false): string {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: largo ? 'long' : 'medium',
    timeStyle: 'short',
  });
}
