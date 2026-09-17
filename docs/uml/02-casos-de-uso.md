# 2 · Casos de uso

Mermaid no tiene diagrama de casos de uso, así que aquí se dibujan con `flowchart`, con esta equivalencia con la notación UML:

| UML | Aquí |
|---|---|
| Actor | Rectángulo fuera del sistema |
| Caso de uso | Óvalo (`([…])`) dentro del sistema |
| Límite del sistema | `subgraph` |
| Asociación | Línea continua |
| «include» / «extend» | Flecha punteada con la etiqueta |

En el tablero de FigJam se dibujan con figuras de actor y elipses.

## Actores

| Actor | Tipo | Quién es |
|---|---|---|
| Visitante | Humano, externo | Persona que entra a la landing (posible paciente) |
| Doctora | Humano, rol `doctora` | Acceso total al panel |
| Recepcionista | Humano, rol `recepcionista` | Prospectos, seguimiento y agenda; sin pacientes ni dinero |
| Admin técnico | Humano, fuera del panel | Da de alta cuentas con `pnpm admin` y configura Vercel |
| Google Calendar | Sistema externo | Recibe la copia de las citas |
| WhatsApp | Sistema externo | Abre la conversación con el mensaje ya escrito (`wa.me`) |
| Vercel Cron | Temporizador | Llama al keepalive todos los días |

## CU-00 · Vista general

```mermaid
flowchart LR
  visitante["Visitante"]
  doctora["Doctora"]
  recepcion["Recepcionista"]
  adminTec["Admin técnico"]
  google["Google Calendar"]
  whatsapp["WhatsApp"]
  cron["Vercel Cron"]

  subgraph sistema ["Sistema CBPG"]
    pSitio(["Sitio público"])
    pAcceso(["Acceso al panel"])
    pCaptacion(["Captación de prospectos"])
    pAgenda(["Agenda"])
    pPacientes(["Pacientes y cobranza"])
    pOperacion(["Integración y operación"])
  end

  visitante --- pSitio
  doctora --- pAcceso
  recepcion --- pAcceso
  doctora --- pCaptacion
  recepcion --- pCaptacion
  doctora --- pAgenda
  recepcion --- pAgenda
  doctora --- pPacientes
  doctora --- pOperacion
  adminTec --- pOperacion
  cron --- pOperacion
  pCaptacion -.-> whatsapp
  pPacientes -.-> whatsapp
  pAgenda -.-> google

  style sistema fill:#F8F5FF,stroke:#874FFF
```

## CU-01 · Sitio público

```mermaid
flowchart LR
  visitante["Visitante"]
  whatsapp["WhatsApp"]

  subgraph sitio ["Sitio público (landing)"]
    verInfo(["Ver tratamientos, resultados y preguntas"])
    solicitar(["Solicitar valoración"])
    aceptarAviso(["Aceptar aviso de privacidad"])
    corregir(["Corregir datos del formulario"])
    contactarDirecto(["Contactar por WhatsApp o teléfono"])
    leerLegal(["Leer aviso de privacidad y términos"])
  end

  visitante --- verInfo
  visitante --- solicitar
  visitante --- contactarDirecto
  visitante --- leerLegal
  solicitar -.->|"include"| aceptarAviso
  corregir -.->|"extend (datos inválidos o 429)"| solicitar
  contactarDirecto -.- whatsapp

  style sitio fill:#F8F5FF,stroke:#874FFF
```

## CU-02 · Acceso al panel

```mermaid
flowchart LR
  doctora["Doctora"]
  recepcion["Recepcionista"]

  subgraph acceso ["Panel · acceso"]
    entrar(["Iniciar sesión"])
    validar(["Validar allowlist y rol"])
    salir(["Cerrar sesión"])
    instalar(["Instalar como app"])
    sinConexion(["Ver aviso sin conexión"])
    denegado(["Ver aviso de sección solo de la doctora"])
  end

  doctora --- entrar
  recepcion --- entrar
  doctora --- salir
  recepcion --- salir
  doctora --- instalar
  recepcion --- instalar
  entrar -.->|"include"| validar
  denegado -.->|"extend (recepción en ruta de doctora)"| validar
  sinConexion -.->|"extend (sin red)"| instalar

  style acceso fill:#F8F5FF,stroke:#874FFF
```

