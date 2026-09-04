import type { APIRoute } from 'astro';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export const prerender = false;

/**
 * Cerrar sesión es POST y no GET a propósito: así ni un prefetch del navegador
 * ni un `<img src>` en un correo pueden echar a la doctora del panel.
 */
export const POST: APIRoute = async (context) => {
  const { supabase } = crearClienteServidor(context);
  // scope global: invalida también el refresh token en el servidor, no solo
  // la cookie de este navegador.
  await supabase.auth.signOut({ scope: 'global' });
  return context.redirect('/admin/login?salir=1', 303);
};
