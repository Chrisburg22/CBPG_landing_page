import { defineMiddleware } from 'astro:middleware';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { emailsPermitidos, normalizarRuta, RUTAS_PUBLICAS_ADMIN } from '@/lib/admin';

export const onRequest = defineMiddleware(async (context, next) => {
  // Con output:'static' el middleware TAMBIÉN corre en build, una vez por ruta
  // prerenderizada. Ahí no hay petición real, ni cookies, ni usuaria: sin esta
  // guardia el build intentaría hablar con Supabase una vez por página.
  if (context.isPrerendered) return next();

  const ruta = normalizarRuta(context.url.pathname);

  // /api/contact no necesita sesión: no pagamos un getUser() por cada envío.
  if (!ruta.startsWith('/admin')) return next();

  const { supabase, cabecerasAuth } = crearClienteServidor(context);
  context.locals.supabase = supabase;

  // getUser(), no getSession(): getSession solo decodifica la cookie, getUser
  // valida el token contra el servidor de Auth. Se llama ANTES de next() para
  // que un refresh alcance a escribir sus cookies mientras la respuesta no existe.
  //
  // El try/catch no es decorativo: si el proyecto de Supabase está pausado o la
  // red falla, esto lanza. Sin capturarlo, un 500 se comería incluso la pantalla
  // de acceso. Degradar a "no autenticada" deja al menos una puerta visible.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (e) {
    console.error('[admin] no se pudo validar la sesión:', e instanceof Error ? e.message : 'desconocido');
  }

  const autorizada = !!user?.email && emailsPermitidos().has(user.email.toLowerCase());
  context.locals.user = autorizada ? user : null;

  if (RUTAS_PUBLICAS_ADMIN.has(ruta)) {
    // Única redirección desde una ruta pública: ya hay sesión y sobra el login.
    if (autorizada && ruta === '/admin/login') return context.redirect('/admin', 302);
  } else if (!autorizada) {
    // Sesión válida pero fuera de la allowlist: la cerramos. Si no, quedaría
    // rebotando entre /admin y /admin/login para siempre.
    if (user) await supabase.auth.signOut();
    return context.redirect('/admin/login', 302);
  }

  const respuesta = await next();

  // Cubre también las respuestas que no son HTML (redirects, endpoints), donde
  // el <meta robots> del layout no existe. Y `no-store` evita que el CDN de
  // Vercel cachee una respuesta con Set-Cookie y sirva una sesión a otra persona.
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  respuesta.headers.set('Cache-Control', 'private, no-store');
  for (const [clave, valor] of Object.entries(cabecerasAuth)) {
    respuesta.headers.set(clave, valor);
  }
  return respuesta;
});
