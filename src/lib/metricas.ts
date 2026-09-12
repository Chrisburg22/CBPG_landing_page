import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EstadoCita } from './supabase/tipos';
import { sumar } from './formato';
import { diaEnMexico, limitesDelRango, sumarDias } from './tiempo';

type Cliente = SupabaseClient<Database>;

/**
 * Los números del tablero.
 *
 * Todos se calculan en el momento a partir de las tablas, sin ningún contador
 * guardado. Un contador que se incrementa a mano se desincroniza el primer día
 * que alguien corrija una fila desde la consola, y un número que miente es peor
 * que no tenerlo.
 */

export type Periodo = '7d' | '30d' | 'mes' | '90d';

export const PERIODOS: readonly Periodo[] = ['7d', '30d', 'mes', '90d'];

export const ETIQUETA_PERIODO: Record<Periodo, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  mes: 'Este mes',
  '90d': 'Últimos 90 días',
};

export function esPeriodo(valor: unknown): valor is Periodo {
  return typeof valor === 'string' && (PERIODOS as readonly string[]).includes(valor);
}

/** Primer y último día mexicanos del periodo, ambos inclusive. */
export function diasDelPeriodo(periodo: Periodo, hoy = diaEnMexico(new Date())) {
  if (periodo === 'mes') {
    const [anio, mes] = hoy.split('-');
    return { primero: `${anio}-${mes}-01`, ultimo: hoy };
  }
  const dias = periodo === '7d' ? 6 : periodo === '30d' ? 29 : 89;
  return { primero: sumarDias(hoy, -dias), ultimo: hoy };
}

export interface Metricas {
  recibidas: number;
  contactadas: number;
  agendadas: number;
  convertidas: number;
  /** Porcentaje entero. `null` si no hubo solicitudes: 0 % sería mentira. */
  conversion: number | null;
  citasAtendidas: number;
  citasNoAsistio: number;
  /** Solo para la doctora; `null` cuando no se pidió. */
  cobrado: number | null;
  /** Vencido A DÍA DE HOY, no del periodo: una deuda no caduca con el filtro. */
  vencido: number | null;
}

/** Filas creadas dentro del periodo. `hasta` es exclusivo. */
async function contarCreadas(
  supabase: Cliente,
  tabla: 'solicitudes' | 'pacientes',
  desde: string,
  hasta: string
): Promise<number> {
  const { count, error } = await supabase
    .from(tabla)
    .select('id', { count: 'exact', head: true })
    .gte('creado_en', desde)
    .lt('creado_en', hasta);
  if (error) throw new Error(`No se pudieron contar ${tabla}: ${error.message}`);
  return count ?? 0;
}

/**
 * Citas del periodo en un estado dado.
 *
 * Filtra por `inicia_en` y no por `creado_en`: «atendidas esta semana» son las
 * que ocurrieron esta semana, no las que se apuntaron esta semana para dentro
 * de un mes.
 */
async function contarCitas(
  supabase: Cliente,
  estado: EstadoCita,
  desde: string,
  hasta: string
): Promise<number> {
  const { count, error } = await supabase
    .from('citas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', estado)
    .gte('inicia_en', desde)
    .lt('inicia_en', hasta);
  if (error) throw new Error(`No se pudieron contar las citas: ${error.message}`);
  return count ?? 0;
}

/**
 * Cuántos prospectos DISTINTOS se contactaron en el periodo.
 *
 * Se cuentan acciones y no estados porque el estado solo dice cómo está hoy: un
 * prospecto contactado en marzo y descartado en abril no aparecería en ninguna
 * parte. El precio es que los prospectos anteriores a esta versión no tienen
 * acciones registradas y no suman aquí; el número arranca desde que existe el
 * historial, y decirlo en pantalla es más honesto que rellenarlo a ojo.
 */
async function contactadas(supabase: Cliente, desde: string, hasta: string): Promise<number> {
  const { data, error } = await supabase
    .from('acciones_prospecto')
    .select('solicitud_id')
    .in('tipo', ['whatsapp', 'llamada'])
    .gte('creado_en', desde)
    .lt('creado_en', hasta)
    .limit(2000);
  if (error) throw new Error(`No se pudieron contar los contactos: ${error.message}`);
  return new Set((data ?? []).map((fila) => fila.solicitud_id)).size;
}

/** Prospectos distintos con al menos una cita creada en el periodo. */
async function agendadas(supabase: Cliente, desde: string, hasta: string): Promise<number> {
  const { data, error } = await supabase
    .from('citas')
    .select('solicitud_id')
    .not('solicitud_id', 'is', null)
    .gte('creado_en', desde)
    .lt('creado_en', hasta)
    .limit(2000);
  if (error) throw new Error(`No se pudieron contar las citas: ${error.message}`);
  return new Set((data ?? []).map((fila) => fila.solicitud_id)).size;
}

async function cobradoEn(supabase: Cliente, primero: string, ultimo: string): Promise<number> {
  // `pagado_el` es un `date`, no un `timestamptz`: se compara con los días
  // mexicanos tal cual, sin pasar por los límites en UTC.
  const { data, error } = await supabase
    .from('pagos')
    .select('monto')
    .gte('pagado_el', primero)
    .lte('pagado_el', ultimo)
    .limit(2000);
  if (error) throw new Error(`No se pudo sumar lo cobrado: ${error.message}`);
  return sumar((data ?? []).map((fila) => fila.monto));
}

async function vencidoHoy(supabase: Cliente): Promise<number> {
  const { data, error } = await supabase
    .from('vista_saldo_paciente')
    .select('monto_vencido')
    .gt('cuotas_vencidas', 0)
    .limit(500);
  if (error) throw new Error(`No se pudo sumar lo vencido: ${error.message}`);
  return sumar((data ?? []).map((fila) => fila.monto_vencido));
}

/**
 * Todo el tablero de un tirón.
 *
 * `conDinero` decide si se piden las dos cifras de cobranza. Para la
 * recepcionista se omite: RLS le devolvería cero de todos modos, y un «$0
 * cobrado» se lee como un dato, no como «esto no es asunto tuyo».
 */
export async function calcular(
  supabase: Cliente,
  periodo: Periodo,
  conDinero: boolean
): Promise<Metricas> {
  const { primero, ultimo } = diasDelPeriodo(periodo);
  const { desde, hasta } = limitesDelRango(primero, ultimo);

  const [
    recibidas,
    numContactadas,
    numAgendadas,
    convertidas,
    citasAtendidas,
    citasNoAsistio,
    cobrado,
    vencido,
  ] = await Promise.all([
    contarCreadas(supabase, 'solicitudes', desde, hasta),
    contactadas(supabase, desde, hasta),
    agendadas(supabase, desde, hasta),
    contarCreadas(supabase, 'pacientes', desde, hasta),
    contarCitas(supabase, 'atendida', desde, hasta),
    contarCitas(supabase, 'no_asistio', desde, hasta),
    conDinero ? cobradoEn(supabase, primero, ultimo) : Promise.resolve(null),
    conDinero ? vencidoHoy(supabase) : Promise.resolve(null),
  ]);

  return {
    recibidas,
    contactadas: numContactadas,
    agendadas: numAgendadas,
    convertidas,
    conversion: recibidas > 0 ? Math.round((convertidas / recibidas) * 100) : null,
    citasAtendidas,
    citasNoAsistio,
    cobrado,
    vencido,
  };
}
