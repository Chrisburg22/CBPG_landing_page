---
tipo: nota
area: datos
estado: verificado
actualizado: 2026-10-27
resumen: Tablas, relaciones, vistas, funciones y reglas de acceso del esquema.
fuentes:
  - src/lib/supabase/tipos.ts
  - supabase/migrations/
  - docs/panel/modelo-datos.md
tags:
  - datos
  - esquema
---

# Modelo de datos

Postgres en Supabase, proyecto `wffqduqgnknopjrwyjpe`. `solicitudes` y `admins`
son **anteriores** a `supabase/migrations/`; el resto está en migraciones.

## Relaciones

```text
solicitudes 1─┬─0..1 pacientes ─┬─0..1 planes_tratamiento ──1..* cuotas
              ├─0..* citas       ├─0..* pagos
              └─0..* acciones    └─0..* recordatorios_cobro
citas 1──0..* acciones_prospecto
cuotas 1──0..* pagos
cuotas 1──0..* recordatorios_cobro
admins (independiente: user_id de Supabase Auth)
integracion_google (fila única, id = 1)
```

- `pacientes.solicitud_id` es **único** y `on delete set null`: una ficha puede
  venir de un prospecto o de un alta directa.
- `citas` copia `nombre_contacto` y `telefono_contacto` en vez de resolverlos por
  join. Es deliberado: la recepcionista opera la agenda sin poder leer
  `pacientes`.
- Una cita enlaza `solicitud_id` **o** `paciente_id`, nunca los dos.
- `pagos.cuota_id` nulo = enganche, abono al plan o cargo suelto.

## Tablas

| Tabla | Para qué | Acceso |
| --- | --- | --- |
| `solicitudes` | Prospectos del formulario y su seguimiento | Doctora y recepción |
| `admins` | Correo y rol de cada cuenta | Cada quien su fila |
| `pacientes` | Fichas de pacientes | Solo doctora |
| `planes_tratamiento` | Costo, enganche, cuotas y día de corte | Solo doctora |
| `cuotas` | Mensualidades generadas por el plan | Solo doctora |
| `pagos` | Pagos y abonos | Solo doctora |
| `citas` | Valoraciones y controles con hora | Doctora y recepción |
| `acciones_prospecto` | Historial de seguimiento | Doctora y recepción |
| `recordatorios_cobro` | Rastro de avisos de cobro | Solo doctora |
| `integracion_google` | Tokens cifrados y calendario elegido | Solo servidor |

`admins` tiene `user_id` (PK, referencia a `auth.users`), `email`, `creado_en` y
`rol` (`doctora` o `recepcionista`, default `recepcionista`).

## Estados

- `solicitudes.estado`: `nueva`, `contactada`, `agendada`, `descartada`,
  `terminado`. `terminado` solo lo pone la conversión a paciente.
- `solicitudes.origen`: `sitio`, `instagram`, `recomendacion`, `otro`.
- `pacientes.estado`: `activo`, `retencion`, `alta`, `pausado`.
- `citas.estado`: `programada`, `confirmada`, `atendida`, `cancelada`,
  `no_asistio`.
- `citas.tipo`: `valoracion`, `control`.
- `citas.google_sync`: `pendiente`, `sincronizada`, `error`, `desactivada`.
- `pagos.tipo`: `mensualidad`, `enganche`, `cargo_suelto`.
- `pagos.metodo`: `efectivo`, `transferencia`, `tarjeta` (solo el método; nunca
  datos de tarjeta).

Los estados son **CHECK sobre texto**, no enums de Postgres. El estado de una
cuota no se guarda: se deriva en `vista_cuotas`.

## Vistas

- **`vista_cuotas`** — cada cuota con `pagado`, `restante` y `estado`
  (`pagada` › `vencida` › `parcial` › `pendiente`).
- **`vista_saldo_paciente`** — costo, pagado, saldo, cuotas vencidas, monto
  vencido y próxima fecha.

Las dos llevan `security_invoker`, así que heredan RLS.

## Funciones y triggers

- `public.crear_plan_con_cuotas(...)` — crea el plan y genera las cuotas. Es la
  única forma de crear un plan desde el panel.
- `public.tocar_actualizado_en()` — trigger `BEFORE UPDATE` en las tablas con
  `actualizado_en`.
- `privado.es_admin()` — `doctora` o `recepcionista`.
- `privado.es_doctora()` — solo `doctora`.
- `privado.rol_actual()` — rol de `auth.uid()`.

`es_admin` y `es_doctora` viven en el esquema `privado`, fuera de PostgREST.

## Reglas del esquema

- **RLS activo en todas las tablas.** Las políticas usan las funciones de
  `privado`; la interfaz no es la barrera.
- `integracion_google`: RLS activo, **cero políticas y ningún GRANT**. Solo se
  lee con la clave secreta desde el servidor.
- Columnas `NOT NULL` con `default` (`''` para texto, `now()` para fechas). El
  nulo solo aparece donde significa algo.
- Límites de longitud con `CHECK`, no `varchar(n)`.
- **GRANT por columna** para lo que la doctora no debe escribir; `tipos.ts`
  refleja esos GRANT en su `Update`.
- Importes `numeric` llegan a TypeScript como **string**. Convierte solo con
  `dinero()` de `src/lib/formato.ts`.
- Fechas con hora en `timestamptz` (UTC); fechas puras en `date`.

## Datos sensibles

`solicitudes.mensaje` y `pacientes.notas` pueden contener datos de salud. No van
a logs, URLs, `set:html` ni a un calendario. Ver [[Migraciones]] y [[Tablas]].
