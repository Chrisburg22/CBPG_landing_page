import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, RecordatorioCobro, TipoRecordatorio } from './supabase/tipos';
import { aE164 } from './contacto-directo';
import { dinero, fechaCorta } from './formato';
import { doctor } from '@/config/site';

type Cliente = SupabaseClient<Database>;

/**
 * Cobranza sin automatizar nada.
 *
 * En V1 no hay WhatsApp Cloud API ni mensajes programados: el consultorio abre
 * WhatsApp en su propio teléfono y manda el texto. Lo único que la aplicación
 * puede registrar con honestidad es que la doctora dio el recordatorio por
 * enviado — no que llegó, ni que lo leyeron. Para eso sirve esta tabla: para no
 * cobrarle dos veces al mismo paciente el mismo día.
 */

/**
 * El texto que se abre prellenado.
 *
 * Sin diagnóstico, sin tratamiento y sin plan: es un mensaje de cobro y va por
 * una URL, así que solo lleva el número de mensualidad, el importe y la fecha.
 */
export function mensajeCobro(datos: {
  nombre: string;
  numero: number;
  restante: string;
  venceEl: string;
  vencida: boolean;
}): string {
  const primerNombre = datos.nombre.trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola ${primerNombre}` : 'Hola';
  const cuando = datos.vencida
    ? `venció el ${fechaCorta(datos.venceEl)}`
    : `vence el ${fechaCorta(datos.venceEl)}`;

  return (
    `${saludo}, le escribo del consultorio de la Dra. ${doctor.name}. ` +
    `Le recuerdo su mensualidad ${datos.numero} por ${dinero(datos.restante)}, que ${cuando}. ` +
    `¿Le queda cómodo pasar a cubrirla esta semana?`
  );
}

export function aWhatsappCobro(
  telefono: string,
  datos: Parameters<typeof mensajeCobro>[0]
): string {
  return `https://wa.me/${aE164(telefono)}?text=${encodeURIComponent(mensajeCobro(datos))}`;
}

export async function registrarRecordatorio(
  supabase: Cliente,
  datos: { cuotaId: string; pacienteId: string; tipo?: TipoRecordatorio; nota?: string }
): Promise<void> {
  const { error } = await supabase.from('recordatorios_cobro').insert({
    cuota_id: datos.cuotaId,
    paciente_id: datos.pacienteId,
    tipo: datos.tipo ?? 'whatsapp',
    nota: (datos.nota ?? '').slice(0, 300),
  });
  if (error) throw new Error(`No se pudo registrar el recordatorio: ${error.message}`);
}

/**
 * El último recordatorio de cada cuota, en una sola consulta.
 *
 * Llegan ordenados del más nuevo al más viejo y el `Map` se queda con el
 * primero de cada cuota: pedir uno por fila serían tantas consultas como
 * cuotas vencidas.
 */
export async function ultimoPorCuota(
  supabase: Cliente,
  cuotaIds: string[]
): Promise<Map<string, RecordatorioCobro>> {
  if (cuotaIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('recordatorios_cobro')
    .select('*')
    .in('cuota_id', cuotaIds)
    .order('creado_en', { ascending: false })
    .limit(200);
  if (error) throw new Error(`No se pudieron cargar los recordatorios: ${error.message}`);

  const ultimos = new Map<string, RecordatorioCobro>();
  for (const fila of (data ?? []) as RecordatorioCobro[]) {
    if (!ultimos.has(fila.cuota_id)) ultimos.set(fila.cuota_id, fila);
  }
  return ultimos;
}

/** Historial completo de una cuota, para la ficha del paciente. */
export async function porCuota(
  supabase: Cliente,
  cuotaId: string
): Promise<RecordatorioCobro[]> {
  const { data, error } = await supabase
    .from('recordatorios_cobro')
    .select('*')
    .eq('cuota_id', cuotaId)
    .order('creado_en', { ascending: false })
    .limit(50);
  if (error) throw new Error(`No se pudieron cargar los recordatorios: ${error.message}`);
  return (data ?? []) as RecordatorioCobro[];
}
