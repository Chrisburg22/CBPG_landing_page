# 6 · Secuencia

Mensajes en orden temporal. Flecha continua = petición; punteada = respuesta. `Postgres` es Supabase vía PostgREST con el cliente de la usuaria, sujeto a RLS, salvo donde se indica «clave de servicio».

## Q-01 · Solicitar valoración

```mermaid
sequenceDiagram
    participant Visitante
    participant BookingForm
    participant ApiContact
    participant Postgres

    Visitante->>BookingForm: Llena datos y acepta el aviso
    BookingForm->>ApiContact: POST /api/contact (JSON)
    ApiContact->>ApiContact: Límite por IP, honeypot y validate
    ApiContact->>Postgres: insert solicitudes con clave de servicio (timeout 5 s)
    Postgres-->>ApiContact: ok
    ApiContact-->>BookingForm: 200 ok
    BookingForm-->>Visitante: Solicitud enviada
```

## Q-02 · Iniciar sesión

```mermaid
sequenceDiagram
    participant Doctora
    participant Navegador
    participant AuthEntrar
    participant SupabaseAuth
    participant Middleware
    participant Postgres

    Doctora->>Navegador: Correo y contraseña
    Navegador->>AuthEntrar: POST /admin/auth/entrar
    AuthEntrar->>AuthEntrar: Correo en ADMIN_EMAILS
    AuthEntrar->>SupabaseAuth: signInWithPassword
    SupabaseAuth-->>AuthEntrar: Sesión
    AuthEntrar-->>Navegador: 303 /admin con cookies
    Navegador->>Middleware: GET /admin
    Middleware->>SupabaseAuth: getUser (valida el token)
    SupabaseAuth-->>Middleware: Usuario
    Middleware->>Postgres: select rol from admins
    Postgres-->>Middleware: doctora
    Middleware-->>Navegador: Inicio (private, no-store)
```

## Q-03 · Agendar desde un prospecto, con Google

```mermaid
sequenceDiagram
    participant Usuaria
    participant NuevaCita
    participant Postgres
    participant GoogleCalendar

    Usuaria->>NuevaCita: GET /admin/agenda/nueva?solicitud=id
    NuevaCita->>Postgres: Obtener solicitud y ocupación del día
    Postgres-->>NuevaCita: Nombre, teléfono y citas del día
    NuevaCita-->>Usuaria: Formulario precargado
    Usuaria->>NuevaCita: POST fecha, tipo y duración
    NuevaCita->>Postgres: insert cita (programada, pendiente)
    NuevaCita->>Postgres: update solicitud a agendada
    NuevaCita->>Postgres: insert acción cita_creada
    NuevaCita->>Postgres: Leer integración y token cifrado
    NuevaCita->>GoogleCalendar: Crear evento
    GoogleCalendar-->>NuevaCita: id del evento
    NuevaCita->>Postgres: google_sync sincronizada
    NuevaCita-->>Usuaria: 303 agenda del día con la cita abierta
```

## Q-04 · Convertir en paciente

```mermaid
sequenceDiagram
    participant Doctora
    participant Convertir
    participant Postgres

    Doctora->>Convertir: GET /admin/prospectos/id/convertir
    Convertir->>Postgres: Solicitud y paciente existente
    Postgres-->>Convertir: Solicitud sin ficha
    Convertir-->>Doctora: Formulario con los datos del prospecto
    Doctora->>Convertir: POST nombre, tratamiento, inicio y estado
    Convertir->>Postgres: insert pacientes con solicitud_id
    Postgres-->>Convertir: id del paciente
    Convertir->>Postgres: update solicitud a terminado
    Convertir->>Postgres: Limpiar próxima acción
    Convertir->>Postgres: insert acción conversion
    Convertir-->>Doctora: 303 ficha del paciente con aviso creado
```

## Q-05 · Crear o editar el plan

```mermaid
sequenceDiagram
    participant Doctora
    participant Plan
    participant Postgres
    participant Ficha

    Doctora->>Plan: POST costo, enganche, mensualidades, corte e inicio
    Plan->>Plan: Validar rangos
    Plan->>Postgres: rpc crear_plan_con_cuotas
    Postgres->>Postgres: delete plan anterior y cuotas en cascada
    Postgres->>Postgres: insert plan y N cuotas con vence_el
    Postgres-->>Plan: id del plan
    Plan-->>Doctora: 303 ficha con aviso de plan
    Doctora->>Ficha: GET /admin/pacientes/id
    Ficha->>Postgres: vista_saldo_paciente y vista_cuotas
    Postgres-->>Ficha: Saldo y estado de cada cuota
    Ficha-->>Doctora: Resumen y mensualidades
```

## Q-06 · Registrar pago

