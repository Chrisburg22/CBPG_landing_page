---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Qué corre en Vercel, qué se aplica antes de desplegar y qué no se versiona.
fuentes:
  - vercel.json
  - astro.config.mjs
  - docs/panel/arquitectura.md
tags:
  - proyecto
  - despliegue
---

# Despliegue

- **Host:** Vercel, con `@astrojs/vercel`. La rama de trabajo es `main`.
- **Build:** `pnpm build` (Vercel detecta `pnpm-lock.yaml`). El resultado estático
  va al CDN; `/admin/*`, `/api/contact` y `/api/cron/*` son funciones.
- **Dominio canónico:** `https://www.drabereniceparadaortodoncista.com.mx`. El
  apex hace 308 a `www`; de ese valor dependen sitemap, canonical y Open Graph.
- **Cron:** `vercel.json` llama a `/api/cron/keepalive` todos los días a las
  09:17 UTC para que Supabase no pause el proyecto por inactividad. Vercel manda
  `Authorization: Bearer $CRON_SECRET`.
- **No hay CI ni workflows** en el repo. La verificación es local.

## Antes de desplegar

```bash
pnpm check
pnpm build
pnpm verify:build
# si hay tiempo y credenciales:
pnpm test
```

`pnpm verify:build` es obligatorio cuando se toca una ruta de `/admin`, el
sitemap, `robots.txt`, la PWA o los enlaces de la landing. Es la única prueba que
mira el artefacto real de producción.

## Orden con migraciones

No hay base local ni ramas de Supabase: las migraciones se aplican **a mano**
sobre producción con `apply_migration`. Si el código nuevo depende de una
columna/tabla nueva:

1. Aplica la migración pequeña y compatible.
2. Actualiza `src/lib/supabase/tipos.ts`.
3. Despliega el código.
4. Limpia lo viejo en una migración posterior.

Nunca al revés: el deploy puede tardar y las peticiones viejas seguirán
llegando. Ver [[Migraciones]].

## Variables

Cada variable nueva debe existir en Vercel **antes** del deploy; el esquema de
`astro.config.mjs` falla el build si falta. Cambiar `ADMIN_EMAILS`,
`CRON_SECRET` o las de Google exige redesplegar. Ver [[Entornos y variables]].

## PWA

El service worker del panel (`public/panel-sw.js`) se sirve desde la raíz. Si
cambias sus reglas de caché, sube `VERSION` en el mismo commit. El HTML del panel
nunca se cachea. No muevas `panel.webmanifest`, `panel-sw.js` ni
`panel-sin-conexion.html` fuera de `public/`: el verificador de build falla y, si
desaparecen, los navegadores desregistran el worker pero conservan las cachés.

## Lo que no se sube

`.env`, `.astro/`, `dist/`, `.vercel/`, `node_modules/`, `test-results/`,
`playwright-report/`, `demo-video/`, `manual-video/`, `docs/panel/videos/` y los
HTML sembrados de `design/panel/`.
