---
tipo: bitacora
area: agentes
estado: verificado
actualizado: 2026-10-27
resumen: Una entrada por conversación, de la más reciente a la más antigua.
tags:
  - agentes
  - bitacora
---

# Bitacora de sesiones

Una entrada por conversación, de la más reciente a la más antigua. Sirve para
que la siguiente sesión sepa qué se decidió y qué quedó pendiente sin releer el
historial completo.

## Plantilla

```markdown
## AAAA-MM-DD — Objetivo en una línea

- **Objetivo**: qué se quería lograr.
- **Cambios**: archivos y comportamiento; enlaces a las notas tocadas.
- **Decisión**: lo que la siguiente sesión necesita saber y por qué.
- **Verificación**: comandos que pasaron y qué quedó sin probar.
- **Pendiente**: riesgos, datos que faltan, migraciones sin aplicar.
```

## 2026-10-27 — Bóveda, AGENTS.md y hooks de OpenCode

- **Objetivo**: que cada conversación lea un mapa del proyecto en vez de
  explorar el repo, y que la documentación se actualice sola al cerrar.
- **Cambios**: bóveda Obsidian en `vault/` (inicio, arquitectura, comandos,
  entorno, despliegue, panel, datos, recetas y agentes); `scripts/vault/vault.py`
  con `generar`, `verificar` y `brief`; scripts `boveda*` en `package.json`;
  `opencode.json` con la nota de inicio en `instructions`; plugin
  `.opencode/plugins/boveda-cbpg.ts`; `AGENTS.md` en la raíz.
- **Decisión**: las notas derivadas del código se generan y no se editan a mano;
  las decisiones y pendientes se escriben aquí. El plugin inyecta el mapa una vez
  por sesión y regenera al quedar inactiva, pero no sustituye la entrada de la
  bitácora.
- **Verificación**: `pnpm boveda`, `pnpm check` y `pnpm build` +
  `pnpm verify:build`.
- **Pendiente**: completar los datos legales de `src/config/site.ts` (los pone la
  doctora) y revisar el texto del caso clínico antes de publicarlo.
