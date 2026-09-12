import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { GOOGLE_CLIENT_ID } from 'astro:env/server';
import { urlDeAutorizacion } from '@/lib/google/calendario';
import { hayCredenciales } from '@/lib/google/almacen';

export const prerender = false;

/** Cómo se llama la cookie que lleva el `state` de OAuth mientras dura el viaje. */
export const COOKIE_ESTADO = 'google_oauth_estado';

/** La URI de redirección, derivada del origen de la petición. */
export function redireccionDe(url: URL): string {
  return `${url.origin}/admin/integracion/google/callback`;
}

/**
 * Manda a la doctora a autorizar en Google.
 *
 * El `state` es una defensa contra CSRF: se guarda en una cookie y se compara al
 * volver. Sin él, alguien podría hacer que el consultorio conectara SU
 * calendario —el del atacante— con un enlace preparado, y a partir de ahí leería
 * todas las citas.
 *
 * Solo la doctora llega aquí: el middleware ya bloquea /admin/integracion para
 * recepción.
 */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  if (!hayCredenciales()) {
    return redirect('/admin/integracion/google?error=sin-credenciales', 303);
  }

  const estado = randomUUID();
  cookies.set(COOKIE_ESTADO, estado, {
    httpOnly: true,
    secure: url.protocol === 'https:',
    // `lax` y no `strict`: la vuelta desde Google es una navegación de nivel
    // superior desde otro sitio, y con `strict` el navegador no mandaría la
    // cookie y la comprobación fallaría siempre.
    sameSite: 'lax',
    path: '/admin/integracion',
    maxAge: 600,
  });

  return redirect(
    urlDeAutorizacion({
      clientId: GOOGLE_CLIENT_ID ?? '',
      redirectUri: redireccionDe(url),
      estado,
    }),
    303
  );
};