## CU-03 · Captación de prospectos

```mermaid
flowchart LR
  doctora["Doctora"]
  recepcion["Recepcionista"]
  whatsapp["WhatsApp"]

  subgraph captacion ["Panel · captación"]
    revisarHoy(["Revisar la cola de Hoy"])
    listar(["Buscar y filtrar prospectos"])
    contactar(["Contactar por WhatsApp"])
    marcarContactada(["Marcar como contactada al volver"])
    llamar(["Llamar y anotar llamada"])
    cambiarEstado(["Cambiar situación"])
    programar(["Programar próxima acción"])
    cerrar(["Marcar seguimiento como hecho"])
    notas(["Escribir notas y origen"])
    convertir(["Convertir en paciente"])
    crearFicha(["Crear ficha de paciente"])
    verMetricas(["Ver métricas de captación"])
  end

  doctora --- revisarHoy
  recepcion --- revisarHoy
  doctora --- listar
  recepcion --- listar
  recepcion --- contactar
  doctora --- contactar
  recepcion --- llamar
  recepcion --- cambiarEstado
  recepcion --- programar
  recepcion --- cerrar
  recepcion --- notas
  doctora --- convertir
  doctora --- verMetricas
  recepcion --- verMetricas
  contactar -.- whatsapp
  marcarContactada -.->|"extend (era nueva)"| contactar
  convertir -.->|"include"| crearFicha
  cerrar -.->|"extend (desde Hoy o la ficha)"| programar

  style captacion fill:#F8F5FF,stroke:#874FFF
```

## CU-04 · Agenda

```mermaid
flowchart LR
  doctora["Doctora"]
  recepcion["Recepcionista"]
  google["Google Calendar"]
  whatsapp["WhatsApp"]

  subgraph agenda ["Panel · agenda"]
    verAgenda(["Ver agenda por día o semana"])
    agendar(["Agendar cita"])
    desdeProspecto(["Agendar desde un prospecto"])
    desdePaciente(["Agendar desde un paciente"])
    reprogramar(["Reprogramar o editar"])
    confirmar(["Confirmar por WhatsApp"])
    asistencia(["Registrar asistencia"])
    cancelar(["Cancelar cita"])
    ofrecer(["Ofrecer conversión"])
    sincronizar(["Sincronizar con Google"])
    reintentar(["Reintentar sincronización"])
  end

  doctora --- verAgenda
  recepcion --- verAgenda
  recepcion --- agendar
  doctora --- agendar
  recepcion --- reprogramar
  recepcion --- confirmar
  recepcion --- asistencia
  recepcion --- cancelar
  recepcion --- reintentar
  doctora --- reintentar
  desdeProspecto -.->|"extend"| agendar
  desdePaciente -.->|"extend (solo doctora)"| agendar
  agendar -.->|"include"| sincronizar
  reprogramar -.->|"include"| sincronizar
  cancelar -.->|"include"| sincronizar
  ofrecer -.->|"extend (valoración atendida)"| asistencia
  reintentar -.->|"include"| sincronizar
  sincronizar -.- google
  confirmar -.- whatsapp

  style agenda fill:#F8F5FF,stroke:#874FFF
```

## CU-05 · Pacientes y cobranza (solo doctora)

