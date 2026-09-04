# Pruebas end-to-end

```bash
pnpm test        # tipos + build + invariantes del build + e2e
pnpm test:e2e    # solo las e2e
pnpm test:e2e:ui # con la interfaz de Playwright
```

## Antes de correrlas

Hace falta el `.env` de la aplicación más `E2E_ADMIN_PASSWORD`, la contraseña de
una cuenta que esté en `ADMIN_EMAILS` **y** en la tabla `admins`. Si falta,
las pruebas lo dicen en vez de fallar de forma críptica.

## Tres cosas que conviene saber

**Escriben en el Supabase de verdad.** El plan gratuito no da ramas de base de
datos, así que no hay entorno de pruebas aparte. Cada corrida etiqueta sus filas
con el prefijo `E2E ` y las borra al terminar; `global-setup.ts` barre además lo
que haya dejado una corrida interrumpida. Si ves filas `E2E …` en el panel, es
basura de una corrida que se cortó: se van solas en la siguiente.

**Solo una prueba pasa por el formulario de verdad.** `/api/contact` limita a 5
envíos por IP cada 10 minutos y todas las pruebas salen de la misma IP. El
recorrido completo formulario → panel se prueba una vez, en `panel.spec.ts`; el
resto siembra filas con `sembrarSolicitud()`, porque lo que verifican es el
panel. La prueba del 429 va la última del último archivo a propósito: agota la
cuota.

**Cada corrida levanta su propio servidor** en el puerto 4329, y nunca reutiliza
uno existente: el limitador vive en la memoria del proceso, así que un servidor
reutilizado arrastraría la cuota gastada de la corrida anterior. Se le pasa
`--ignore-lock` para que conviva con tu `astro dev` normal, y
`ASTRO_DEV_BACKGROUND=0` para que Astro 7 no lo demonice — ver los comentarios de
`playwright.config.ts`.

## Lo que no cubren

`pnpm test` incluye `scripts/verificar-build.mjs` porque hay una invariante que
las e2e no pueden ver: corren contra el servidor de desarrollo, donde todo es
on-demand. En producción, olvidar `export const prerender = false` en una página
de `/admin` la convierte en HTML estático y **deja el panel público**, sin error
ni aviso. Esa comprobación mira el artefacto construido.
