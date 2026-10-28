---
tipo: generado
generado_por: scripts/vault/vault.py
hash: 8f30ddf8410f
actualizado: 2026-10-27
tags:
  - datos
  - generado
---

<!-- No editar a mano: pnpm boveda:generar -->

# Tablas

Esquema leído de `src/lib/supabase/tipos.ts` y de las migraciones. Los
tipos de TypeScript mandan; el SQL aporta `NOT NULL`, `default` y claves
foráneas cuando existen. Los CHECK de estado se ven en el tipo de TS.

- **10 tablas**, **2 vistas**, **116 columnas**.
- `solicitudes` y `admins` son anteriores a `supabase/migrations/`; su
  esquema vive en `tipos.ts`.
- Los importes `numeric` llegan como `string`, no como `number`.

## Tablas

[[#acciones_prospecto]] · [[#admins]] · [[#citas]] · [[#cuotas]] · [[#integracion_google]] · [[#pacientes]] · [[#pagos]] · [[#planes_tratamiento]] · [[#recordatorios_cobro]] · [[#solicitudes]]

## acciones_prospecto

`supabase/migrations/0007_agenda_y_seguimiento.sql` · 7 columnas · Doctora y recepción

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `solicitud_id` | `string` | NOT NULL, FK → `solicitudes.id` (on delete cascade) |
| `cita_id` | `string \| null` | FK → `citas.id` (on delete set null) |
| `tipo` | `TipoAccion` | NOT NULL |
| `nota` | `string` | NOT NULL, default `''` |
| `actor` | `string \| null` | default `auth.uid()` |

## admins

`src/lib/supabase/tipos.ts` · 4 columnas · Cada cuenta su propia fila

| Columna | Tipo | Notas |
| --- | --- | --- |
| `user_id` | `string` | — |
| `email` | `string` | — |
| `creado_en` | `string` | — |
| `rol` | `Rol` | — |

## citas

`supabase/migrations/0007_agenda_y_seguimiento.sql` · 16 columnas · Doctora y recepción

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `actualizado_en` | `string` | NOT NULL, default `now()` |
| `solicitud_id` | `string \| null` | FK → `solicitudes.id` (on delete set null) |
| `paciente_id` | `string \| null` | FK → `pacientes.id` (on delete set null) |
| `nombre_contacto` | `string` | NOT NULL, default `''` |
| `telefono_contacto` | `string` | NOT NULL, default `''` |
| `inicia_en` | `string` | NOT NULL |
| `duracion_min` | `number` | NOT NULL, default `30` |
| `tipo` | `TipoCita` | NOT NULL, default `'valoracion'` |
| `estado` | `EstadoCita` | NOT NULL, default `'programada'` |
| `nota` | `string` | NOT NULL, default `''` |
| `responsable` | `string \| null` | default `auth.uid()` |
| `google_evento_id` | `string` | NOT NULL, default `''` |
| `google_sync` | `EstadoSync` | NOT NULL, default `'desactivada'` |
| `google_error` | `string` | NOT NULL, default `''` |

## cuotas

`supabase/migrations/0004_planes_cuotas_pagos.sql` · 6 columnas · Solo doctora

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `plan_id` | `string` | NOT NULL, FK → `planes_tratamiento.id` (on delete cascade) |
| `numero` | `number` | NOT NULL |
| `monto` | `Importe` | NOT NULL |
| `vence_el` | `string` | NOT NULL |

## integracion_google

`supabase/migrations/0007_agenda_y_seguimiento.sql` · 11 columnas · Solo servidor (RLS sin políticas ni GRANT)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `number` | PK, default `1` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `actualizado_en` | `string` | NOT NULL, default `now()` |
| `cuenta` | `string` | NOT NULL, default `''` |
| `calendario_id` | `string` | NOT NULL, default `''` |
| `calendario_nombre` | `string` | NOT NULL, default `''` |
| `refresh_token_cifrado` | `string` | NOT NULL, default `''` |
| `access_token_cifrado` | `string` | NOT NULL, default `''` |
| `access_expira_en` | `string \| null` | — |
| `conectado_en` | `string \| null` | — |
| `ultimo_error` | `string` | NOT NULL, default `''` |

## pacientes

`supabase/migrations/0002_pacientes.sql` · 10 columnas · Solo doctora

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `actualizado_en` | `string` | NOT NULL, default `now()` |
| `solicitud_id` | `string \| null` | UNIQUE, FK → `solicitudes.id` (on delete set null) |
| `nombre` | `string` | NOT NULL, default `''` |
| `telefono` | `string` | NOT NULL, default `''` |
| `tratamiento` | `string` | NOT NULL, default `''` |
| `estado` | `EstadoPaciente` | NOT NULL, default `'activo'` |
| `inicio` | `string` | NOT NULL, default `current_date` |
| `notas` | `string` | NOT NULL, default `''` |

## pagos

`supabase/migrations/0004_planes_cuotas_pagos.sql` · 11 columnas · Solo doctora

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `actualizado_en` | `string` | NOT NULL, default `now()` |
| `paciente_id` | `string` | NOT NULL, FK → `pacientes.id` (on delete cascade) |
| `cuota_id` | `string \| null` | FK → `cuotas.id` (on delete set null) |
| `tipo` | `TipoPago` | NOT NULL, default `'mensualidad'` |
| `concepto` | `string` | NOT NULL, default `''` |
| `monto` | `Importe` | NOT NULL |
| `metodo` | `MetodoPago` | NOT NULL, default `'efectivo'` |
| `pagado_el` | `string` | NOT NULL, default `current_date` |
| `nota` | `string` | NOT NULL, default `''` |

## planes_tratamiento

`supabase/migrations/0004_planes_cuotas_pagos.sql` · 10 columnas · Solo doctora

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `actualizado_en` | `string` | NOT NULL, default `now()` |
| `paciente_id` | `string` | NOT NULL, FK → `pacientes.id` (on delete cascade) |
| `tratamiento` | `string` | NOT NULL, default `''` |
| `costo_total` | `Importe` | NOT NULL, default `0` |
| `enganche` | `Importe` | NOT NULL, default `0` |
| `num_cuotas` | `number` | NOT NULL, default `0` |
| `dia_corte` | `number` | NOT NULL, default `1` |
| `inicio` | `string` | NOT NULL, default `current_date` |

## recordatorios_cobro

`supabase/migrations/0007_agenda_y_seguimiento.sql` · 7 columnas · Solo doctora

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | PK, default `gen_random_uuid()` |
| `creado_en` | `string` | NOT NULL, default `now()` |
| `cuota_id` | `string` | NOT NULL, FK → `cuotas.id` (on delete cascade) |
| `paciente_id` | `string` | NOT NULL, FK → `pacientes.id` (on delete cascade) |
| `tipo` | `TipoRecordatorio` | NOT NULL, default `'whatsapp'` |
| `enviado_por` | `string \| null` | default `auth.uid()` |
| `nota` | `string` | NOT NULL, default `''` |

## solicitudes

`src/lib/supabase/tipos.ts` · 15 columnas · Doctora y recepción (política previa a las migraciones)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | — |
| `creado_en` | `string` | — |
| `actualizado_en` | `string` | — |
| `nombre` | `string` | — |
| `telefono` | `string` | — |
| `tratamiento` | `string` | — |
| `mensaje` | `string` | — |
| `consentimiento_en` | `string` | — |
| `aviso_version` | `string` | — |
| `estado` | `EstadoSolicitud` | — |
| `notas` | `string` | — |
| `origen` | `OrigenProspecto` | — |
| `proxima_accion_en` | `string \| null` | — |
| `proxima_accion_tipo` | `TipoAccionPendiente \| null` | — |
| `proxima_accion_nota` | `string` | — |

## Vistas

### vista_cuotas

`src/lib/supabase/tipos.ts` · solo lectura (`security_invoker`)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | — |
| `plan_id` | `string` | — |
| `paciente_id` | `string` | — |
| `numero` | `number` | — |
| `monto` | `Importe` | — |
| `vence_el` | `string` | — |
| `pagado` | `Importe` | — |
| `restante` | `Importe` | — |
| `estado` | `EstadoCuota` | — |

### vista_saldo_paciente

`src/lib/supabase/tipos.ts` · solo lectura (`security_invoker`)

| Columna | Tipo | Notas |
| --- | --- | --- |
| `paciente_id` | `string` | — |
| `plan_id` | `string` | — |
| `costo_total` | `Importe` | — |
| `num_cuotas` | `number` | — |
| `pagado` | `Importe` | — |
| `saldo` | `Importe` | — |
| `cuotas_vencidas` | `number` | — |
| `monto_vencido` | `Importe` | — |
| `proxima_vence_el` | `string \| null` | — |
| `cuotas_pagadas` | `number` | — |

## Funciones

- `public.crear_plan_con_cuotas(...)` — crea el plan y sus cuotas.
- `public.tocar_actualizado_en()` — trigger `BEFORE UPDATE`.
- `privado.es_admin()` — doctora o recepción.
- `privado.es_doctora()` — solo doctora.
- `privado.rol_actual()` — rol de `auth.uid()`.

## Reglas

- RLS activo en todas las tablas; la política es la barrera real.
- `integracion_google`: RLS sin políticas y sin GRANT, solo clave secreta.
- Estados con `CHECK`, no enums de Postgres.
- GRANT por columna; `tipos.ts` refleja lo escribible en `Update`.
- Horas con zona en `timestamptz` (UTC); fechas puras en `date`.

Ver [[Modelo de datos]] y [[Migraciones]].
