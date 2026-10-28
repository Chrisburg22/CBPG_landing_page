---
tipo: nota
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Comandos exactos, orden de verificación y puertos de cada suite.
fuentes:
  - package.json
  - playwright.config.ts
  - e2e/README.md
tags:
  - proyecto
  - comandos
---

# Comandos y verificacion

`pnpm` es el gestor del repo (hay `pnpm-lock.yaml`). `.npmrc` fija
`node-linker=hoisted` porque el bundle de Astro 7 importa dependencias externas
que el enlazado estricto de pnpm no resuelve.

## Desarrollo y tipos

```bash
pnpm install
pnpm dev                 # Astro en http://localhost:4321
pnpm check               # astro check (TypeScript + Astro)
pnpm build               # build de producción
pnpm verify:build        # invariantes del artefacto; obligatorio tras build
```

Si un agente lanza el servidor en segundo plano, usa
`ASTRO_DEV_BACKGROUND=0 pnpm dev`: Astro 7 detecta que corre bajo un agente y
demoniza el proceso, y entonces Playwright cree que murió. Los configs de
Playwright ya la definen.

## Verificación completa

```bash
pnpm test                # astro check -> build -> verify:build -> playwright test
```

El orden importa: `verify:build` mira `.vercel/output/static` y falla si hay
cualquier HTML de `/admin` prerenderizado, si el sitemap anuncia `/admin`, si
falta la PWA o si `panel-sin-conexion.html` lleva scripts/Supabase.

## E2E

```bash
pnpm test:e2e                         # toda la suite
pnpm test:e2e e2e/agenda.spec.ts      # un archivo
pnpm test:e2e -g "texto"              # por título
pnpm test:e2e:ui                      # interfaz de Playwright
pnpm test:e2e:sin-video               # PW_VIDEO=0
```

- Hablan con el **Supabase real**; no hay proyecto de pruebas.
- Requieren `.env` + `E2E_ADMIN_PASSWORD` de una cuenta con rol `doctora` que
  esté en `ADMIN_EMAILS` **y** en `admins`.
- Las pruebas de recepcionista se saltan sin `E2E_RECEPCION_EMAIL` y
  `E2E_RECEPCION_PASSWORD`.
- Puerto fijo **4329**, un worker, sin reintentos, timeout 45 s. El servidor se
  levanta por corrida y nunca se reutiliza (el rate limit del formulario vive en
  memoria).
- Las filas de prueba llevan prefijo `E2E ` y se limpian en `global-setup.ts`.
- Vídeo encendido por defecto; cuesta tiempo y disco.

## Otras suites

```bash
pnpm demo                # recorrido guiado en 3 tamaños; puerto 4330
pnpm test:movil          # auditoría móvil 390/360 px; puerto 4331
pnpm manual              # graba videos del manual; puerto 4332
pnpm manual:videos       # convierte manual-video/*.webm a docs/panel/videos/*.mp4
```

`pnpm test:movil` y `pnpm manual` **anulan las credenciales de Google** a
propósito para no crear eventos reales. No las corras con `GOOGLE_*` puestas.

## Cuentas del panel

```bash
pnpm admin listar
pnpm admin alta <correo> [contraseña] [--rol=doctora|recepcionista]
pnpm admin baja <correo>
```

El alta crea el usuario y la fila en `admins`, pero **no** toca `ADMIN_EMAILS`:
hay que agregar el correo al `.env` y a Vercel, y redesplegar. `listar` marca con
`○` las cuentas que están solo en una de las dos barreras.

## Assets y bóveda

```bash
pnpm iconos                                      # regenera iconos PWA/OG desde favicon.svg
node scripts/preparar-imagenes.mjs --listar ~/fotos
node scripts/preparar-imagenes.mjs ~/fotos       # escribe src/assets/
pnpm boveda                                      # vault: generar + verificar
pnpm boveda:verificar
pnpm boveda:brief
```

Los scripts de imágenes/iconos se corren a mano; Vercel **no** los ejecuta en el
build. Los resultados se commitean.
