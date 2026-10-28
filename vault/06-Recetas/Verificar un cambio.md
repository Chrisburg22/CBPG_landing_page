---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
resumen: Qué correr y qué revisar según el área que tocaste, antes de dar un cambio por hecho.
fuentes:
  - package.json
  - scripts/verificar-build.mjs
  - playwright.config.ts
  - e2e/README.md
tags:
  - recetas
  - verificacion
---

# Verificar un cambio

## Mínimo siempre

```bash
pnpm check
pnpm build
pnpm verify:build
```

`pnpm verify:build` es obligatorio si tocaste `/admin`, el sitemap, `robots.txt`,
la PWA o los enlaces de la landing. Es la única prueba que mira el artefacto real
de producción.

## Según el área

| Tocaste | Además corre | Mira |
| --- | --- | --- |
| Landing o copy | `pnpm build` | Enlaces, imágenes faltantes, JSON-LD |
| `/admin` | `pnpm verify:build` | Que **ningún** HTML de `/admin` quede en el build |
| `/api/*` | `pnpm test:e2e` si hay flujo | `prerender = false`, origen y errores |
| Migración | Aplicar al remoto **antes** del deploy | `tipos.ts`, RLS, GRANT |
| PWA | `pnpm verify:build` | Los tres archivos de `public/`, `VERSION` |
| Google Calendar | `pnpm test:e2e e2e/google.spec.ts` | Que no se creen eventos reales |
| Bóveda | `pnpm boveda` | Enlaces y notas generadas |

## La regla que más se olvida

Con `output: 'static'`, una página de `/admin` sin `export const prerender = false`
se prerenderiza, el middleware no corre en cada petición y el panel queda
**público**. `scripts/verificar-build.mjs` lo detecta, pero solo si corres
`pnpm verify:build` después de `pnpm build`.

Lo mismo aplica a cualquier endpoint nuevo bajo `/api` que use datos de sesión.

## E2E

```bash
pnpm test:e2e
pnpm test:e2e e2e/agenda.spec.ts
pnpm test:e2e -g "texto"
pnpm test:e2e:sin-video
```

- Usan el **Supabase real**. No hay proyecto de pruebas.
- Requieren `.env` y `E2E_ADMIN_PASSWORD` de una cuenta `doctora` que esté en
  `ADMIN_EMAILS` y en `admins`.
- Las pruebas de recepción se saltan sin `E2E_RECEPCION_EMAIL` y
  `E2E_RECEPCION_PASSWORD`.
- Las filas llevan prefijo `E2E ` y se limpian; no inventes datos sin prefijo.
- Puerto 4329, un worker, sin reintentos, timeout 45 s. El servidor se levanta
  por corrida y no se reutiliza (el rate limit del formulario vive en memoria).
- El vídeo está encendido por defecto y cuesta tiempo y disco. `PW_VIDEO=0` lo
  apaga.

No corras `pnpm test:movil` ni `pnpm manual` con credenciales de Google
puestas: esos configs las anulan para no crear eventos reales.

## Antes de commitear

```bash
git status --short
git diff --stat
```

- No commitees `.astro/`, `dist/`, `.vercel/`, `test-results/`,
  `playwright-report/`, `demo-video/`, `manual-video/` ni los HTML sembrados de
  `design/panel/`.
- Si tocaste `public/panel-sw.js` y cambiaste reglas de caché, sube `VERSION` en
  el mismo commit.
- Si tocaste el esquema, confirma que la migración ya está aplicada en el
  remoto. El deploy no la aplica.

Ver [[Comandos y verificacion]] y [[Despliegue]].
