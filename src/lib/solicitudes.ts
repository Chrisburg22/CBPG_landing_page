import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EstadoSolicitud, OrigenProspecto, Solicitud } from './supabase/tipos';
import { ESTADOS } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

/** Techo de filas del listado. Muy por encima del volumen real de un consultorio. */
const LIMITE_LISTADO = 200;

export interface FiltroListado {
  estado?: EstadoSolicitud | undefined;
  busqueda?: string | undefined;
  origen?: OrigenProspecto | undefined;
  /** Solo las que tienen una próxima acción cuya fecha ya pasó. */
  seguimientoVencido?: boolean | undefined;
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
// En una sola cadena literal, sin concatenar: postgrest-js deriva el tipo de la
// fila del texto del `select`, y una concatenación lo degrada a `string` — con
// lo que `data` deja de tener forma y el `as` de abajo no compila.
// prettier-ignore
const COLUMNAS_LISTADO = 'id, creado_en, nombre, telefono, tratamiento, estado, origen, proxima_accion_en, proxima_accion_tipo, proxima_accion_nota';

export type SolicitudListado = Pick<
  Solicitud,
  | 'id'
  | 'creado_en'
  | 'nombre'
  | 'telefono'
  | 'tratamiento'
  | 'estado'
  | 'origen'
  | 'proxima_accion_en'
  | 'proxima_accion_tipo'
  | 'proxima_accion_nota'
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
  if (filtro.origen) consulta = consulta.eq('origen', filtro.origen);
  if (filtro.seguimientoVencido) {
    // «Vencido» es anterior a este instante, no al final del día: la cola de
    // Inicio ya enseña lo de hoy, y aquí se busca lo que se quedó atrás.
    consulta = consulta
      .not('proxima_accion_en', 'is', null)
      .lt('proxima_accion_en', new Date().toISOString())
      .neq('estado', 'terminado')
      .neq('estado', 'descartada');
  }

  const busqueda = filtro.busqueda ? limpiarBusqueda(filtro.busqueda) : '';
  if (busqueda) {
    consulta = consulta.or(`nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`);
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

/**
 * Cuántas hay en cada estado, más las de seguimiento vencido, de una sola vez.
 *
 * Una consulta con la columna `estado` y el recuento en memoria, en vez de seis
 * `count` separados: con el volumen de un consultorio sobra, y seis viajes a la
 * base por cada carga del listado no.
 */
export async function contarPorEstado(
  supabase: Cliente
): Promise<{ porEstado: Record<EstadoSolicitud, number>; total: number; vencidas: number }> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('estado, proxima_accion_en')
    .limit(5000);
  if (error) throw new Error(`No se pudo contar: ${error.message}`);

  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<
    EstadoSolicitud,
    number
  >;
  const ahora = Date.now();
  let vencidas = 0;
  for (const fila of data ?? []) {
    if (esEstado(fila.estado)) porEstado[fila.estado] += 1;
    if (
      fila.proxima_accion_en &&
      new Date(fila.proxima_accion_en).getTime() < ahora &&
      fila.estado !== 'terminado' &&
      fila.estado !== 'descartada'
    ) {
      vencidas += 1;
    }
  }
  return { porEstado, total: data?.length ?? 0, vencidas };
}

/** Total sin filtrar. Sirve para decirle a la doctora que su filtro esconde datos. */
export async function contarTodas(supabase: Cliente): Promise<number> {
  const { count, error } = await supabase
    .from('solicitudes')
    .select('id', { count: 'exact', head: true });
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

/**
 * Vive en `formato.ts` desde que el panel tiene más de una tabla: las fechas se
 * escriben igual en solicitudes, pacientes y pagos. Se reexporta aquí para no
 * tocar los sitios que ya la importaban de este módulo.
 */
export { fecha } from './formato';
