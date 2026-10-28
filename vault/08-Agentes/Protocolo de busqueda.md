---
tipo: nota
area: agentes
estado: verificado
actualizado: 2026-10-27
resumen: Cómo leer la bóveda, buscar en el repo y no dejar la documentación atrás.
fuentes:
  - AGENTS.md
  - vault/00-Inicio/Boveda CBPG.md
tags:
  - agentes
  - proceso
---

# Protocolo de busqueda

Reglas para trabajar en este repo sin leer de más y sin dejar la bóveda
desactualizada. Aplica a OpenCode, Claude Code y cualquier agente.

## Al iniciar

1. Lee [[Boveda CBPG|la nota de inicio]].
2. Identifica el área y lee **solo** esa nota.
3. Abre los archivos que la nota nombra. Si no alcanza, busca con `rg` acotado a
   la carpeta del área, no a todo el repo.

El plugin de OpenCode inyecta la nota de inicio una vez por sesión. Si no está
activo, lee `vault/00-Inicio/Boveda CBPG.md` a mano.

## Al buscar

| Necesitas | Lee antes de abrir código |
| --- | --- |
| Rutas, prerender o endpoints | [[Rutas del panel]] |
| Acceso, roles o RLS | [[Acceso y roles]] |
| Prospectos, citas o agenda | [[Prospectos y agenda]] |
| Pacientes, cuotas o pagos | [[Pacientes y cobranza]] |
| Google Calendar | [[Google Calendar]] |
| Copy, formulario o fotos | [[Landing y contenido]] |
| Tablas y columnas | [[Tablas]] |
| Migraciones | [[Migraciones]] |
| Comandos y puertos | [[Comandos y verificacion]] |

No leas una nota generada completa si solo necesitas una sección: usa sus
encabezados (`[[Tablas#citas]]`, `[[Rutas del panel#admin]]`).

## Búsqueda acotada

```bash
rg "texto" src/pages/admin
rg "texto" src/lib
rg --files src/lib/google
rg -n "prerender" src/pages/admin
```

- No hagas `rg` en la raíz sin `-g` o sin ruta: incluye `node_modules`, `dist`,
  `.astro` y `vault`.
- Los archivos `.pen` no se leen con `Read` ni `Grep`; usa las herramientas de
  pencil.
- No leas `pnpm-lock.yaml`, `dist/` ni los HTML de `design/panel/`.

## Al cambiar código

- Si cambias rutas, prerender, esquema, pantallas o roles, actualiza la nota del
  área en el mismo cambio.
- Si cambias una tabla o columna, actualiza `tipos.ts` **y** [[Modelo de datos]].
- No edites notas con `tipo: generado`; corre `pnpm boveda:generar`.
- Si una nota contradice al código, gana el código: corrige la nota.
- Añade `fuentes:` al frontmatter cuando la nota dependa de archivos concretos;
  así `verificar` avisa si envejeció.

## Seguridad

- `SUPABASE_SECRET_KEY` bypasa RLS. Solo se usa en `/api/*`; nunca en una página,
  componente o variable `PUBLIC_`.
- `solicitudes.mensaje` y `pacientes.notas` pueden contener datos de salud. No
  los pongas en logs, URLs, ejemplos ni `set:html`.
- No inventes datos legales, clínicos ni credenciales. Si falta un dato de la
  doctora, déjalo marcado como pendiente.
- No imprimas `.env` ni tokens de Google.

## Al cerrar

1. `pnpm boveda`
2. Revisa el diff de `vault/`.
3. Añade una entrada al principio de [[Bitacora de sesiones]] con objetivo,
   cambios, decisiones y pendientes.

El generador actualiza las notas derivadas del código; **las decisiones y los
pendientes son responsabilidad del agente**.

## Qué no hacer

- No leer toda la bóveda ni todo el repo «por si acaso».
- No duplicar en una nota manual lo que ya genera `vault.py`.
- No editar [[Indice completo]] ni las demás notas generadas.
- No dejar una migración aplicada solo en local: aquí no hay local.
