# 4 · Actividad

Diagramas de actividad UML dibujados como `flowchart`. Los rombos son decisiones, los óvalos inicio y fin, y los `subgraph` son carriles por actor o capa.

## A-01 · Recorrido completo: de la solicitud al cobro

```mermaid
flowchart LR
  subgraph visitante ["Visitante"]
    inicio(["Entra a la landing"])
    llena["Llena el formulario"]
  end
  subgraph recepcion ["Recepción o doctora"]
    cola["Ve el prospecto en Hoy"]
    contacta["Contacta por WhatsApp o llamada"]
    interes{"Le interesa?"}
    seguimiento["Programa próxima acción"]
    agenda["Agenda valoración"]
    asiste{"Asistió?"}
    reagenda["Marca no asistió y reagenda"]
    descarta["Descarta"]
  end
  subgraph doctora ["Doctora"]
    acepta{"Aceptó tratamiento?"}
    convierte["Convierte en paciente"]
    plan["Crea plan con mensualidades"]
    control["Agenda controles"]
    cobra["Recuerda y registra pagos"]
    fin(["Tratamiento en curso"])
  end

  inicio --> llena --> cola --> contacta --> interes
  interes -->|"Sí"| agenda
  interes -->|"Lo piensa"| seguimiento
  seguimiento -.->|"llega la fecha"| contacta
  interes -->|"No"| descarta
  agenda --> asiste
  asiste -->|"No"| reagenda
  reagenda -.-> agenda
  asiste -->|"Sí"| acepta
  acepta -->|"Sí"| convierte --> plan --> control --> cobra --> fin
  acepta -->|"Lo piensa"| seguimiento

  style visitante fill:#FFECBD,stroke:#FFC943
  style recepcion fill:#C2E5FF,stroke:#3DADFF
  style doctora fill:#DCCCFF,stroke:#874FFF
```

## A-02 · Envío del formulario (`POST /api/contact`)

```mermaid
flowchart TD
  recibe(["POST /api/contact"])
  limite{"Más de 5 envíos de esta IP en 10 min?"}
  r429[/"429 Demasiadas solicitudes"/]
  json{"JSON válido?"}
  r400[/"400 Solicitud mal formada"/]
  honeypot{"Campo empresa lleno?"}
  r200falso[/"200 ok sin guardar"/]
  valida["coerce y validate"]
  errores{"Hay errores?"}
  r422[/"422 con errores por campo"/]
  inserta["Insert en solicitudes con AVISO_VERSION, timeout 5 s"]
  ok{"Insert ok?"}
  r200[/"200 ok"/]
  r502[/"502 Escríbenos por WhatsApp"/]

  recibe --> limite
  limite -->|"Sí"| r429
  limite -->|"No"| json
  json -->|"No"| r400
  json -->|"Sí"| honeypot
  honeypot -->|"Sí, es bot"| r200falso
  honeypot -->|"No"| valida --> errores
  errores -->|"Sí"| r422
  errores -->|"No"| inserta --> ok
  ok -->|"Sí"| r200
  ok -->|"No o timeout"| r502

  style r429 fill:#FFCDC2,stroke:#FF7556
  style r400 fill:#FFCDC2,stroke:#FF7556
  style r422 fill:#FFE0C2,stroke:#FF9E42
  style r502 fill:#FFCDC2,stroke:#FF7556
  style r200 fill:#CDF4D3,stroke:#66D575
```

## A-03 · Barreras del middleware en `/admin/*`

```mermaid
flowchart TD
  peticion(["Petición"])
  prerender{"Ruta prerenderizada?"}
  esAdmin{"Empieza con /admin?"}
  pasa(["next()"])
  getUser["supabase.auth.getUser()"]
  falla{"Falló la red o Supabase?"}
  sinUsuario["Se trata como sin sesión"]
  allow{"Correo en ADMIN_EMAILS?"}
  rol["obtenerRol en admins"]
  autorizada{"Allowlist y rol?"}
  publica{"Ruta pública: login, entrar o salir?"}
  loginConSesion{"Es /admin/login con sesión autorizada?"}
  aInicio[/"302 a /admin"/]
  signOut["signOut si había usuario"]
  aLogin[/"302 a /admin/login"/]
  puede{"puedeVer rol y ruta?"}
  metodo{"Es GET?"}
  denegado[/"303 a /admin?acceso=denegado"/]
  prohibido[/"403 Sin acceso"/]
  pagina["Página y cabeceras no-store y noindex"]

  peticion --> prerender
  prerender -->|"Sí"| pasa
  prerender -->|"No"| esAdmin
  esAdmin -->|"No"| pasa
  esAdmin -->|"Sí"| getUser --> falla
  falla -->|"Sí"| sinUsuario --> allow
  falla -->|"No"| allow
  allow -->|"Sí"| rol --> autorizada
  allow -->|"No"| autorizada
  autorizada --> publica
  publica -->|"Sí"| loginConSesion
  loginConSesion -->|"Sí"| aInicio
  loginConSesion -->|"No"| pagina
  publica -->|"No, sin autorizar"| signOut --> aLogin
  publica -->|"No, autorizada"| puede
  puede -->|"Sí"| pagina
  puede -->|"No"| metodo
  metodo -->|"Sí"| denegado
  metodo -->|"No"| prohibido

  style aLogin fill:#FFE0C2,stroke:#FF9E42
  style prohibido fill:#FFCDC2,stroke:#FF7556
  style denegado fill:#FFE0C2,stroke:#FF9E42
  style pagina fill:#CDF4D3,stroke:#66D575
```

