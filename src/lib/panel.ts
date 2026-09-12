import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Rol } from './supabase/tipos';
import { contarNuevas } from './solicitudes';

type Cliente = SupabaseClient<Database>;

/** Las secciones del panel. Marca el elemento activo de la navegación. */
export type SeccionPanel = 'inicio' | 'agenda' | 'pacientes' | 'prospectos' | 'pagos';

/**
 * Qué secciones ve cada rol.
 *
 * Es la misma frontera que impone `puedeVer()` en el middleware, dicha en
 * términos de navegación. Que estén separadas no es duplicación: esta lista
 * decide qué se dibuja y aquella decide qué se sirve, y la única que protege
 * datos es la de RLS. Si alguna vez discrepan, la que manda es la base.
 */
export const SECCIONES_POR_ROL: Record<Rol, readonly SeccionPanel[]> = {
  doctora: ['inicio', 'agenda', 'prospectos', 'pacientes', 'pagos'],
  recepcionista: ['inicio', 'agenda', 'prospectos'],
};

/**
 * Contador del punto sobre «Prospectos», para el layout.
 *
 * Devuelve `null` en vez de lanzar: que la base esté caída no puede tumbar la
 * navegación entera. Sin número, el punto simplemente no se dibuja.
 */
export async function contarNuevasParaNavegacion(supabase: Cliente): Promise<number | null> {
  try {
    return await contarNuevas(supabase);
  } catch (e) {
    console.error(
      '[admin] no se pudo contar las nuevas:',
      e instanceof Error ? e.message : 'desconocido'
    );
    return null;
  }
}
