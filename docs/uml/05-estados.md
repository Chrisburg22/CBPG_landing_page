# 5 · Estados

Máquinas de estados UML de cada entidad con ciclo de vida. Los nombres coinciden con los `ETIQUETA_*` de `src/lib/supabase/tipos.ts` y con los `check` de las migraciones.

## S-01 · Solicitud (prospecto)

```mermaid
stateDiagram-v2
    direction LR
    state "Nueva" as Nueva
    state "Contactada" as Contactada
    state "Agendada" as Agendada
    state "Descartada" as Descartada
    state "Terminado (ya es paciente)" as Terminado

    [*] --> Nueva: formulario del sitio
    Nueva --> Contactada: WhatsApp o llamada anotada
    Nueva --> Agendada: se crea cita
    Contactada --> Agendada: se crea cita
    Nueva --> Descartada: cambio manual
    Contactada --> Descartada: cambio manual
    Agendada --> Descartada: cambio manual
    Descartada --> Contactada: reactivar a mano
    Agendada --> Contactada: cambio manual
    Agendada --> Terminado: convertir en paciente
    Contactada --> Terminado: convertir en paciente
    Terminado --> [*]
```

- El selector de la ficha permite cualquier estado salvo `terminado` (`ESTADOS_MANUALES`).
- Agendar solo mueve a *agendada* desde *nueva* o *contactada*: un descartado que vuelve no reaparece como nuevo.
- Marcar *contactada* desde la ficha no anota contacto (H-04).

## S-02 · Próxima acción (seguimiento)

```mermaid
stateDiagram-v2
    direction LR
    state "Sin seguimiento" as SinSeguimiento
    state "Programada a futuro" as Futura
    state "De hoy (en la cola de Inicio)" as DeHoy
    state "Vencida (en rojo en Inicio y lista)" as Vencida

    [*] --> SinSeguimiento: solicitud nueva
    SinSeguimiento --> Futura: guardar seguimiento
    Futura --> Futura: cambiar fecha, tipo o nota
    Futura --> DeHoy: llega el dia
    DeHoy --> Vencida: pasa la hora
    Futura --> SinSeguimiento: hecho, quitar o convertir
    DeHoy --> SinSeguimiento: hecho, quitar o convertir
    Vencida --> SinSeguimiento: hecho, quitar o convertir
```

*De hoy* y *Vencida* no se guardan: se derivan de `proxima_accion_en` contra la hora actual.

## S-03 · Cita

```mermaid
stateDiagram-v2
    direction LR
    state "Programada" as Programada
    state "Confirmada" as Confirmada
    state "Atendida" as Atendida
    state "No asistio" as NoAsistio
    state "Cancelada (se conserva)" as Cancelada
    state ofrecer <<choice>>
    state "Conversion ofrecida a la doctora" as Ofrecida

    [*] --> Programada: guardar cita
    Programada --> Programada: reprogramar
    Programada --> Confirmada: confirmo por WhatsApp
    Confirmada --> Confirmada: reprogramar
    Programada --> Atendida: guardar asistencia
    Confirmada --> Atendida: guardar asistencia
    Programada --> NoAsistio: guardar asistencia
    Confirmada --> NoAsistio: guardar asistencia
    Programada --> Cancelada: cancelar
    Confirmada --> Cancelada: cancelar
    Cancelada --> Programada: corregir a mano
    NoAsistio --> Programada: corregir a mano
    Atendida --> ofrecer
    ofrecer --> Ofrecida: valoracion de prospecto sin ficha
    ofrecer --> [*]: control o ya es paciente
    Ofrecida --> [*]
    NoAsistio --> [*]
    Cancelada --> [*]
```

## S-04 · Sincronización Google de una cita

