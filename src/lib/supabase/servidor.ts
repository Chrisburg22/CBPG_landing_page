import { createServerClient } from '@supabase/ssr';
import { parseCookie } from 'cookie';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from 'astro:env/server';
import type { APIContext } from 'astro';
import type { Database } from './tipos';

/**
 * Cliente atado a la sesión de la petición en curso. Sujeto a RLS.
 *
 * Un cliente por petición, nunca a nivel de módulo: ver el comentario de
 * `servicio.ts`, aquí el riesgo es peor porque lo que se filtraría es la sesión.
 *
 * Usa `parseCookie` de `cookie@2` —el mismo parser que Astro por dentro— en vez
 * de `parseCookieHeader` de @supabase/ssr, que devuelve `value: string |
 * undefined` y no satisface `GetAllCookies` bajo tsconfig strictest. Ojo:
 * `cookie` está en package.json como dependencia directa para que la copia raíz
 * de node_modules sea la v2 que Astro necesita; @supabase/ssr recibe su v1
 * anidada. No fijar `cookie` con pnpm.overrides: las dos APIs son disjuntas y
 * cualquier versión única rompe a uno de los dos.
 */
export function crearClienteServidor(context: APIContext) {
  /** Cabeceras anti-caché que la librería pide aplicar cuando refresca el token. */
  const cabecerasAuth: Record<string, string> = {};

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        const crudas = parseCookie(context.request.headers.get('cookie') ?? '');
        return Object.entries(crudas).map(([name, value]) => ({ name, value: value ?? '' }));
      },
      setAll(aEscribir, cabeceras) {
        for (const { name, value, options } of aEscribir) {
          context.cookies.set(name, value, { ...options, path: options.path ?? '/' });
        }
        if (cabeceras) Object.assign(cabecerasAuth, cabeceras);
      },
    },
  });

  return { supabase, cabecerasAuth };
}
