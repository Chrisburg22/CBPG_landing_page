/**
 * Service worker del panel (/admin). La landing pública no lo registra nunca:
 * el <script> de registro vive en src/layouts/AdminLayout.astro, y
 * scripts/verificar-build.mjs comprueba que ninguna página prerenderizada lo
 * mencione.
 *
 * REGLA QUE NO SE NEGOCIA
 * -----------------------
 * Aquí NO se guarda ni una respuesta que pueda contener datos de una paciente.
 * Lo único que entra en caché es salida de compilación (/_astro/*, con hash en
 * el nombre) y los iconos. El HTML del panel se pide SIEMPRE a la red y no se
 * guarda jamás.
 *
 * Ojo con una suposición fácil y falsa: el `Cache-Control: private, no-store`
 * que src/middleware.ts pone en todas las respuestas de /admin NO protege de
 * nada aquí. La Cache Storage API ignora las directivas de caché HTTP;
 * `cache.put()` guarda lo que le des aunque venga con no-store. Lo único que
 * impide que el nombre y el teléfono de una prospecta acaben en el
 * almacenamiento del teléfono, sin cifrar y sobreviviendo al cierre de sesión,
 * es el código de este archivo.
 *
 * Por eso la decisión es LISTA BLANCA, no lista negra: `estrategia()` devuelve
 * null para todo lo que no reconoce, y sin `respondWith` el navegador hace lo
 * de siempre. Si mañana alguien añade /admin/api/pacientes.json, este worker lo
 * ignora solo, sin que nadie tenga que acordarse de excluirlo.
 *
 * VERSIÓN: súbela en el MISMO commit que cambie cualquier regla de este
 * archivo. No hace falta subirla por cada deploy: los nombres de /_astro/*
 * llevan hash, así que un activo nuevo es una URL nueva y nunca colisiona con
 * una entrada vieja. Editar este archivo es lo único que obliga al navegador a
 * reinstalar, y por tanto lo único que necesita un nombre de caché nuevo.
 */
const VERSION = 'v1';

/**
 * Solo la página de respaldo. NO se borra al cerrar sesión: si se borrara, el
 * modo sin conexión quedaría roto hasta la siguiente actualización del worker,
 * que puede tardar semanas.
 */
const CACHE_RESPALDO = `panel-respaldo-${VERSION}`;

/** Activos. Se vacía al cerrar sesión, desde src/pages/admin/login.astro. */
const CACHE_RUNTIME = `panel-runtime-${VERSION}`;

const PAGINA_SIN_CONEXION = '/panel-sin-conexion.html';

/**
 * El único sitio del archivo que decide QUÉ se guarda. Un solo punto que
 * auditar.
 */
function estrategia(url) {
  // Nombres con hash: inmutables por construcción. Una URL de /_astro/ jamás
  // devuelve un contenido distinto, así que cache-first no puede quedar rancio.
  if (url.pathname.startsWith('/_astro/')) return 'primero-cache';

  // Sin hash: pueden cambiar sin cambiar de nombre. Revalidar en segundo plano.
  if (url.pathname.startsWith('/iconos/')) return 'revalidando';
  if (url.pathname === '/favicon.svg') return 'revalidando';
  if (url.pathname === '/apple-touch-icon.png') return 'revalidando';
  if (url.pathname === '/panel.webmanifest') return 'revalidando';

  return null;
}

/**
 * Qué se puede guardar. `type: 'basic'` descarta las opacas, que ocupan cuota y
 * ni se pueden leer. `!redirected` es la barrera de seguridad de verdad: si por
 * un cambio de configuración una URL de activo acabara redirigiendo a una
 * página del panel, esto impide guardar el HTML de esa página bajo la URL de un
 * .css que luego serviríamos alegremente desde caché.
 */
