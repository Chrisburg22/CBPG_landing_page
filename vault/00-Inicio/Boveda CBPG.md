---
tipo: inicio
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Mapa compacto del proyecto para leer solo la nota del área que se va a tocar.
fuentes:
  - AGENTS.md
  - docs/panel/README.md
tags:
  - inicio
  - agentes
---

# Bóveda CBPG

Mapa compacto de la landing y el panel del consultorio. **Lee esta nota al inicio
de cada conversación** y después solo la nota del área que vas a tocar. Si eres
un agente, sigue [[Protocolo de busqueda]].

## Mapa

| Si necesitas… | Lee |
| --- | --- |
| Cómo se conectan Astro, middleware, Supabase y Google | [[Arquitectura]] |
| Ubicar una carpeta o saber qué es cada archivo | [[Mapa del repositorio]] |
| Saber qué comando corre cada cosa | [[Comandos y verificacion]] |
| Ver o cambiar variables de entorno | [[Entornos y variables]] |
| Desplegar un cambio | [[Despliegue]] |
| Rutas del panel, prerender y endpoints | [[Rutas del panel]] |
| Acceso, roles, allowlist y RLS | [[Acceso y roles]] |
| Prospectos, seguimiento, citas y agenda | [[Prospectos y agenda]] |
| Pacientes, planes, cuotas y pagos | [[Pacientes y cobranza]] |
| Copiar citas a Google Calendar | [[Google Calendar]] |
| Landing, contenido, formulario y assets | [[Landing y contenido]] |
| Tablas, columnas y tipos | [[Tablas]] · [[Modelo de datos]] |
| Aplicar o revisar una migración | [[Migraciones]] |
| Verificar un cambio antes de darlo por hecho | [[Verificar un cambio]] |
| Actualizar esta bóveda | [[Actualizar la boveda]] |
| Buscar código sin leer de más | [[Protocolo de busqueda]] |
| Qué se decidió en sesiones anteriores | [[Bitacora de sesiones]] |
| Índice de todas las notas | [[Indice completo]] |

## Reglas de oro

- **`/admin/*` y `/api/*` siempre con `export const prerender = false`.** Con
  `output: 'static'`, olvidarlo deja el panel público y el middleware no corre.
- **La barrera real es RLS.** `ADMIN_EMAILS` y `admins.rol` deciden quién entra y
  qué secciones ve; Postgres decide qué filas existen para esa persona.
- **Horas en México, guardadas en UTC.** Usa `src/lib/tiempo.ts`.
- **Las migraciones se aplican a mano sobre producción.** No hay base local ni
  ramas de Supabase.
- **Las notas con `tipo: generado` no se editan a mano.** Se regeneran con
  `pnpm boveda`.

## Al cerrar

1. `pnpm boveda` (genera lo que sale del código y verifica enlaces/frontmatter).
2. Revisa el diff de `vault/`.
3. Agrega una entrada al principio de [[Bitacora de sesiones]].

El plugin de OpenCode `.opencode/plugins/boveda-cbpg.ts` hace el paso 1 solo
cuando la sesión queda inactiva. Si falla, corre `pnpm boveda` a mano.
