import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EstadoPaciente, Paciente } from './supabase/tipos';
import { ESTADOS_PACIENTE } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

/** Mismo techo que el listado de solicitudes, y por el mismo motivo. */
const LIMITE_LISTADO = 200;

export interface FiltroPacientes {
  estado?: EstadoPaciente | undefined;
  busqueda?: string | undefined;
}

export function esEstadoPaciente(valor: unknown): valor is EstadoPaciente {
  return typeof valor === 'string' && (ESTADOS_PACIENTE as readonly string[]).includes(valor);
}

/**
 * Igual que en `solicitudes.ts`: el filtro `or` de PostgREST es una cadena con
 * significado sintáctico, así que fuera todo lo que pueda alterar la consulta.
 */
function limpiarBusqueda(bruto: string): string {
  return bruto
    .replace(/[,()*\\"']/g, ' ')
    .trim()
    .slice(0, 80);
}

/** `notas` no se trae al listado: no se muestra y puede llevar datos de salud. */
const COLUMNAS_LISTADO = 'id, nombre, telefono, tratamiento, estado, inicio';

export type PacienteListado = Pick<
  Paciente,
  'id' | 'nombre' | 'telefono' | 'tratamiento' | 'estado' | 'inicio'
>;

export async function listar(
  supabase: Cliente,
  filtro: FiltroPacientes = {}
): Promise<PacienteListado[]> {
  let consulta = supabase
    .from('pacientes')
    .select(COLUMNAS_LISTADO)
    // Por inicio y no por creado_en: la doctora piensa en cuándo empezó el
    // tratamiento, no en cuándo se tecleó la ficha.
    .order('inicio', { ascending: false })
    .limit(LIMITE_LISTADO);

  if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);

  const busqueda = filtro.busqueda ? limpiarBusqueda(filtro.busqueda) : '';
  if (busqueda) {
    consulta = consulta.or(`nombre.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo listar los pacientes: ${error.message}`);
  return (data ?? []) as PacienteListado[];
}

export async function contarActivos(supabase: Cliente): Promise<number> {
  const { count, error } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'activo');
  if (error) throw new Error(`No se pudo contar los pacientes: ${error.message}`);
  return count ?? 0;
}

export async function contarTodos(supabase: Cliente): Promise<number> {
  const { count, error } = await supabase
    .from('pacientes')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(`No se pudo contar los pacientes: ${error.message}`);
  return count ?? 0;
}

/** `null` si no existe o si RLS lo oculta: desde fuera son lo mismo. */
export async function obtener(supabase: Cliente, id: string): Promise<Paciente | null> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el paciente: ${error.message}`);
  return (data as Paciente | null) ?? null;
}

/**
 * El paciente que salió de esta solicitud, si ya se convirtió.
 *
 * La ficha del prospecto la usa para dos cosas: enlazar al paciente y no volver
 * a ofrecer «Convertir». `solicitud_id` es UNIQUE, así que hay como mucho uno.
 */
export async function porSolicitud(
  supabase: Cliente,
  solicitudId: string
): Promise<Pick<Paciente, 'id' | 'nombre'> | null> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre')
    .eq('solicitud_id', solicitudId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo comprobar la conversión: ${error.message}`);
  return data ?? null;
}

export interface DatosPaciente {
  nombre: string;
  telefono: string;
  tratamiento: string;
  estado: EstadoPaciente;
  inicio: string;
  notas: string;
}

/**
 * Convierte una solicitud en paciente: crea la ficha y deja la solicitud en
 * `terminado`.
 *
 * No hay transacción porque PostgREST no expone una, así que el orden importa:
 * primero el insert, después el update. Si falla el insert, no se ha tocado
 * nada. Si falla el update, queda un paciente creado y una solicitud que sigue
 * en su estado anterior — visible y arreglable a mano desde el panel, que es
 * mucho mejor que el caso contrario (solicitud marcada como terminada sin
 * paciente detrás, que nadie detectaría).
 *
 * La UNIQUE sobre `solicitud_id` es la red de seguridad real: dos envíos del
 * formulario no crean dos pacientes, el segundo falla en la base.
 */
export async function crearDesdeSolicitud(
  supabase: Cliente,
  solicitudId: string,
  datos: DatosPaciente
): Promise<string> {
  const { data, error } = await supabase
    .from('pacientes')
    .insert({ ...datos, solicitud_id: solicitudId })
    .select('id')
    .single();

  if (error) {
    // 23505 es unique_violation: alguien ya convirtió esta solicitud, casi
    // seguro con un doble clic o una pestaña duplicada.
    if (error.code === '23505') {
      throw new Error('Esta solicitud ya se convirtió en paciente.');
    }
    throw new Error(`No se pudo crear el paciente: ${error.message}`);
  }

  const { error: errorEstado } = await supabase
    .from('solicitudes')
    .update({ estado: 'terminado' })
    .eq('id', solicitudId);

  if (errorEstado) {
    // El paciente sí se creó: decirlo importa, porque reintentar la conversión
    // fallará por la UNIQUE y sin este aviso parecería que no se hizo nada.
    console.error('[admin] paciente creado pero la solicitud no pasó a terminado:', errorEstado.message);
  }

  return data.id;
}

/**
 * Alta directa, sin solicitud detrás.
 *
 * No todo paciente llega por el formulario: los hay por recomendación, o que ya
 * estaban en tratamiento antes de que el panel existiera. `solicitud_id` se
 * queda en nulo, y la ficha lo muestra como «Alta directa».
 */
export async function crear(supabase: Cliente, datos: DatosPaciente): Promise<string> {
  const { data, error } = await supabase
    .from('pacientes')
    .insert({ ...datos, solicitud_id: null })
    .select('id')
    .single();
  if (error) throw new Error(`No se pudo crear el paciente: ${error.message}`);
  return data.id;
}

/** Para el selector de paciente al registrar un pago. */
export async function paraSelector(
  supabase: Cliente
): Promise<Pick<Paciente, 'id' | 'nombre' | 'tratamiento'>[]> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre, tratamiento')
    // Alfabético: en un desplegable se busca por nombre, no por fecha de alta.
    .order('nombre', { ascending: true })
    .limit(LIMITE_LISTADO);
  if (error) throw new Error(`No se pudo cargar la lista de pacientes: ${error.message}`);
  return data ?? [];
}

export async function actualizar(
  supabase: Cliente,
  id: string,
  datos: Partial<DatosPaciente>
): Promise<void> {
  const { error } = await supabase.from('pacientes').update(datos).eq('id', id);
  if (error) throw new Error(`No se pudo guardar el paciente: ${error.message}`);
}

export async function guardarNotas(supabase: Cliente, id: string, notas: string): Promise<void> {
  const { error } = await supabase
    .from('pacientes')
    .update({ notas: notas.slice(0, 4000) })
    .eq('id', id);
  if (error) throw new Error(`No se pudieron guardar las notas: ${error.message}`);
}

/** Vive en `formato.ts`: la usan también pagos y cuotas. */
export { fechaCorta } from './formato';