## A-04 · Cola «Hoy» de Inicio

```mermaid
flowchart TD
  carga(["Abrir Inicio"])
  paralelo["En paralelo: prospectos nuevos, seguimientos vencidos u hoy (tope 6), citas del día, métricas"]
  dedupe["Quitar de Sin contestar a quien ya tiene seguimiento"]
  tope["Recortar Sin contestar a 6"]
  citas["Citas de hoy sin canceladas"]
  confirmar["Por confirmar: programadas que aún no empiezan y tienen teléfono"]
  esDoctora{"Rol doctora?"}
  cobros["porCobrar (tope 6), nombres, teléfonos y último recordatorio"]
  vencidas["Cuotas vencidas"]
  suma["Por atender = sin contestar + seguimientos + por confirmar + vencidas"]
  hayAlgo{"Por atender es 0?"}
  alDia(["Mostrar Al día"])
  bloques(["Mostrar bloques con una acción cada uno"])

  carga --> paralelo --> dedupe --> tope --> citas --> confirmar --> esDoctora
  esDoctora -->|"Sí"| cobros --> vencidas --> suma
  esDoctora -->|"No"| suma
  suma --> hayAlgo
  hayAlgo -->|"Sí"| alDia
  hayAlgo -->|"No"| bloques

  style tope fill:#FFECBD,stroke:#FFC943
  style cobros fill:#FFECBD,stroke:#FFC943
```

Los dos pasos en amarillo recortan a 6 **antes** de contar, por eso el total puede quedarse corto (H-07).

## A-05 · Agendar una cita

```mermaid
flowchart TD
  abre(["Nueva cita"])
  origen{"Viene de prospecto o paciente?"}
  precarga["Precargar nombre y teléfono"]
  vacio["Formulario vacío"]
  llena["Fecha y hora, tipo, duración y nota"]
  guarda["Guardar cita"]
  valida{"Nombre, fecha, duración de 5 a 480 y tipo válidos?"}
  error["Mostrar error conservando lo tecleado"]
  activa["sincronizacionActiva()"]
  inserta["Insert cita programada, google_sync pendiente o desactivada"]
  esProspecto{"Es de un prospecto?"}
  estado{"Estaba nueva o contactada?"}
  agendada["Estado a agendada"]
  accion["Acción cita_creada"]
  google{"Integración activa?"}
  sincroniza["sincronizar(cita)"]
  redirige(["303 a la agenda del día con la cita abierta"])

  abre --> origen
  origen -->|"Sí"| precarga --> llena
  origen -->|"No"| vacio --> llena
  llena --> guarda --> valida
  valida -->|"No"| error --> llena
  valida -->|"Sí"| activa --> inserta --> esProspecto
  esProspecto -->|"Sí"| estado
  estado -->|"Sí"| agendada --> accion
  estado -->|"No"| accion
  esProspecto -->|"No"| google
  accion --> google
  google -->|"Sí"| sincroniza --> redirige
  google -->|"No"| redirige
```

No hay comprobación de empalmes ni de horario (H-10).

## A-06 · Asistencia y conversión

