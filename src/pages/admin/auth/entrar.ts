import type { APIRoute } from 'astro';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { emailsPermitidos } from '@/lib/admin';

export const prerender = false;

/**
 * Acceso con correo y contraseña. Se eligió sobre el enlace mágico porque el
 * consultorio no envía correo de ningún tipo: un magic link sin SMTP es una
 * puerta sin llave.
 *
 * Contrapartida asumida: recuperar la contraseña no es autoservicio. Se repone
 * a mano desde Supabase, que para una sola usuaria es aceptable.
 */
export const POST: APIRoute = async (context) => {
  const datos = await context.request.formData();
  const email = String(datos.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(datos.get('password') ?? '');

  if (!email || !password) {
    return context.redirect('/admin/login?error=credenciales', 303);
  }

  // La allowlist se comprueba antes de tocar Supabase: un correo que no está
  // aquí no llega ni a gastar un intento contra el servidor de Auth.
  if (!emailsPermitidos().has(email)) {
    console.warn('[admin] intento de acceso con un correo no autorizado');
    return context.redirect('/admin/login?error=credenciales', 303);
  }

  const { supabase } = crearClienteServidor(context);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mismo mensaje para "no existe" y "contraseña mala": distinguirlos deja
    // averiguar qué cuentas existen.
    console.warn('[admin] acceso rechazado:', error.message);
    return context.redirect('/admin/login?error=credenciales', 303);
  }

  return context.redirect('/admin', 303);
};
