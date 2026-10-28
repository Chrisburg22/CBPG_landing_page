---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 795b1f5b2e59
actualizado: 2026-10-27
tags:
  - panel
  - generado
---

<!-- No editar a mano: pnpm boveda:generar -->

# Rutas del panel

Rutas de `src/pages/`, su tipo, si se renderizan en el servidor y quién
puede verlas. Se genera desde los archivos y desde `src/lib/roles.ts`.

- **27 rutas**: 21 de panel, 2 de API, 4 públicas.
- **0 rutas de panel/API sin `prerender = false`.** Si hay alguna, el panel quedaría público.
- `doctora + recepción` = cualquier cuenta con fila en `admins`; RLS sigue
  decidiendo las filas.

## Panel

| Ruta | Tipo | Render | Acceso | Archivo |
| --- | --- | --- | --- | --- |
| `/admin/agenda/[id]` | página | SSR | doctora + recepción | `src/pages/admin/agenda/[id].astro` |
| `/admin/agenda` | página | SSR | doctora + recepción | `src/pages/admin/agenda/index.astro` |
| `/admin/agenda/nueva` | página | SSR | doctora + recepción | `src/pages/admin/agenda/nueva.astro` |
| `/admin/agenda/ocupacion` | endpoint | SSR | doctora + recepción | `src/pages/admin/agenda/ocupacion.ts` |
| `/admin/auth/entrar` | endpoint | SSR | público | `src/pages/admin/auth/entrar.ts` |
| `/admin/auth/salir` | endpoint | SSR | público | `src/pages/admin/auth/salir.ts` |
| `/admin` | página | SSR | doctora + recepción | `src/pages/admin/index.astro` |
| `/admin/integracion/google/callback` | endpoint | SSR | doctora | `src/pages/admin/integracion/google/callback.ts` |
| `/admin/integracion/google/conectar` | endpoint | SSR | doctora | `src/pages/admin/integracion/google/conectar.ts` |
| `/admin/integracion/google` | página | SSR | doctora | `src/pages/admin/integracion/google.astro` |
| `/admin/login` | página | SSR | público | `src/pages/admin/login.astro` |
| `/admin/pacientes/[id]/plan` | página | SSR | doctora | `src/pages/admin/pacientes/[id]/plan.astro` |
| `/admin/pacientes/[id]` | página | SSR | doctora | `src/pages/admin/pacientes/[id].astro` |
| `/admin/pacientes` | página | SSR | doctora | `src/pages/admin/pacientes/index.astro` |
| `/admin/pacientes/nuevo` | página | SSR | doctora | `src/pages/admin/pacientes/nuevo.astro` |
| `/admin/pagos` | página | SSR | doctora | `src/pages/admin/pagos/index.astro` |
| `/admin/pagos/nuevo` | página | SSR | doctora | `src/pages/admin/pagos/nuevo.astro` |
| `/admin/prospectos/[id]/convertir` | página | SSR | doctora | `src/pages/admin/prospectos/[id]/convertir.astro` |
| `/admin/prospectos/[id]` | página | SSR | doctora + recepción | `src/pages/admin/prospectos/[id].astro` |
| `/admin/prospectos` | página | SSR | doctora + recepción | `src/pages/admin/prospectos/index.astro` |
| `/admin/solicitudes/[id]` | página | SSR | doctora + recepción | `src/pages/admin/solicitudes/[id].astro` |

## API

| Ruta | Tipo | Render | Acceso | Archivo |
| --- | --- | --- | --- | --- |
| `/api/contact` | endpoint | SSR | público (formulario) | `src/pages/api/contact.ts` |
| `/api/cron/keepalive` | endpoint | SSR | cron (Bearer) | `src/pages/api/cron/keepalive.ts` |

## Públicas

| Ruta | Tipo | Render | Acceso | Archivo |
| --- | --- | --- | --- | --- |
| `/404` | página | estático | público | `src/pages/404.astro` |
| `/aviso-de-privacidad` | página | estático | público | `src/pages/aviso-de-privacidad.astro` |
| `/` | página | estático | público | `src/pages/index.astro` |
| `/terminos` | página | estático | público | `src/pages/terminos.astro` |

## Reglas

- Toda ruta nueva bajo `/admin` o `/api` que use sesión lleva
  `export const prerender = false`.
- `RUTAS_PUBLICAS_ADMIN` (`src/lib/admin.ts`) solo contiene login, entrar y
  salir. Ampliarla abre el panel sin sesión.
- `SOLO_DOCTORA` (`src/lib/roles.ts`) son prefijos; la conversión
  `/admin/prospectos/<id>/convertir` se reconoce aparte.
- La barrera real es RLS. La interfaz y el middleware solo evitan pantallas
  vacías.

Ver [[Acceso y roles]] y [[Arquitectura]].