```mermaid
flowchart TD
  abre(["Abrir detalle de la cita"])
  marca["Asistencia: elegir estado y Guardar"]
  cual{"Nuevo estado"}
  cancelada["Cancelada: acción cita_cancelada y borrar evento en Google"]
  noAsistio["No asistió: queda en la agenda"]
  atendida["Atendida"]
  ofrecer{"Valoración de prospecto, rol doctora y sin ficha?"}
  pregunta["Mostrar ¿Aceptó el tratamiento?"]
  decide{"Aceptó?"}
  seguimiento["Dejar seguimiento en la ficha del prospecto"]
  convertir["Convertir en paciente: revisar datos"]
  crea["Insert paciente con solicitud_id UNIQUE"]
  unico{"Ya existía?"}
  yaEs[/"Esta solicitud ya se convirtió"/]
  termina["Solicitud a terminado"]
  cierra["Limpiar próxima acción y acción conversion"]
  ficha(["Ficha del paciente"])
  fin(["Fin"])

  abre --> marca --> cual
  cual -->|"cancelada"| cancelada --> fin
  cual -->|"no_asistio"| noAsistio --> fin
  cual -->|"atendida"| atendida --> ofrecer
  ofrecer -->|"No"| fin
  ofrecer -->|"Sí"| pregunta --> decide
  decide -->|"Lo piensa"| seguimiento --> fin
  decide -->|"Sí"| convertir --> crea --> unico
  unico -->|"Sí"| yaEs
  unico -->|"No"| termina --> cierra --> ficha

  style yaEs fill:#FFCDC2,stroke:#FF7556
  style ficha fill:#CDF4D3,stroke:#66D575
```

Crear el paciente y pasar la solicitud a *terminado* son dos escrituras separadas (H-15).

## A-07 · Registrar un pago

```mermaid
flowchart TD
  abre(["Registrar pago"])
  desde{"Viene con cuota o paciente en la URL?"}
  elegir["Elegir paciente (recarga la página)"]
  tarjetas["Mostrar hasta 6 mensualidades no pagadas: vencidas, parciales, pendientes"]
  aplica{"A qué corresponde?"}
  cuota["Mensualidad concreta: monto y concepto precargados"]
  abono["Abono al plan"]
  enganche["Enganche"]
  cargo["Cargo suelto"]
  datos["Monto, método, fecha, concepto y nota"]
  resumen["Lateral: saldo después del pago"]
  guarda["Guardar pago"]
  valida{"Paciente, monto mayor que 0, tipo y método válidos?"}
  error["Error en pantalla (se pierde lo tecleado)"]
  inserta["Insert en pagos"]
  vistas["Las vistas recalculan estado de cuota y saldo"]
  ficha(["303 a la ficha del paciente con aviso de pago"])

  abre --> desde
  desde -->|"No"| elegir --> tarjetas
  desde -->|"Sí"| tarjetas
  tarjetas --> aplica
  aplica --> cuota --> datos
  aplica --> abono --> datos
  aplica --> enganche --> datos
  aplica --> cargo --> datos
  datos --> resumen --> guarda --> valida
  valida -->|"No"| error --> datos
  valida -->|"Sí"| inserta --> vistas --> ficha

  style error fill:#FFCDC2,stroke:#FF7556
  style cargo fill:#FFECBD,stroke:#FFC943
```

El cargo suelto resta del saldo del plan (H-18) y un error de validación pierde lo tecleado (H-09).

## A-08 · Cobranza de una cuota vencida

```mermaid
flowchart LR
  inicio(["Cuota pasa su vence_el"])
  aparece["Aparece en Inicio y en Pagos como vencida"]
  recordada{"Ya se recordó hoy?"}
  whatsapp["Tocar WhatsApp o Cobrar: mensaje con nombre, número, monto y fecha"]
  envia["La doctora envía desde su teléfono"]
  marca["Marcar enviado: insert en recordatorios_cobro"]
  espera["Queda Recordada hace N días"]
  paga{"Pagó?"}
  registra["Registrar pago con esa cuota"]
  pagada(["Cuota pagada, sale de la cola"])

  inicio --> aparece --> recordada
  recordada -->|"No"| whatsapp --> envia --> marca --> espera --> paga
  recordada -->|"Sí"| espera
  paga -->|"Sí"| registra --> pagada
  paga -->|"No, pasan días"| recordada
```

## A-09 · Sincronización de una cita con Google

```mermaid
flowchart TD
  entra(["sincronizar(cita)"])
  plan["planDeSincronizacion"]
  sesion["sesionValida: calendario y access token"]
  lanza{"Lanzó excepción?"}
  errorA["google_sync = error con mensaje"]
  haySesion{"Hay sesión?"}
  desactivada["google_sync = desactivada"]
  cual{"Plan"}
  nada["Cancelada sin evento: sincronizada"]
  crear["crearEvento y guardar google_evento_id"]
  actualizar["actualizarEvento"]
  cancelar["cancelarEvento y vaciar google_evento_id"]
  ok{"Google respondió bien?"}
  sincronizada(["google_sync = sincronizada"])
  reauth{"Pide volver a autenticar?"}
  ultimoError["Guardar ultimo_error en la integración"]
  errorB(["google_sync = error, se reintenta a mano"])

  entra --> plan --> sesion --> lanza
  lanza -->|"Sí"| errorA
  lanza -->|"No"| haySesion
  haySesion -->|"No"| desactivada
  haySesion -->|"Sí"| cual
  cual -->|"nada"| nada
  cual -->|"crear"| crear --> ok
  cual -->|"actualizar"| actualizar --> ok
  cual -->|"cancelar"| cancelar --> ok
  ok -->|"Sí"| sincronizada
  ok -->|"No"| reauth
  reauth -->|"Sí"| ultimoError --> errorB
  reauth -->|"No"| errorB

  style errorA fill:#FFCDC2,stroke:#FF7556
  style errorB fill:#FFCDC2,stroke:#FF7556
  style sincronizada fill:#CDF4D3,stroke:#66D575
```

