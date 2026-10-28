---
tipo: receta
area: recetas
estado: verificado
actualizado: 2026-10-27
resumen: Cómo regenerar, verificar y corregir la bóveda sin editar notas generadas.
fuentes:
  - scripts/vault/vault.py
  - vault/00-Inicio/Convenciones de la boveda.md
tags:
  - recetas
  - agentes
---

# Actualizar la boveda

## Cuándo

| Cambio | Acción |
| --- | --- |
| Ruta, prerender o rol | `pnpm boveda` + revisar [[Rutas del panel]] |
| Tabla, columna o migración | `pnpm boveda` + [[Modelo de datos]] / [[Migraciones]] |
| Carpeta o archivo nuevo | `pnpm boveda` + [[Mapa del repositorio]] |
| Arquitectura o flujo | editar la nota del área a mano + fecha |
| Descubres una contradicción | corrige la nota; gana el código |

## Procedimiento

```bash
# 1. Regenerar lo que sale del código
pnpm boveda:generar

# 2. Verificar enlaces, fuentes y notas obsoletas
pnpm boveda:verificar

# 3. Ver el mapa que recibe el agente al iniciar
pnpm boveda:brief
```

`pnpm boveda` hace los dos primeros pasos seguidos.

El plugin de OpenCode `.opencode/plugins/boveda-cbpg.ts` inyecta la nota de
inicio una vez por sesión (la lee del disco, sin llamar a Python) y corre
`generar` + `verificar` cuando la sesión queda inactiva. Si el plugin falla,
hazlo a mano; `brief` sigue sirviendo para ver el mapa desde la terminal.

## Notas generadas

No se editan a mano:

- [[Indice completo]] — títulos, resúmenes y carpetas.
- [[Mapa del repositorio]] — estructura y conteos.
- [[Rutas del panel]] — rutas, prerender y acceso.
- [[Tablas]] — columnas, tipos, RLS, vistas y funciones.

Llevan `tipo: generado`, `hash` y `commit`. Si `verificar` dice que están
obsoletas, corre `generar`. Si el generador se equivoca, se corrige
`scripts/vault/vault.py`, no la nota.

## Corregir un aviso

- **Nota obsoleta**: abre la nota y su fuente, actualiza el contenido y cambia
  `actualizado:` a la fecha en que lo verificaste.
- **Fuente inexistente**: la nota apunta a un archivo que se movió o borró.
  Corrige la ruta o quita la fuente.
- **Enlace roto**: revisa el nombre exacto de la nota; Obsidian resuelve por
  nombre, no por ruta.
- **Encabezado inexistente**: el enlace apunta a una sección que cambió de
  título.

## Reglas

- Nombres de archivo sin acentos; títulos con acentos.
- Un nombre de nota es único en toda la bóveda.
- No dupliques lo que ya genera el script.
- No metas secretos, tokens ni datos de pacientes.
- Cada sesión deja una entrada en [[Bitacora de sesiones]].

Ver [[Convenciones de la boveda]] y [[Protocolo de busqueda]].
