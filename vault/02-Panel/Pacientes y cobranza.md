---
tipo: nota
area: panel
estado: verificado
actualizado: 2026-10-27
resumen: Fichas, plan de tratamiento, cuotas derivadas, pagos y recordatorios de cobro.
fuentes:
  - src/lib/pacientes.ts
  - src/lib/pagos.ts
  - src/lib/cobranza.ts
  - docs/panel/pacientes.md
  - docs/panel/pagos.md
tags:
  - panel
  - pacientes
  - cobranza
---

# Pacientes y cobranza

Todo esto es **solo doctora**: la interfaz lo esconde, `SOLO_DOCTORA` corta la
ruta y RLS devuelve cero filas a la recepcionista.

## Pacientes

- `pacientes` tiene `solicitud_id` único (null si el alta fue directa), nombre,
  teléfono, tratamiento, estado e inicio.
- Estados: `activo`, `retencion`, `alta`, `pausado`.
- Se puede convertir un prospecto o dar de alta directo en
  `/admin/pacientes/nuevo`.
- `pacientes.notas` puede contener datos de salud: no va a logs, URLs ni
  `set:html`.

## Plan y cuotas

Al guardar un plan se llama al RPC `crear_plan_con_cuotas` con:

- costo total, enganche, número de mensualidades, día de corte (1–28) e inicio.

El RPC genera las cuotas iguales; el estado de cada cuota **no se guarda**, se
deriva en `vista_cuotas`:

```text
pendiente → parcial (abono menor) → pagada (pagado ≥ monto)
     ↓           ↓
  vencida ← ─ ─ ┘   (vence_el < current_date)
```

- `vista_saldo_paciente` resume costo, pagado, saldo, cuotas vencidas y próxima
  fecha.
- `cuotas` no tiene `UPDATE` en los GRANT: se rehacen borrando el plan y
  creándolo de nuevo. `tipos.ts` refleja eso con `Update: Record<string, never>`.

## Pagos

- `pagos` puede ser `mensualidad`, `enganche` o `cargo_suelto`.
- `cuota_id` nulo = abono al plan, enganche o cargo suelto.
- Métodos: `efectivo`, `transferencia`, `tarjeta`. **No hay datos de tarjeta**:
  solo se registra el método.
- Un pago menor al monto deja la cuota en `parcial`.
- Los importes llegan de Postgres `numeric` como **string**; no los conviertas a
  `number` sin pasar por `dinero()` de `src/lib/formato.ts`.

## Recordatorios

El panel **no manda mensajes**. La doctora abre WhatsApp con `wa.me` y el panel
solo lleva la cuenta:

- `recordatorios_cobro` registra `whatsapp` o `llamada`, quién y cuándo.
- «Marcar enviado» apunta el recordatorio; «Registrar» abre el pago con la cuota
  elegida.
- `src/lib/cobranza.ts` arma el mensaje con nombre, número de mensualidad, monto
  y fecha.

## Archivos

| Quiero… | Archivo |
| --- | --- |
| Fichas y estados | `src/lib/pacientes.ts` |
| Planes, cuotas, pagos y saldos | `src/lib/pagos.ts` |
| Recordatorios y mensaje de cobro | `src/lib/cobranza.ts` |
| Pantallas | `src/pages/admin/pacientes/`, `src/pages/admin/pagos/` |
| Formato de dinero/fechas | `src/lib/formato.ts` |

Ver [[Modelo de datos]] y [[Tablas]].