```mermaid
sequenceDiagram
    participant Doctora
    participant RegistrarPago
    participant Postgres
    participant Ficha

    Doctora->>RegistrarPago: GET /admin/pagos/nuevo?cuota=id
    RegistrarPago->>Postgres: Cuota, pacientes, cuotas y saldo
    Postgres-->>RegistrarPago: Datos
    RegistrarPago-->>Doctora: Monto y concepto precargados
    Doctora->>RegistrarPago: POST método, fecha y nota
    RegistrarPago->>Postgres: insert pagos con cuota_id
    Postgres-->>RegistrarPago: id del pago
    RegistrarPago-->>Doctora: 303 ficha con aviso de pago
    Doctora->>Ficha: GET ficha
    Ficha->>Postgres: Vistas recalculadas
    Ficha-->>Doctora: Cuota pagada y saldo nuevo
```

## Q-07 · Recordatorio de cobro

```mermaid
sequenceDiagram
    participant Doctora
    participant Pagos
    participant Postgres
    participant WhatsApp

    Doctora->>Pagos: GET /admin/pagos
    Pagos->>Postgres: porCobrar, pacientes y último recordatorio
    Postgres-->>Pagos: Cuotas vencidas sin recordar
    Pagos-->>Doctora: Filas con WhatsApp y Marcar enviado
    Doctora->>WhatsApp: Abre wa.me con el mensaje de cobro
    WhatsApp-->>Doctora: Mensaje enviado a mano
    Doctora->>Pagos: POST accion=recordatorio
    Pagos->>Postgres: insert recordatorios_cobro
    Pagos-->>Doctora: 303 misma URL con Recordado hoy
```

## Q-08 · Conectar Google Calendar

```mermaid
sequenceDiagram
    participant Doctora
    participant Conectar
    participant GoogleOAuth
    participant Callback
    participant PantallaGoogle
    participant Postgres
    participant GoogleCalendar

    Doctora->>Conectar: GET /admin/integracion/google/conectar
    Conectar-->>Doctora: 303 a Google con state y cookie
    Doctora->>GoogleOAuth: Elige cuenta y acepta el permiso
    GoogleOAuth-->>Callback: Redirect con code y state
    Callback->>Callback: Comparar state con la cookie
    Callback->>GoogleOAuth: Intercambiar code por tokens
    GoogleOAuth-->>Callback: access y refresh token
    Callback->>GoogleOAuth: Correo de la cuenta
    Callback->>Postgres: upsert integracion_google cifrada
    Callback-->>Doctora: 303 a la pantalla con conectado=1
    Doctora->>PantallaGoogle: POST accion=calendario
    PantallaGoogle->>GoogleCalendar: Listar calendarios con escritura
    GoogleCalendar-->>PantallaGoogle: Calendarios
    PantallaGoogle->>Postgres: Guardar calendario_id
    PantallaGoogle-->>Doctora: 303 con guardado=1
```

## Q-09 · Reintentar la sincronización

```mermaid
sequenceDiagram
    participant Usuaria
    participant Agenda
    participant Postgres
    participant GoogleOAuth
    participant GoogleCalendar

    Usuaria->>Agenda: POST accion=sincronizar
    Agenda->>Postgres: Citas con google_sync pendiente o error
    Postgres-->>Agenda: Lista de citas
    Agenda->>Postgres: Leer integración y token cifrado
    Agenda->>GoogleOAuth: Refrescar token si venció
    GoogleOAuth-->>Agenda: access token nuevo
    Agenda->>GoogleCalendar: Crear, actualizar o cancelar cada evento
    GoogleCalendar-->>Agenda: ok o error por cita
    Agenda->>Postgres: google_sync sincronizada o error
    Agenda-->>Usuaria: 303 con aviso guardado
```

## Q-10 · Cron keepalive

```mermaid
sequenceDiagram
    participant VercelCron
    participant Keepalive
    participant Postgres

    VercelCron->>Keepalive: GET /api/cron/keepalive con Bearer
    Keepalive->>Keepalive: Comparar CRON_SECRET en tiempo constante
    Keepalive->>Postgres: count solicitudes, select una y count nuevas
    Postgres-->>Keepalive: Conteos
    Keepalive-->>VercelCron: 200 ok, total y nuevas
```

## Q-11 · Contactar desde la cola y aviso al volver

```mermaid
sequenceDiagram
    participant Usuaria
    participant Inicio
    participant WhatsApp
    participant Postgres

    Usuaria->>Inicio: Toca Contactar en un prospecto nuevo
    Inicio->>WhatsApp: Abre wa.me con el mensaje
    Usuaria->>WhatsApp: Escribe y envía
    Usuaria->>Inicio: Vuelve a la app (visibilitychange)
    Inicio-->>Usuaria: Aviso Le escribiste a este prospecto
    Usuaria->>Inicio: POST marcar como contactada
    Inicio->>Postgres: update solicitud a contactada
    Inicio->>Postgres: insert acción whatsapp
    Inicio-->>Usuaria: 303 misma URL y sale de la cola
```
