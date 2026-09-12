import type { APIRoute } from 'astro';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from 'astro:env/server';
import { correoDeLaCuenta, intercambiarCodigo } from '@/lib/google/calendario';
import { guardarAutorizacion } from '@/lib/google/almacen';
import { COOKIE_ESTADO, redireccionDe } from './conectar';

export const prerender = false;

const DESTINO = '/admin/integracion/google';

/**
 * La vuelta desde Google.
 *
 * Orden deliberado: primero se comprueba el `state`, después se canjea el
 * código. Al revés, un enlace preparado por alguien de fuera ya habría gastado
 * una autorización antes de que nos diéramos cuenta.
 */
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const guardado = cookies.get(COOKIE_ESTADO)?.value;
  // De un solo uso: se borra pase lo que pase, para que un reintento tenga que
  // empezar otra vez por «Conectar».
  cookies.delete(COOKIE_ESTADO, { path: '/admin/integracion' });

  const recibido = url.searchParams.get('state');
  if (!guardado || !recibido || guardado !== recibido) {
    return redirect(`${DESTINO}?error=estado`, 303);
  }

  // Google manda `error=access_denied` cuando se cancela la pantalla de permisos.
  if (url.searchParams.get('error')) {
    return redirect(`${DESTINO}?error=cancelado`, 303);
  }

  const codigo = url.searchParams.get('code');
  if (!codigo) return redirect(`${DESTINO}?error=sin-codigo`, 303);

  try {
    const tokens = await intercambiarCodigo(fetch, {
      codigo,
      clientId: GOOGLE_CLIENT_ID ?? '',
      clientSecret: GOOGLE_CLIENT_SECRET ?? '',
      redirectUri: redireccionDe(url),
    });

    // El correo es solo para enseñar de qué cuenta es el calendario. Si Google
    // no lo da, la conexión sigue valiendo: no vale la pena tirarla por eso.
    const cuenta = await correoDeLaCuenta(fetch, tokens.access_token).catch(() => '');

    await guardarAutorizacion({ tokens, cuenta });
  } catch (e) {
    // El mensaje NO viaja en la URL: puede traer detalles del error de Google, y
    // una URL acaba en el historial y en los registros del servidor.
    console.error(
      '[google] no se pudo completar la conexión:',
      e instanceof Error ? e.message : 'desconocido'
    );
    return redirect(`${DESTINO}?error=conexion`, 303);
  }

  // Autorizado, pero todavía sin calendario elegido: eso se hace en la pantalla.
  return redirect(`${DESTINO}?conectado=1`, 303);
};