```mermaid
flowchart LR
  doctora["Doctora"]
  whatsapp["WhatsApp"]

  subgraph pacientes ["Panel · pacientes y pagos"]
    altaDirecta(["Dar de alta paciente directo"])
    editar(["Editar datos y notas"])
    plan(["Crear o editar plan"])
    generarCuotas(["Generar mensualidades"])
    porCobrar(["Revisar por cobrar"])
    recordar(["Enviar recordatorio de cobro"])
    marcarEnviado(["Marcar recordatorio enviado"])
    registrarPago(["Registrar pago"])
    aplicarCuota(["Aplicar a una mensualidad"])
    quitarPago(["Quitar pago"])
    verDinero(["Ver cobrado y vencido"])
  end

  doctora --- altaDirecta
  doctora --- editar
  doctora --- plan
  doctora --- porCobrar
  doctora --- recordar
  doctora --- registrarPago
  doctora --- quitarPago
  doctora --- verDinero
  plan -.->|"include"| generarCuotas
  recordar -.->|"include"| marcarEnviado
  aplicarCuota -.->|"extend (hay cuota pendiente)"| registrarPago
  recordar -.- whatsapp

  style pacientes fill:#F8F5FF,stroke:#874FFF
```

## CU-06 · Integración y operación

```mermaid
flowchart LR
  doctora["Doctora"]
  adminTec["Admin técnico"]
  cron["Vercel Cron"]
  google["Google Calendar"]

  subgraph operacion ["Integración y operación"]
    conectar(["Conectar Google Calendar"])
    oauth(["Autorizar con OAuth"])
    elegir(["Elegir calendario destino"])
    desconectar(["Desconectar"])
    keepalive(["Mantener activo Supabase"])
    altaCuenta(["Dar de alta o baja una cuenta"])
    configurar(["Configurar variables en Vercel"])
  end

  doctora --- conectar
  doctora --- elegir
  doctora --- desconectar
  cron --- keepalive
  adminTec --- altaCuenta
  adminTec --- configurar
  conectar -.->|"include"| oauth
  oauth -.- google
  altaCuenta -.->|"include"| configurar

  style operacion fill:#F8F5FF,stroke:#874FFF
```

## Especificación breve de los casos principales

| Caso | Precondición | Flujo principal | Postcondición | Alternos |
|---|---|---|---|---|
| Solicitar valoración | Formulario hidratado | Llena datos → acepta aviso → envía → `POST /api/contact` | Fila en `solicitudes` con estado `nueva` | 422 (datos), 429 (límite), 502 (base), honeypot (200 sin guardar) |
| Iniciar sesión | Cuenta en `ADMIN_EMAILS` y en `admins` | Correo y contraseña → Supabase Auth → cookies → `/admin` | Sesión con rol | Credenciales o correo no permitido: mismo mensaje |
| Contactar por WhatsApp | Prospecto con teléfono | Toca WhatsApp → vuelve → «Marcar como contactada» | Estado `contactada` y acción `whatsapp` | «Ahora no»: sin cambios |
| Agendar cita | Rol con agenda | Quién → cuándo (fecha, tipo, duración) → Guardar | Cita `programada`; si viene de prospecto: `agendada` y acción `cita_creada` | Datos inválidos: se conserva lo tecleado; Google falla: `error` |
| Convertir en paciente | Doctora; prospecto sin ficha | Revisar datos → Crear paciente | Ficha creada; solicitud `terminado`; seguimiento cerrado; acción `conversion` | Ya convertida: redirige a la ficha |
| Registrar pago | Doctora; paciente existente | Paciente → a qué aplica → monto → método y fecha → Guardar | Fila en `pagos`; saldo y estado de cuota recalculados por las vistas | Monto inválido o sin paciente: error en pantalla |
| Enviar recordatorio | Cuota vencida o parcial | WhatsApp con mensaje de cobro → Marcar enviado | Fila en `recordatorios_cobro` | — |
| Conectar Google | Doctora; credenciales en el servidor | Conectar → consentimiento → callback → elegir calendario | Tokens cifrados y `calendario_id` guardados | `state` inválido, cancelado o fallo de intercambio |
