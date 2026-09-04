import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from 'astro:env/server';
import type { Database } from './tipos';

/**
 * Cliente con la clave secreta: **bypasa RLS**. Solo desde `/api/*`, nunca
 * desde una página ni un componente.
 *
 * Es una fábrica y no un singleton a propósito: Fluid Compute de Vercel
 * reutiliza la misma instancia de función entre peticiones de personas
 * distintas, y un cliente a nivel de módulo puede filtrar estado de una a otra.
 *
 * No usa `createServerClient` de @supabase/ssr: aquí no hay sesión ni cookies,
 * y así la ruta pública del formulario no depende de esa librería.
 */
export function crearClienteServicio() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