function guardable(respuesta) {
  return (
    respuesta &&
    respuesta.status === 200 &&
    respuesta.type === 'basic' &&
    !respuesta.redirected
  );
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_RESPALDO).then((cache) =>
      // `cache: 'reload'` salta la caché HTTP: si no, una instalación podría
      // congelar una versión vieja de la página de respaldo indefinidamente.
      cache.add(new Request(PAGINA_SIN_CONEXION, { cache: 'reload' }))
    )
  );
  // Este worker no guarda HTML nunca, así que un worker nuevo no puede
  // desincronizar el documento de sus activos más de lo que ya lo hace un
  // deploy normal. Y dejarlo en `waiting` durante días en un teléfono que no
  // cierra la pestaña nunca retrasaría tanto las correcciones como el
  // interruptor de emergencia.
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nombre of await caches.keys()) {
        // Solo lo nuestro. Borrar cachés ajenas de este origen sería grosero y,
        // el día que la landing tenga las suyas, un error.
        if (
          nombre.startsWith('panel-') &&
          nombre !== CACHE_RESPALDO &&
          nombre !== CACHE_RUNTIME
        ) {
          await caches.delete(nombre);
        }
      }
      // Sin claim, la primera visita tras instalar no queda controlada y el
      // modo sin conexión no funciona hasta la navegación siguiente. No hay
      // `location.reload()` en ningún sitio: eso sí sería peligroso, se
      // llevaría por delante un filtro a medio poner o un formulario a medio
      // llenar.
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  // Los POST de «Entrar» y «Salir» salen por aquí: el navegador los maneja como
  // siempre y el 303 del endpoint queda intacto.
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  // wa.me y cualquier otra cosa de fuera: ni tocarla.
  if (url.origin !== self.location.origin) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(navegacion(peticion));
    return;
  }

  const modo = estrategia(url);
  if (modo === 'primero-cache') evento.respondWith(primeroCache(peticion));
  else if (modo === 'revalidando') evento.respondWith(revalidando(evento));
  // Todo lo demás sale sin respondWith. /api/*, /admin/auth/*, /_image y
  // cualquier ruta futura caen aquí por omisión, que es lo que queremos.
});

/**
 * Solo red. Nunca se guarda una navegación: es HTML del panel y lleva dentro
 * nombres y teléfonos.
 */
async function navegacion(peticion) {
  try {
    // La petición se pasa TAL CUAL, sin reconstruirla con `new Request(...)`.
    // Una navegación trae `redirect: 'manual'`, y conservarlo es lo que hace
    // que el 302 del middleware hacia /admin/login siga funcionando: fetch
    // devuelve una respuesta `opaqueredirect` que el navegador sigue solo.
    return await fetch(peticion);
  } catch {
    // Aquí solo se llega si fetch RECHAZA, o sea, fallo de red. Un 401, un 500
    // o un redirect salen por el return de arriba: taparlos con «sin conexión»
    // escondería el error real y haría creer que es problema del wifi.
    const respaldo = await caches.match(PAGINA_SIN_CONEXION, {
      cacheName: CACHE_RESPALDO,
    });
    return respaldo ?? Response.error();
  }
}

async function primeroCache(peticion) {
  const guardada = await caches.match(peticion, { cacheName: CACHE_RUNTIME });
  if (guardada) return guardada;

  const respuesta = await fetch(peticion);
  if (guardable(respuesta)) {
    const cache = await caches.open(CACHE_RUNTIME);
    await cache.put(peticion, respuesta.clone());
  }
  return respuesta;
}

function revalidando(evento) {
  const peticion = evento.request;
  return (async () => {
    const cache = await caches.open(CACHE_RUNTIME);
    const guardada = await cache.match(peticion);

    const red = fetch(peticion).then((respuesta) => {
      if (guardable(respuesta)) cache.put(peticion, respuesta.clone());
      return respuesta;
    });

    if (guardada) {
      // Sin waitUntil, el navegador puede matar el worker en cuanto respondWith
      // resuelve y la revalidación no llega a escribirse nunca: el icono viejo
      // se quedaría para siempre.
      evento.waitUntil(red.catch(() => {}));
      return guardada;
    }
    return red;
  })();
}
