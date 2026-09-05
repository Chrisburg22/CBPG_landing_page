import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/tipos';
import { contarNuevas } from './solicitudes';

type Cliente = SupabaseClient<Database>;

/** Las cuatro secciones del panel. Marca el elemento activo de la navegación. */
export type SeccionPanel = 'inicio' | 'pacientes' | 'prospectos' | 'pagos';

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
