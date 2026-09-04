import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export const prerender = false;

/**
 * Cierra el flujo del magic link. No lo protege el middleware: es justo lo que
 * crea la sesión. Las cookies las escribe `setAll` durante el canje.
 *
 * Acepta las dos formas de plantilla de correo de Supabase para no quedar
 * atados a la decisión: `{{ .ConfirmationURL }}` llega con `?code=` (la que
 * usamos, porque respeta el emailRedirectTo de cada petición y sirve igual en
 * local, preview y producción) y `{{ .TokenHash }}` llega con `?token_hash=`.
 */
export const GET: APIRoute = async (context) => {
  const { supabase } = crearClienteServidor(context);

  const code = context.url.searchParams.get('code');
  const tokenHash = context.url.searchParams.get('token_hash');
  const tipo = context.url.searchParams.get('type') as EmailOtpType | null;

  let error: { message: string } | null = { message: 'sin código ni token_hash' };

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo ?? 'email' }));
  }

  if (error) {
    console.error('[admin] canje del enlace falló:', error.message);
    return context.redirect('/admin/login?error=enlace', 303);
  }

  return context.redirect('/admin', 303);
};
