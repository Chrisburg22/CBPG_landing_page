# Modelo de datos

Supabase Postgres, proyecto `wffqduqgnknopjrwyjpe`. Migraciones en `supabase/migrations/` (la tabla `solicitudes` es anterior a ellas).

```mermaid
erDiagram
  admins {
    uuid user_id PK
    text email
    text rol "doctora | recepcionista"
  }
  solicitudes {
    uuid id PK
    text nombre
    text telefono
    text tratamiento
    text mensaje
    text estado "nueva | contactada | agendada | descartada | terminado"
    text origen "sitio | instagram | recomendacion | otro"
    timestamptz proxima_accion_en
    text proxima_accion_tipo "whatsapp | llamada | cita | otro"
    text notas
  }
  acciones_prospecto {
    uuid id PK
    uuid solicitud_id FK
    uuid cita_id FK
    text tipo "whatsapp | llamada | cita_creada | cita_reprogramada | cita_cancelada | conversion | nota"
    uuid actor
  }
  pacientes {
    uuid id PK
    uuid solicitud_id FK "UNIQUE, null si alta directa"
    text nombre
    text estado "activo | retencion | alta | pausado"
    date inicio
  }
  planes_tratamiento {
    uuid id PK
    uuid paciente_id FK
    numeric costo_total
    numeric enganche
    int num_cuotas
    int dia_corte
  }
  cuotas {
    uuid id PK
    uuid plan_id FK
    int numero
    numeric monto
    date vence_el
  }
  pagos {
    uuid id PK
    uuid paciente_id FK
    uuid cuota_id FK "null = abono, enganche o cargo suelto"
    text tipo "mensualidad | enganche | cargo_suelto"
    numeric monto
    text metodo "efectivo | transferencia | tarjeta"
    date pagado_el
  }
  recordatorios_cobro {
    uuid id PK
    uuid cuota_id FK
    uuid paciente_id FK
    text tipo "whatsapp | llamada"
  }
  citas {
    uuid id PK
    uuid solicitud_id FK "uno u otro"
    uuid paciente_id FK "uno u otro"
    text nombre_contacto
    timestamptz inicia_en
    int duracion_min
    text tipo "valoracion | control"
    text estado "programada | confirmada | atendida | cancelada | no_asistio"
    text google_sync "pendiente | sincronizada | error | desactivada"
    uuid responsable
  }
  integracion_google {
    smallint id PK "siempre 1"
    text refresh_token_cifrado
    text calendario_id
  }

  solicitudes ||--o{ acciones_prospecto : "historial"
  solicitudes ||--o| pacientes : "se convierte en"
  solicitudes ||--o{ citas : "valoraciones"
  pacientes ||--o{ citas : "controles"
  citas ||--o{ acciones_prospecto : "cita_id"
  pacientes ||--o| planes_tratamiento : "plan"
  planes_tratamiento ||--|{ cuotas : "genera"
  pacientes ||--o{ pagos : ""
  cuotas ||--o{ pagos : "se aplica a"
  cuotas ||--o{ recordatorios_cobro : ""
```

## Vistas

- **`vista_cuotas`**: cada cuota con `pagado`, `restante` y `estado` calculado. Precedencia: `pagada` › `vencida` (`vence_el < current_date`) › `parcial` › `pendiente`.
- **`vista_saldo_paciente`**: costo total, pagado, saldo, cuotas vencidas, monto vencido y próxima fecha.

El estado de una cuota **no se guarda**: se deriva de la fecha y de los pagos, así que no hay nada que «actualizar» cuando pasa el día de corte.

## Quién puede qué (RLS)

| Tabla | Doctora | Recepcionista |
|---|---|---|
| solicitudes, acciones_prospecto, citas | leer y escribir | leer y escribir |
| pacientes, planes, cuotas, pagos, recordatorios | leer y escribir | **nada** |
| integracion_google | solo por servidor (clave secreta) | nada |
| admins | su propia fila | su propia fila |
