---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Cómo viaja una petición y qué pieza hace qué en la landing y el panel.
fuentes:
  - astro.config.mjs
  - src/middleware.ts
  - docs/panel/arquitectura.md
tags:
  - proyecto
  - arquitectura
---

# Arquitectura

Landing pública + panel interno de un consultorio de ortodoncia. Astro 7 con
`output: 'static'` y adaptador de Vercel; Supabase (Auth + Postgres con RLS);
Google Calendar como espejo opcional de la agenda.

## Lo que se prerenderiza y lo que no

- **Público:** `/`, `/aviso-de-privacidad`, `/terminos`, `/404`. HTML estático
  en el CDN.
- **SSR (`prerender = false`):** todo `/admin/*`, `/api/contact` y
  `/api/cron/keepalive`.
- El middleware **también corre en build** para rutas prerenderizadas; por eso
  empieza con `if (context.isPrerendered) return next()`.
- Olvidar `prerender = false` en una página de `/admin` la vuelve HTML público y
  el middleware deja de correr en cada petición. `pnpm verify:build` lo detecta.

## Petición típica del panel

```text
Teléfono (PWA) → middleware.ts
  → auth.getUser() (valida el token contra Supabase)
  → ¿correo en ADMIN_EMAILS?
  → select rol from admins
  → puedeVer(rol, ruta)
  → página Astro
  → src/lib/* con el cliente de la sesión
  → Supabase (RLS decide las filas)
  → HTML con Cache-Control: private, no-store y X-Robots-Tag: noindex
```

Las escrituras son formularios `POST` → redirect `303` → `GET` con
`?guardado=1`. No hay una API JSON propia, salvo `/api/contact` (formulario
público) y `GET /admin/agenda/ocupacion` (solo minutos ocupados, sin nombres).

## Barreras de acceso

1. **`ADMIN_EMAILS`** — variable de entorno; quién puede intentar entrar.
2. **`admins.rol`** — `doctora` o `recepcionista`; qué secciones existen.
3. **RLS** — la barrera real: la recepcionista recibe cero filas de pacientes,
   planes, cuotas, pagos y recordatorios aunque llegue a la URL.

Ver [[Acceso y roles]].

## Piezas por carpeta

| Ruta | Qué contiene |
| --- | --- |
| `src/pages/` | Rutas: landing, `/admin` SSR, `/api`. |
| `src/components/` | Secciones de la landing; `admin/` para el panel; islas React (`BeforeAfter`, `FAQ`, `BookingForm`). |
| `src/lib/` | Dominio: solicitudes, seguimiento, citas, horario, pacientes, pagos, cobranza, métricas, tiempo, roles. |
| `src/lib/supabase/` | `servidor.ts` (sesión + RLS), `servicio.ts` (clave secreta), `tipos.ts` (tipos a mano). |
| `src/lib/google/` | OAuth, tokens cifrados, Calendar y sincronización. |
| `src/layouts/` | `Layout.astro` público; `AdminLayout.astro` con `noindex` y PWA. |
| `src/config/site.ts` | Copy de la landing: doctora, tratamientos, FAQ, legal, caso clínico. |
| `public/` | Iconos, `robots.txt`, shell de la PWA del panel. |
| `scripts/` | Admin de cuentas, verificador de build, imágenes, iconos, videos, bóveda. |
| `e2e/` | Playwright contra el Supabase real. |
| `supabase/migrations/` | SQL aplicado a mano al proyecto remoto. |

## Zona horaria

Toda hora se **teclea y se muestra en Ciudad de México** y se **guarda en UTC**
(`timestamptz`). Vercel corre en UTC. Usa `src/lib/tiempo.ts`
(`deMexicoAIso`, `aCampoLocal`, `partesEnMexico`, `diaEnMexico`,
`limitesDelDia`); nunca `new Date()` sobre una hora de pared ni `.slice(0, 10)`
sobre un ISO.

## Google Calendar

Es un espejo, no la fuente de verdad. Si falla, la cita sigue guardada con
`google_sync = 'error'` y se reintenta. Sin las variables `GOOGLE_*`, la agenda
funciona igual y las citas quedan en `desactivada`. Ver [[Google Calendar]].

## Servicio y PWA

- El cliente con la clave secreta (`servicio.ts`) **bypasa RLS** y solo se usa
  desde `/api/*`. Nunca desde una página o un componente.
- El service worker del panel solo cachea `/_astro/*` e iconos; **nunca HTML del
  panel**. Es lista blanca, no lista negra. Si cambias sus reglas, sube
  `VERSION` en `public/panel-sw.js` en el mismo commit.
- La landing no enlaza el manifest ni registra el worker; solo `AdminLayout`.
