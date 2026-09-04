import type { APIRoute } from 'astro';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { emailsPermitidos } from '@/lib/admin';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const datos = await context.request.formData();
  const email = String(datos.get('email') ?? '')
    .trim()
    .toLowerCase();

  // La allowlist se comprueba ANTES de tocar Supabase: si no, cualquiera puede
  // quemar la cuota de correo pidiendo enlaces. La respuesta es idéntica a la
  // del caso bueno para no revelar qué correos existen.
  if (!emailsPermitidos().has(email)) {
    console.warn('[admin] enlace pedido para un correo no autorizado');
    return context.redirect('/admin/login?enviado=1', 303);
  }

  // Cliente SSR, no el de servicio: signInWithOtp con PKCE escribe la cookie
  // del code verifier en el navegador. Sin ella, el canje del ?code= falla.
  const { supabase } = crearClienteServidor(context);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Cinturón además de desactivar los registros en el panel de Supabase.
      shouldCreateUser: false,
      // context.url.origin y no Astro.site: así funciona en local y en preview.
      // Supabase valida el destino contra su lista de Redirect URLs de todos modos.
      emailRedirectTo: new URL('/admin/auth/callback', context.url.origin).toString(),
    },
  });

  if (error) {
    console.error('[admin] signInWithOtp falló:', error.message);
    return context.redirect('/admin/login?error=envio', 303);
  }

  return context.redirect('/admin/login?enviado=1', 303);
};
