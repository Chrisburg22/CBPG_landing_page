/// <reference path="../.astro/types.d.ts" />

// Las variables de entorno ya no se declaran aquí: las genera `astro:env` a
// partir del esquema de astro.config.mjs. Importarlas desde 'astro:env/server'.

declare namespace App {
  interface Locals {
    /**
     * Cliente Supabase de la petición en curso, creado por el middleware.
     * Sujeto a RLS: solo ve lo que la usuaria autenticada puede ver.
     * Solo existe bajo /admin/*.
     */
    supabase: import('@supabase/supabase-js').SupabaseClient<
      import('@/lib/supabase/tipos').Database
    >;
    /** Usuaria autenticada Y dentro de la allowlist. `null` si cualquiera de las dos falla. */
    user: import('@supabase/supabase-js').User | null;
  }
}
