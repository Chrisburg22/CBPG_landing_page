---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 6c97cad67580
actualizado: 2026-10-27
tags:
  - proyecto
  - generado
---

<!-- No editar a mano: pnpm boveda:generar -->

# Mapa del repositorio

Estructura y tamaño del código, generada desde el árbol de archivos.
Excluye `.git`, artefactos de build, dependencias y la propia bóveda.

- **211 archivos** en las carpetas del proyecto.
- Los números entre paréntesis son líneas, no KB.

## Raíz

| Carpeta | Archivos |
| --- | --- |
| `.opencode/` | 1 |
| `design/` | 54 |
| `docs/` | 20 |
| `e2e/` | 23 |
| `public/` | 11 |
| `scripts/` | 8 |
| `src/` | 86 |
| `supabase/` | 8 |

Archivos sueltos en la raíz:

`.env.example` (54) · `.gitignore` (29) · `.npmrc` (6) · `AGENTS.md` (113) · `astro.config.mjs` (67) · `opencode.json` (4) · `package.json` (48) · `playwright.config.ts` (87) · `playwright.demo.config.ts` (74) · `playwright.manual.config.ts` (68) · `playwright.movil.config.ts` (79) · `tsconfig.json` (13) · `vercel.json` (9)

## `src/`

| Carpeta | Archivos |
| --- | --- |
| `src/assets/` | 10 |
| `src/components/` | 17 |
| `src/config/` | 1 |
| `src/layouts/` | 2 |
| `src/lib/` | 23 |
| `src/pages/` | 27 |
| `src/styles/` | 3 |
| `src/types/` | 1 |

## `src/lib/` — dominio

`admin.ts` (28) · `citas.ts` (203) · `cobranza.ts` (106) · `contacto-directo.ts` (77) · `formato.ts` (118) · `horario.ts` (109) · `metricas.ts` (199) · `pacientes.ts` (316) · `pagos.ts` (260) · `panel.ts` (39) · `roles.ts` (62) · `seguimiento.ts` (147) · `solicitudes.ts` (176) · `tiempo.ts` (218) · `validate.ts` (73)

## `src/lib/supabase/` — clientes y tipos

`servicio.ts` (20) · `servidor.ts` (41) · `tipos.ts` (533)

## `src/lib/google/` — Calendar

`almacen.ts` (214) · `calendario.ts` (255) · `cripto.ts` (82) · `plan.ts` (39) · `sincronizar.ts` (157)

## `src/components/` — landing

`About.astro` (57) · `CaseStudy.astro` (199) · `Contact.astro` (84) · `Footer.astro` (60) · `Hero.astro` (86) · `Nav.astro` (75) · `Process.astro` (23) · `Strip.astro` (19) · `Testimonials.astro` (32) · `Treatments.astro` (46)

## `src/components/admin/` — panel

`AvisoContactado.astro` (88) · `CamposPaciente.astro` (84) · `Icono.astro` (51) · `NavPanel.astro` (104)

## `scripts/`

`admin.mjs` (186) · `generar-iconos.mjs` (207) · `preparar-imagenes.mjs` (176) · `verificar-build.mjs` (157) · `videos-manual.mjs` (54)

## `scripts/vault/` — generador de esta bóveda

`vault.py` (961)

## `e2e/`

`acceso.spec.ts` (59) · `agenda.spec.ts` (249) · `apoyo.ts` (350) · `cobranza.spec.ts` (76) · `conversion.spec.ts` (181) · `demo.spec.ts` (78) · `formulario.spec.ts` (102) · `global-setup.ts` (12) · `google.spec.ts` (273) · `navegacion.spec.ts` (82) · `pagos.spec.ts` (161) · `panel.spec.ts` (246) · `pwa.spec.ts` (152) · `roles.spec.ts` (142) · `seguridad.spec.ts` (126) · `tablero.spec.ts` (153)

## `docs/panel/`

`README.md` (55) · `acceso-y-roles.md` (56) · `agenda.md` (77) · `arquitectura.md` (79) · `google.md` (40) · `hallazgos.md` (51) · `inicio.md` (48) · `modelo-datos.md` (112) · `pacientes.md` (61) · `pagos.md` (45) · `prospectos.md` (70)

## `supabase/migrations/`

`0001_solicitudes_estado_terminado.sql` (22) · `0002_pacientes.sql` (79) · `0003_pacientes_sin_trigram.sql` (17) · `0004_planes_cuotas_pagos.sql` (155) · `0005_vistas_y_generar_cuotas.sql` (142) · `0006_roles.sql` (115) · `0007_agenda_y_seguimiento.sql` (246)

## `public/`

`apple-touch-icon.png` · `favicon.svg` (10) · `og-image.jpg` · `panel-sin-conexion.html` (78) · `panel-sw.js` (199) · `panel.webmanifest` (23) · `robots.txt` (16)

Ver [[Arquitectura]] para saber qué hace cada carpeta y [[Rutas del panel]]
para las rutas.
