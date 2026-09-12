import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Rol } from './supabase/tipos';

type Cliente = SupabaseClient<Database>;

export function esRol(valor: unknown): valor is Rol {
  return valor === 'doctora' || valor === 'recepcionista';
}

/**
 * El rol de quien está navegando, leído de `admins`.
 *
 * Va con el cliente de la petición (sujeto a RLS) y no con la clave secreta: la
 * política «cada quien ve solo su fila» ya garantiza que nadie lea el rol ajeno,
 * y así esta consulta no puede convertirse por accidente en una puerta trasera.
 *
 * `null` significa «no hay fila en admins»: puede pasar si alguien está en
 * ADMIN_EMAILS pero nunca se le dio de alta en la tabla. Ese caso ya no veía
 * ningún dato — RLS lo bloqueaba todo—, pero sin rol tampoco debe pasar del
 * acceso, porque el panel no sabría qué enseñarle.
 */
export async function obtenerRol(supabase: Cliente, userId: string): Promise<Rol | null> {
  const { data, error } = await supabase
    .from('admins')
    .select('rol')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el rol: ${error.message}`);
  return esRol(data?.rol) ? data.rol : null;
}

/**
 * Rutas que solo abre la doctora.
 *
 * Se comparan como prefijo de ruta normalizada, así que `/admin/pagos` cubre
 * también `/admin/pagos/nuevo`. La lista es de PREFIJOS y no de páginas para que
 * una página nueva bajo una de estas secciones nazca protegida en vez de nacer
 * abierta y esperar a que alguien se acuerde de añadirla.
 *
 * No sustituye a RLS: la base ya le devuelve cero filas a la recepcionista en
 * pacientes, planes, cuotas, pagos y recordatorios. Esto evita que llegue a una
 * pantalla vacía y sin explicación, y corta la petición antes de consultar nada.
 */
export const SOLO_DOCTORA = [
  '/admin/pacientes',
  '/admin/pagos',
  '/admin/integracion',
  // La conversión crea una ficha de paciente: es el mismo dato con otra puerta.
  '/admin/prospectos/convertir',
] as const;

/**
 * `/admin/prospectos/<id>/convertir` no encaja en una comparación por prefijo
 * simple porque el id va en medio. Se reconoce aparte.
 */
const CONVERTIR = /^\/admin\/prospectos\/[^/]+\/convertir$/;

export function puedeVer(rol: Rol, ruta: string): boolean {
  if (rol === 'doctora') return true;
  if (CONVERTIR.test(ruta)) return false;
  return !SOLO_DOCTORA.some((prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
}
