import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CuotaConEstado,
  Database,
  MetodoPago,
  Pago,
  Plan,
  SaldoPaciente,
  TipoPago,
} from './supabase/tipos';
import { METODOS_PAGO, TIPOS_PAGO } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

const LIMITE_LISTADO = 200;

export function esTipoPago(valor: unknown): valor is TipoPago {
  return typeof valor === 'string' && (TIPOS_PAGO as readonly string[]).includes(valor);
}

export function esMetodoPago(valor: unknown): valor is MetodoPago {
  return typeof valor === 'string' && (METODOS_PAGO as readonly string[]).includes(valor);
}

/**
 * Convierte lo que se tecleó en un importe válido, o `null`.
 *
 * Acepta lo que la gente escribe de verdad: «2,450.00», «$2450», «2 450». Lo que
 * NO acepta es cero o negativo — un pago de cero no es un pago, y el CHECK de la
 * base lo rechazaría con un error mucho menos legible.
 */
export function aImporte(bruto: string): number | null {
  const limpio = bruto.replace(/[$\s,]/g, '');
  if (!limpio) return null;
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  // Dos decimales: la columna es numeric(10,2) y de todas formas no existe
  // media moneda.
  return Math.round(numero * 100) / 100;
}

/* ---------------------------------------------------------------- Planes */

export interface DatosPlan {
  tratamiento: string;
  costo_total: number;
  enganche: number;
  num_cuotas: number;
  dia_corte: number;
  inicio: string;
}

/**
 * Crea (o rehace) el plan de un paciente junto con sus cuotas.
 *
 * Va por RPC y no por dos inserts porque PostgREST no expone transacciones: un
 * plan sin sus cuotas es un calendario vacío que nadie descubre hasta el primer
 * cobro. La función de Postgres borra el plan anterior si lo había — rehacerlo
 * es la operación normal cuando cambian los términos — y los pagos ya
 * registrados sobreviven, porque su `cuota_id` se pone a NULL en vez de
 * borrarse.
 */
export async function guardarPlan(
  supabase: Cliente,
  pacienteId: string,
  datos: DatosPlan
): Promise<string> {
  const { data, error } = await supabase.rpc('crear_plan_con_cuotas', {
    p_paciente_id: pacienteId,
    p_tratamiento: datos.tratamiento,
    p_costo_total: datos.costo_total,
    p_enganche: datos.enganche,
    p_num_cuotas: datos.num_cuotas,
    p_dia_corte: datos.dia_corte,
    p_inicio: datos.inicio,
  });
  if (error) throw new Error(`No se pudo guardar el plan: ${error.message}`);
  return data as string;
}

export async function obtenerPlan(supabase: Cliente, pacienteId: string): Promise<Plan | null> {
  const { data, error } = await supabase
    .from('planes_tratamiento')
    .select('*')
    .eq('paciente_id', pacienteId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el plan: ${error.message}`);
  return (data as Plan | null) ?? null;
}

export async function borrarPlan(supabase: Cliente, pacienteId: string): Promise<void> {
  const { error } = await supabase
    .from('planes_tratamiento')
    .delete()
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(`No se pudo borrar el plan: ${error.message}`);
}

/* ---------------------------------------------------------------- Saldo */

/** `null` cuando el paciente no tiene plan: no hay saldo que enseñar. */
export async function saldoDe(
  supabase: Cliente,
  pacienteId: string
): Promise<SaldoPaciente | null> {
  const { data, error } = await supabase
    .from('vista_saldo_paciente')
    .select('*')
    .eq('paciente_id', pacienteId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo calcular el saldo: ${error.message}`);
  return (data as SaldoPaciente | null) ?? null;
}

