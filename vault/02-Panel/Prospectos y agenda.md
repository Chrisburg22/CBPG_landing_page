---
tipo: nota
area: panel
estado: verificado
actualizado: 2026-10-27
resumen: Estados del prospecto, seguimiento, agenda, asistencia y conversión a paciente.
fuentes:
  - src/lib/solicitudes.ts
  - src/lib/seguimiento.ts
  - src/lib/citas.ts
  - src/lib/horario.ts
  - docs/panel/prospectos.md
  - docs/panel/agenda.md
tags:
  - panel
  - prospectos
  - agenda
---

# Prospectos y agenda

## Prospectos

Cada formulario del sitio crea una fila en `solicitudes` con estado `nueva`.

```text
nueva → contactada → agendada → terminado (solo al convertir en paciente)
  ↓         ↓           ↓
descartada ← ─ ─ ─ ─ ─ ┘
```

- `terminado` **no se elige a mano**: solo lo pone «Convertir en paciente», que
  además crea la ficha. Dejarlo manual permitiría un terminado sin paciente.
- `descartada → contactada` es válido si la persona vuelve a escribir.
- Estados manuales: `nueva`, `contactada`, `agendada`, `descartada`.
- Origen: `sitio`, `instagram`, `recomendacion`, `otro`.

En la ficha:

- Historial en `acciones_prospecto` (`whatsapp`, `llamada`, `cita_creada`,
  `cita_reprogramada`, `cita_cancelada`, `conversion`, `nota`).
- Próxima acción en `solicitudes.proxima_accion_en/tipo/nota`; `null` significa
  nada pendiente.
- «Hecho» limpia la próxima acción y deja una nota en el historial. Cambiar de
  estado **no** borra el seguimiento: aparece un aviso para quitarlo.
- Convertir solo lo puede hacer la doctora; el formulario viene precargado y el
  prospecto queda `terminado`.

Archivos: `src/lib/solicitudes.ts`, `src/lib/seguimiento.ts`,
`src/pages/admin/prospectos/`, `src/pages/admin/solicitudes/[id].astro`
(redirección 301 a la ficha nueva).

## Agenda

Citas de **valoración** (prospectos) y **control** (pacientes).

- Rejilla de **9:00 a 19:00**, sábado **9:00 a 13:00**, domingo cerrado.
- Vistas día/semana; las citas de domingo o fuera de horario van a **Fuera de
  horario**, no se esconden ni se recortan.
- Filtros por estado y «Solo las mías» (`responsable`).
- Estados: `programada`, `confirmada`, `atendida`, `cancelada`, `no_asistio`.
- Cancelar no borra: la cita queda marcada, sigue en la agenda y se apunta en el
  historial del prospecto.
- Desde una valoración `atendida`, la doctora ve «¿Aceptó el tratamiento?» y
  puede convertir en paciente.

```text
programada → confirmada → atendida
     ↓            ↓
  cancelada    no_asistio
```

`citas` guarda `inicia_en` en UTC y `duracion_min`. La hora se teclea y se pinta
en México con `src/lib/tiempo.ts`; la geometría de la rejilla está en
`src/lib/horario.ts`.

Al crear una cita desde un prospecto `nueva`/`contactada`, el prospecto pasa a
`agendada` y se registra `cita_creada`. Si Google está conectado, la cita se
copia; si falla, queda `google_sync = 'error'` y se reintenta. Ver
[[Google Calendar]].

## Inicio

`/admin` es la cola de trabajo: sin contestar, seguimiento vencido/hoy, citas por
confirmar y (solo doctora) cuotas vencidas. Muestra hasta 6 por bloque y cada
persona una sola vez; si tiene prospecto y seguimiento, gana el seguimiento.
Las métricas de captación están en `src/lib/metricas.ts`.

## Dónde tocar

| Quiero… | Archivo |
| --- | --- |
| Estados o listado de prospectos | `src/lib/solicitudes.ts` |
| Seguimiento e historial | `src/lib/seguimiento.ts` |
| Citas y asistencia | `src/lib/citas.ts` |
| Rejilla y horario | `src/lib/horario.ts` |
| Pantallas | `src/pages/admin/prospectos/`, `src/pages/admin/agenda/` |
| Mensajes de WhatsApp | `src/lib/contacto-directo.ts` |
