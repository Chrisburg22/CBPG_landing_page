---
tipo: indice
area: proyecto
estado: verificado
actualizado: 2026-10-27
resumen: Reglas de nombres, frontmatter y enlaces para que la bóveda siga barata de leer.
fuentes:
  - scripts/vault/vault.py
tags:
  - indice
  - agentes
---

# Convenciones de la bóveda

Reglas para que la bóveda siga siendo barata de leer y difícil de romper.

## Nombres y enlaces

- **Archivos sin acentos** (`Boveda CBPG.md`, no `Bóveda…`). Los títulos dentro
  de la nota sí llevan acentos. Así un sync o un sistema de archivos distinto no
  rompe los `[[enlaces]]`.
- Un nombre de nota es **único en toda la bóveda**; Obsidian resuelve por
  nombre, no por ruta.
- Enlaces internos con `[[Nombre de la nota]]`. Para una sección:
  `[[Nota#Encabezado]]`.
- No enlaces a archivos de código con `[[...]]`: son rutas, no notas. Escríbelas
  como `` `src/lib/tiempo.ts` ``.

## Frontmatter

Toda nota escrita a mano empieza así:

```yaml
---
tipo: nota
area: panel
estado: verificado
actualizado: 2026-10-27
resumen: Una línea que explique para qué sirve esta nota.
fuentes:
  - src/middleware.ts
tags:
  - panel
---
```

- `tipo`: `inicio`, `indice`, `nota`, `receta`, `bitacora` o `generado`.
- `area`: `proyecto`, `panel`, `web`, `datos`, `recetas` o `agentes`.
- `estado`: `verificado` cuando se cotejó contra el código; `borrador` si falta.
- `actualizado`: fecha ISO (`AAAA-MM-DD`), no texto libre.
- `resumen`: una línea; [[Indice completo]] la usa tal cual.
- `fuentes`: rutas reales que respaldan lo que dice la nota. Opcional en la
  bitácora.

## Notas generadas

Cuatro notas salen del código y **no se editan a mano**:

- [[Indice completo]] ← títulos, resúmenes y carpetas.
- [[Mapa del repositorio]] ← estructura y conteos de archivos.
- [[Rutas del panel]] ← `src/pages/`, `prerender` y `SOLO_DOCTORA`.
- [[Tablas]] ← `src/lib/supabase/tipos.ts` y las migraciones.

Llevan `tipo: generado`, un `hash` y la fecha en que cambió el cuerpo. Si
`pnpm boveda:verificar` dice que están desactualizadas, corre `pnpm boveda`; no
las corrijas a mano. Si el generador se equivoca, se corrige
`scripts/vault/vault.py`.

## Editor

`vault/.obsidian/` viaja con el repo para que la bóveda abra igual en cualquier
máquina: enlaces por nombre (`newLinkFormat: shortest`), wikilinks en vez de
Markdown, actualización automática de enlaces al renombrar y preview en vivo.
Los adjuntos van a `99-Adjuntos/`.

`workspace.json` (qué nota quedó abierta y cómo) es de cada máquina y está en el
`.gitignore` de esa carpeta. No lo commitees: cambia en cada sesión y ensucia el
diff.

## Tamaño

- Una nota por área, no por archivo. Si una nota pasa de ~120 líneas, divide por
  tema y enlaza.
- Las tablas y los diagramas Mermaid valen más que los párrafos largos.
- No copies aquí lo que ya dice `docs/panel/`: enlaza y resume.
