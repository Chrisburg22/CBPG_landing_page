---
tipo: nota
area: datos
estado: verificado
actualizado: 2026-10-27
resumen: Cómo se aplican las migraciones, qué contiene cada una y qué se actualiza después.
fuentes:
  - supabase/migrations/README.md
  - supabase/migrations/
  - src/lib/supabase/tipos.ts
tags:
  - datos
  - migraciones
---

# Migraciones

## Cómo se aplican

No hay CLI de Supabase ni base local: el plan gratuito no da ramas. Cada archivo
se aplica **a mano sobre producción** con la herramienta de Supabase
(`apply_migration`), con el mismo nombre que el archivo pero sin el número ni la
extensión. El nombre registrado en el remoto debe coincidir, o `list_migrations`
deja de servir para saber qué falta.

Por eso cada migración va sola y es lo más pequeña posible. No hay `down`: para
deshacer, se escribe otra migración.

## Qué hay

| Archivo | Contenido |
| --- | --- |
| `0001_solicitudes_estado_terminado.sql` | Añade `terminado` al CHECK de `solicitudes.estado` |
| `0002_pacientes.sql` | Tabla `pacientes`, índices, trigger y RLS |
| `0003_pacientes_sin_trigram.sql` | Quita la extensión `pg_trgm` y su índice |
| `0004_planes_cuotas_pagos.sql` | Planes, cuotas, pagos, triggers, RLS y GRANT por columna |
| `0005_vistas_y_generar_cuotas.sql` | `vista_cuotas`, `vista_saldo_paciente` y `crear_plan_con_cuotas` |
| `0006_roles.sql` | `admins.rol`, `privado.rol_actual()` / `es_doctora()` y políticas por rol |
| `0007_agenda_y_seguimiento.sql` | Citas, acciones, recordatorios, origen y próxima acción |

`solicitudes` y `admins` se crearon antes de esta carpeta con la migración
`crear_solicitudes_y_admins`; no tienen `.sql` aquí.

## Reglas que sigue el SQL

- `id uuid primary key default gen_random_uuid()`.
- `creado_en` / `actualizado_en timestamptz not null default now()` y trigger
  `BEFORE UPDATE` que llama a `public.tocar_actualizado_en()`.
- Estados como `CHECK` sobre texto, no enums.
- Longitudes como `CHECK`, no `varchar(n)`.
- RLS activo en todas; políticas con `privado.es_admin()` o
  `privado.es_doctora()`.
- GRANT por columna cuando algo no debe poder escribirse. Los tipos de
  `tipos.ts` reflejan esos GRANT.

## Procedimiento

1. Escribe la migración más pequeña y **compatible hacia atrás**.
2. Aplícala al remoto con `apply_migration` y el nombre sin número.
3. Actualiza `src/lib/supabase/tipos.ts` **a mano**, cotejando con
   `generate_typescript_types`. Conserva las dos divergencias documentadas:
   uniones estrechas para los CHECK y `Update` limitado a lo escribible.
4. Revisa las políticas RLS y los GRANT de las columnas nuevas.
5. Despliega el código que usa el esquema nuevo.
6. Limpia lo viejo en una migración posterior.

El orden importa: si el código nuevo se despliega antes de la columna, las
peticiones que ya están entrando fallan.

## Antes de escribir una migración

- ¿La columna nueva puede ser `NOT NULL` con `default`? Casi siempre sí.
- ¿El nulo significa algo? Si no, no lo permitas.
- ¿Hace falta un índice? Mira las consultas del panel: agenda por `inicia_en`,
  seguimiento por `proxima_accion_en`, cobranza por `vence_el`.
- ¿La política nueva debe ser `es_admin()` o `es_doctora()`? Si es dinero o
  ficha clínica, `es_doctora()`.
- ¿La tabla debe ser invisible para el cliente? RLS sin políticas y sin GRANT,
  como `integracion_google`.

Ver [[Modelo de datos]] y [[Acceso y roles]].