export async function cuotasDe(supabase: Cliente, pacienteId: string): Promise<CuotaConEstado[]> {
  const { data, error } = await supabase
    .from('vista_cuotas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('numero', { ascending: true });
  if (error) throw new Error(`No se pudieron cargar las cuotas: ${error.message}`);
  return (data ?? []) as CuotaConEstado[];
}

/**
 * Lo que hay que cobrar pronto: vencido, más lo que vence en las próximas
 * semanas.
 *
 * El horizonte no es decorativo. Sin él, un plan de dieciocho meses mete sus
 * dieciocho mensualidades en «Por cobrar» —incluidas las de 2027—, y una lista
 * que mezcla lo que se debe hoy con lo que se deberá el año que viene deja de
 * servir para decidir a quién llamar esta semana.
 */
export async function porCobrar(supabase: Cliente, limite = 10, horizonteDias = 45) {
  const limiteFecha = new Date();
  limiteFecha.setDate(limiteFecha.getDate() + horizonteDias);
  const hasta = limiteFecha.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  const { data, error } = await supabase
    .from('vista_cuotas')
    .select('id, paciente_id, numero, monto, restante, vence_el, estado')
    .neq('estado', 'pagada')
    .lte('vence_el', hasta)
    .order('vence_el', { ascending: true })
    .limit(limite);
  if (error) throw new Error(`No se pudo cargar lo pendiente: ${error.message}`);
  return (data ?? []) as Pick<
    CuotaConEstado,
    'id' | 'paciente_id' | 'numero' | 'monto' | 'restante' | 'vence_el' | 'estado'
  >[];
}

/* ---------------------------------------------------------------- Pagos */

export interface DatosPago {
  paciente_id: string;
  cuota_id: string | null;
  tipo: TipoPago;
  concepto: string;
  monto: number;
  metodo: MetodoPago;
  pagado_el: string;
  nota: string;
}

export async function registrar(supabase: Cliente, datos: DatosPago): Promise<string> {
  const { data, error } = await supabase
    .from('pagos')
    // El monto viaja como cadena: `numeric` no pierde precisión y así no
    // dependemos de cómo serialice el número el cliente HTTP.
    .insert({ ...datos, monto: datos.monto.toFixed(2) })
    .select('id')
    .single();
  if (error) throw new Error(`No se pudo registrar el pago: ${error.message}`);
  return data.id;
}

export async function borrar(supabase: Cliente, id: string): Promise<void> {
  const { error } = await supabase.from('pagos').delete().eq('id', id);
  if (error) throw new Error(`No se pudo borrar el pago: ${error.message}`);
}

export async function historialDe(supabase: Cliente, pacienteId: string): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('pagado_el', { ascending: false })
    .limit(LIMITE_LISTADO);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);
  return (data ?? []) as Pago[];
}

export interface FiltroPagos {
  desde?: string | undefined;
  hasta?: string | undefined;
  tipo?: TipoPago | undefined;
  pacienteId?: string | undefined;
}

export type MovimientoPago = Pago & { pacientes: { nombre: string } | null };

/**
 * Movimientos del periodo, con el nombre del paciente resuelto en la misma
 * consulta.
 *
 * El `select` anidado es un join de PostgREST: sin él haría falta una segunda
 * ronda para traducir cada `paciente_id` a un nombre.
 */
export async function listarMovimientos(
  supabase: Cliente,
  filtro: FiltroPagos = {}
): Promise<MovimientoPago[]> {
  let consulta = supabase
    .from('pagos')
    .select('*, pacientes(nombre)')
    .order('pagado_el', { ascending: false })
    .limit(LIMITE_LISTADO);

  if (filtro.desde) consulta = consulta.gte('pagado_el', filtro.desde);
  if (filtro.hasta) consulta = consulta.lte('pagado_el', filtro.hasta);
  if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo);
  if (filtro.pacienteId) consulta = consulta.eq('paciente_id', filtro.pacienteId);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar los pagos: ${error.message}`);
  return (data ?? []) as unknown as MovimientoPago[];
}

/** Primer y último día del mes que contiene `fecha`, en formato 'AAAA-MM-DD'. */
export function limitesDelMes(fecha: string): { desde: string; hasta: string } {
  const [anio, mes] = fecha.split('-').map(Number);
  if (!anio || !mes) return { desde: fecha, hasta: fecha };
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  // Día 0 del mes siguiente es el último del actual, y no hay que saberse
  // cuántos días tiene febrero.
  const ultimo = new Date(anio, mes, 0).getDate();
  return {
    desde: `${anio}-${dosDigitos(mes)}-01`,
    hasta: `${anio}-${dosDigitos(mes)}-${dosDigitos(ultimo)}`,
  };
}
