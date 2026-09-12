import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AccionProspecto,
  Database,
  OrigenProspecto,
  TipoAccion,
  TipoAccionPendiente,
} from './supabase/tipos';
import { ORIGENES, TIPOS_ACCION_PENDIENTE } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

export function esOrigen(valor: unknown): valor is OrigenProspecto {
  return typeof valor === 'string' && (ORIGENES as readonly string[]).includes(valor);
}

export function esTipoAccionPendiente(valor: unknown): valor is TipoAccionPendiente {
  return (
    typeof valor === 'string' && (TIPOS_ACCION_PENDIENTE as readonly string[]).includes(valor)
  );
}

/**
 * Apunta una acción en el historial del prospecto.
 *
 * **No lanza.** Se llama justo después de algo que sí importa —crear una cita,
 * marcar un contacto, convertir— y perder el apunte es molesto, pero tumbar la
 * operación entera porque el apunte falló lo es mucho más.
 */
export async function registrar(
  supabase: Cliente,
  solicitudId: string,
  tipo: TipoAccion,
  extra: { citaId?: string | null; nota?: string } = {}
): Promise<void> {
  try {
    const { error } = await supabase.from('acciones_prospecto').insert({
      solicitud_id: solicitudId,
      tipo,
      cita_id: extra.citaId ?? null,
      nota: (extra.nota ?? '').slice(0, 500),
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error(
      '[admin] no se pudo registrar la acción:',
      e instanceof Error ? e.message : 'desconocido'
    );
  }
}

export async function historial(
  supabase: Cliente,
  solicitudId: string,
  limite = 30
): Promise<AccionProspecto[]> {
  const { data, error } = await supabase
    .from('acciones_prospecto')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);
  return (data ?? []) as AccionProspecto[];
}

export interface ProximaAccion {
  en: string;
  tipo: TipoAccionPendiente;
  nota: string;
}

export async function guardarProximaAccion(
  supabase: Cliente,
  solicitudId: string,
  accion: ProximaAccion
): Promise<void> {
  const { error } = await supabase
    .from('solicitudes')
    .update({
      proxima_accion_en: accion.en,
      proxima_accion_tipo: accion.tipo,
      proxima_accion_nota: accion.nota.slice(0, 300),
    })
    .eq('id', solicitudId);
  if (error) throw new Error(`No se pudo guardar el seguimiento: ${error.message}`);
}

/** Da por hecha la acción pendiente. Las tres columnas vuelven a su vacío. */
export async function limpiarProximaAccion(
  supabase: Cliente,
  solicitudId: string
): Promise<void> {
  const { error } = await supabase
    .from('solicitudes')
    .update({ proxima_accion_en: null, proxima_accion_tipo: null, proxima_accion_nota: '' })
    .eq('id', solicitudId);
  if (error) throw new Error(`No se pudo cerrar el seguimiento: ${error.message}`);
}

export async function guardarOrigen(
  supabase: Cliente,
  solicitudId: string,
  origen: OrigenProspecto
): Promise<void> {
  const { error } = await supabase.from('solicitudes').update({ origen }).eq('id', solicitudId);
  if (error) throw new Error(`No se pudo guardar el origen: ${error.message}`);
}

export type SeguimientoVencido = {
  id: string;
  nombre: string;
  telefono: string;
  tratamiento: string;
  estado: string;
  proxima_accion_en: string;
  proxima_accion_tipo: TipoAccionPendiente | null;
  proxima_accion_nota: string;
};

/**
 * Seguimientos que tocan ya: los vencidos y los de hoy.
 *
 * El corte es el final del día mexicano, no «ahora»: una acción puesta para hoy
 * a las seis de la tarde tiene que aparecer en la cola desde la mañana, o la
 * cola solo sirve para enterarse tarde.
 */
export async function vencidosOHoy(
  supabase: Cliente,
  finDelDia: string,
  limite = 20
): Promise<SeguimientoVencido[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select(
      'id, nombre, telefono, tratamiento, estado, proxima_accion_en, proxima_accion_tipo, proxima_accion_nota'
    )
    .not('proxima_accion_en', 'is', null)
    .lt('proxima_accion_en', finDelDia)
    // `terminado` fuera: ya es paciente, su seguimiento dejó de ser de captación.
    .neq('estado', 'terminado')
    .neq('estado', 'descartada')
    .order('proxima_accion_en', { ascending: true })
    .limit(limite);
  if (error) throw new Error(`No se pudo cargar el seguimiento: ${error.message}`);
  return (data ?? []) as SeguimientoVencido[];
}