## A-10 · Service worker del panel

```mermaid
flowchart TD
  fetch(["Evento fetch"])
  get{"Es GET del mismo origen?"}
  ignora(["No intercepta"])
  navega{"Es navegación?"}
  red["Siempre a la red"]
  redOk{"Respondió?"}
  html(["HTML del panel, nunca se guarda"])
  offline(["panel-sin-conexion.html del caché de respaldo"])
  ruta{"Qué ruta es"}
  astro["/_astro/*: primero caché"]
  enCache{"Está en caché?"}
  deCache(["Respuesta del caché"])
  descarga["Descarga y guarda si es 200 básica sin redirect"]
  iconos["Iconos y manifest: responde caché y revalida"]
  otra(["Otra ruta: no intercepta"])

  fetch --> get
  get -->|"No"| ignora
  get -->|"Sí"| navega
  navega -->|"Sí"| red --> redOk
  redOk -->|"Sí"| html
  redOk -->|"No"| offline
  navega -->|"No"| ruta
  ruta -->|"_astro"| astro --> enCache
  enCache -->|"Sí"| deCache
  enCache -->|"No"| descarga
  ruta -->|"iconos"| iconos
  ruta -->|"otra"| otra

  style html fill:#CDF4D3,stroke:#66D575
  style offline fill:#FFECBD,stroke:#FFC943
```

## A-11 · Cron keepalive

```mermaid
flowchart LR
  cron(["Vercel Cron 09:17 UTC diario"])
  get["GET /api/cron/keepalive con Bearer"]
  secreto{"CRON_SECRET existe y coincide en tiempo constante?"}
  r401[/"401 No autorizado"/]
  consultas["Contar solicitudes, leer una y contar nuevas"]
  fallo{"Alguna falló?"}
  r500[/"500 ok false"/]
  r200[/"200 ok, total y nuevas"/]

  cron --> get --> secreto
  secreto -->|"No"| r401
  secreto -->|"Sí"| consultas --> fallo
  fallo -->|"Sí"| r500
  fallo -->|"No"| r200

  style r401 fill:#FFCDC2,stroke:#FF7556
  style r500 fill:#FFCDC2,stroke:#FF7556
  style r200 fill:#CDF4D3,stroke:#66D575
```

## A-12 · Manejo de errores y degradación

```mermaid
flowchart TD
  falla(["Algo falla"])
  donde{"Dónde"}
  mwFalla["Middleware: getUser o rol lanzan"]
  mwEfecto["Se trata como sin sesión: manda al login, no da 500"]
  lectura["Página: la consulta de datos lanza"]
  lecturaEfecto["Aviso No pudimos cargar y página navegable"]
  escritura["Formulario: la escritura lanza"]
  conAviso{"La página redirige con error?"}
  avisoError["Ficha, agenda, planes y pagos nuevos: aviso No se pudo guardar"]
  silencio["Inicio, lista de prospectos y Pagos: redirige sin aviso (H-08)"]
  historial["registrar() del historial: solo consola (H-08)"]
  googleFalla["Google falla"]
  googleEfecto["La cita queda guardada con google_sync = error y botón Reintentar"]
  conversion["Conversión: falla el paso a terminado"]
  conversionEfecto["Paciente creado y solicitud sin terminar (H-15)"]

  falla --> donde
  donde --> mwFalla --> mwEfecto
  donde --> lectura --> lecturaEfecto
  donde --> escritura --> conAviso
  conAviso -->|"Sí"| avisoError
  conAviso -->|"No"| silencio
  donde --> historial
  donde --> googleFalla --> googleEfecto
  donde --> conversion --> conversionEfecto

  style silencio fill:#FFCDC2,stroke:#FF7556
  style historial fill:#FFCDC2,stroke:#FF7556
  style conversionEfecto fill:#FFE0C2,stroke:#FF9E42
  style mwEfecto fill:#CDF4D3,stroke:#66D575
  style googleEfecto fill:#CDF4D3,stroke:#66D575
```