```mermaid
stateDiagram-v2
    direction LR
    state "Desactivada" as Desactivada
    state "Pendiente" as Pendiente
    state "Sincronizada" as Sincronizada
    state "Error (con mensaje)" as Error

    [*] --> Desactivada: crear sin integracion activa
    [*] --> Pendiente: crear con integracion activa
    Pendiente --> Sincronizada: crear, actualizar o cancelar evento
    Pendiente --> Error: Google responde con fallo
    Pendiente --> Desactivada: no hay sesion ni calendario
    Error --> Sincronizada: Reintentar ahora
    Error --> Error: el reintento vuelve a fallar
    Sincronizada --> Pendiente: editar, reprogramar o cancelar
    Desactivada --> Pendiente: editar con integracion activa
```

## S-05 · Cuota (estado derivado)

```mermaid
stateDiagram-v2
    direction LR
    state "Pendiente" as Pendiente
    state "Parcial" as Parcial
    state "Vencida" as Vencida
    state "Pagada" as Pagada

    [*] --> Pendiente: guardar plan genera cuotas
    Pendiente --> Parcial: abono menor al monto
    Pendiente --> Pagada: pagos cubren el monto
    Parcial --> Pagada: pagos cubren el monto
    Pendiente --> Vencida: pasa vence_el sin cubrir
    Parcial --> Vencida: pasa vence_el sin cubrir
    Vencida --> Pagada: pagos cubren el monto
    Pagada --> Pendiente: se quita el pago
    Pagada --> [*]: editar plan borra la cuota
    Vencida --> [*]: editar plan borra la cuota
```

Precedencia en `vista_cuotas`: `pagada` › `vencida` › `parcial` › `pendiente`. La fecha se compara con `current_date` en UTC (H-12), y editar el plan borra las cuotas (H-17).

## S-06 · Paciente (estado del tratamiento)

```mermaid
stateDiagram-v2
    direction LR
    state "Activo" as Activo
    state "Pausado" as Pausado
    state "En retencion" as Retencion
    state "Alta" as Alta

    [*] --> Activo: convertir prospecto o alta directa
    Activo --> Pausado: editar datos
    Pausado --> Activo: editar datos
    Activo --> Retencion: termina fase activa
    Retencion --> Alta: termina retencion
    Activo --> Alta: editar datos
    Alta --> Activo: reabrir a mano
    Alta --> [*]
```

El formulario deja elegir el estado inicial y cualquier cambio posterior; el diagrama muestra el uso esperado.

## S-07 · Sesión y acceso

```mermaid
stateDiagram-v2
    direction LR
    state "Sin sesion (login)" as SinSesion
    state "Sesion de Supabase valida" as Autenticada
    state rol <<choice>>
    state "Autorizada como doctora" as Doctora
    state "Autorizada como recepcionista" as Recepcion

    [*] --> SinSesion
    SinSesion --> SinSesion: credenciales o correo no permitido
    SinSesion --> Autenticada: signInWithPassword ok
    Autenticada --> rol: middleware en cada peticion
    rol --> Doctora: allowlist y rol doctora
    rol --> Recepcion: allowlist y rol recepcionista
    rol --> SinSesion: fuera de allowlist o sin fila en admins
    Recepcion --> Recepcion: ruta de doctora redirige a Inicio
    Doctora --> SinSesion: Salir o token invalido
    Recepcion --> SinSesion: Salir o token invalido
```

## S-08 · Integración con Google Calendar

```mermaid
stateDiagram-v2
    direction LR
    state "Sin credenciales en el servidor" as SinCredenciales
    state "Desconectada" as Desconectada
    state "Autorizada sin calendario" as SinCalendario
    state "Conectada" as Conectada
    state "Conectada con error" as ConError

    [*] --> SinCredenciales: faltan GOOGLE_CLIENT_ID, SECRET o TOKEN_KEY
    [*] --> Desconectada: credenciales presentes
    SinCredenciales --> Desconectada: configurar variables y redesplegar
    Desconectada --> SinCalendario: OAuth callback guarda tokens cifrados
    Desconectada --> Desconectada: state invalido o permiso cancelado
    SinCalendario --> Conectada: Guardar calendario
    Conectada --> ConError: token no se refresca o no se descifra
    ConError --> SinCalendario: Volver a conectar
    Conectada --> Desconectada: Desconectar
    ConError --> Desconectada: Desconectar
```
