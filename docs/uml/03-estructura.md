# 3 · Estructura

## E-01 · Diagrama de componentes

Qué piezas se despliegan y cómo se hablan.

```mermaid
flowchart LR
  subgraph client ["Clientes"]
    navegador["Navegador (landing)"]
    pwa["PWA del panel en el teléfono"]
  end
  subgraph gateway ["Vercel Edge"]
    cdn["CDN estático y middleware"]
  end
  subgraph service ["Funciones Astro SSR"]
    contacto["API contact"]
    panel["Páginas /admin"]
    cron["Cron keepalive"]
  end
  subgraph datastore ["Supabase"]
    auth["Supabase Auth"]
    postgres["Postgres con RLS"]
  end
  subgraph external ["Servicios externos"]
    googleApi["Google OAuth y Calendar"]
    wa["WhatsApp wa.me"]
  end

  navegador -->|"HTTPS"| cdn
  pwa -->|"HTTPS"| cdn
  cdn -->|"POST /api/contact"| contacto
  cdn -->|"/admin/*"| panel
  cdn -->|"Vercel Cron"| cron
  contacto -->|"Inserta solicitud"| postgres
  panel -->|"Valida sesión"| auth
  panel -->|"Lee y escribe"| postgres
  cron -->|"Consulta diaria"| postgres
  panel -.->|"Google: eventos"| googleApi
  panel -.->|"WhatsApp: enlaces"| wa
```

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| CDN y middleware | Vercel + `src/middleware.ts` | Sirve la landing prerenderizada; en `/admin` valida sesión, allowlist y rol; pone `no-store` y `noindex` |
| API contact | `src/pages/api/contact.ts` | Recibe el formulario, aplica límite y validación, inserta con la clave de servicio |
| Páginas /admin | Astro SSR (`prerender = false`) | Pantallas del panel; escrituras con formularios POST → 303 |
| Cron keepalive | `src/pages/api/cron/keepalive.ts` | Consulta diaria para que el proyecto free no se pause |
| Supabase Auth | Supabase | Correo y contraseña; cookies de sesión |
| Postgres con RLS | Supabase | Tablas, vistas, RPC y políticas por rol |
| Google OAuth y Calendar | Google Cloud | Autorización de la doctora y espejo de citas |
| WhatsApp | `wa.me` | Abre la conversación con el texto preparado; no hay API |

## E-02 · Diagrama de despliegue

```mermaid
flowchart TB
  subgraph dispositivo ["Dispositivo: teléfono o computadora"]
    browser["Navegador"]
    sw["Service worker panel-sw.js"]
    cacheLocal[("Cache Storage: activos e iconos")]
  end

  subgraph vercel ["Vercel"]
    edge["CDN: HTML prerenderizado y /_astro"]
    fn["Funciones Node (Fluid Compute)"]
    vcron["Vercel Cron 17 9 * * *"]
    envs[/"Variables: SUPABASE_*, ADMIN_EMAILS, CRON_SECRET, GOOGLE_*"/]
  end

  subgraph supabase ["Supabase (wffqduqgnknopjrwyjpe, plan free)"]
    sauth["Auth"]
    sdb[("Postgres: tablas, vistas, RPC, RLS")]
  end

  subgraph gcloud ["Google Cloud"]
    goauth["OAuth 2.0"]
    gcal["Calendar API v3"]
  end

  browser -->|"HTTPS"| edge
  browser -->|"HTTPS"| fn
  sw --- cacheLocal
  browser --- sw
  vcron -->|"GET Bearer CRON_SECRET"| fn
  fn --- envs
  fn -->|"HTTPS supabase-js"| sauth
  fn -->|"HTTPS PostgREST"| sdb
  fn -->|"HTTPS"| goauth
  fn -->|"HTTPS"| gcal

  style dispositivo fill:#C2E5FF,stroke:#3DADFF
  style vercel fill:#D9D9D9,stroke:#B3B3B3
  style supabase fill:#CDF4D3,stroke:#66D575
  style gcloud fill:#FFECBD,stroke:#FFC943
```

## E-03 · Diagrama de paquetes

Dependencias reales entre carpetas (imports), de la interfaz hacia los datos.

```mermaid
flowchart LR
  subgraph ui ["Interfaz"]
    pages["pages: landing, /api, /admin"]
    layouts["layouts"]
    components["components y components/admin"]
  end
  subgraph dominio ["Dominio (src/lib)"]
    acceso["admin, roles, panel"]
    captacion["solicitudes, seguimiento, contacto-directo"]
    agendaPkg["citas, horario"]
    cobro["pacientes, pagos, cobranza, metricas"]
    utilidades["tiempo, formato, validate"]
  end
  subgraph integraciones ["Integraciones"]
    googlePkg["lib/google: almacen, calendario, cripto, plan, sincronizar"]
    supabasePkg["lib/supabase: servidor, servicio, tipos"]
  end
  config["config/site"]
  mw["middleware"]

  pages --> layouts
  pages --> components
  pages --> acceso
  pages --> captacion
  pages --> agendaPkg
  pages --> cobro
  pages --> googlePkg
  mw --> acceso
  mw --> supabasePkg
  captacion --> utilidades
  agendaPkg --> utilidades
  cobro --> utilidades
  captacion --> config
  cobro --> config
  googlePkg --> supabasePkg
  googlePkg --> utilidades
  acceso --> supabasePkg
  captacion --> supabasePkg
  agendaPkg --> supabasePkg
  cobro --> supabasePkg

  style ui fill:#C2E5FF,stroke:#3DADFF
  style dominio fill:#DCCCFF,stroke:#874FFF
  style integraciones fill:#CDF4D3,stroke:#66D575
```

## E-04 · Diagrama de clases del dominio

Las tablas como clases, con sus operaciones del dominio (funciones de `src/lib` que las modifican).

```mermaid
classDiagram
  direction LR
  class Solicitud {
    +uuid id
    +string nombre
    +string telefono
    +string tratamiento
    +string mensaje
    +EstadoSolicitud estado
    +Origen origen
    +timestamptz consentimiento_en
    +string aviso_version
    +timestamptz proxima_accion_en
    +TipoAccionPendiente proxima_accion_tipo
    +string proxima_accion_nota
    +string notas
    +cambiarEstado(estado)
    +guardarProximaAccion(en, tipo, nota)
    +limpiarProximaAccion()
    +guardarOrigen(origen)
    +guardarNotas(texto)
  }
  class AccionProspecto {
    +uuid id
    +TipoAccion tipo
    +string nota
    +uuid actor
    +timestamptz creado_en
    +registrar(tipo, nota, citaId)
  }
  class Cita {
    +uuid id
    +string nombre_contacto
    +string telefono_contacto
    +timestamptz inicia_en
    +int duracion_min
    +TipoCita tipo
    +EstadoCita estado
    +string nota
    +uuid responsable
    +string google_evento_id
    +GoogleSync google_sync
    +crear(datos, sincronizable)
    +actualizar(cambios, sincronizable)
    +cambiarEstado(estado, sincronizable)
  }
  class Paciente {
    +uuid id
    +string nombre
    +string telefono
    +string tratamiento
    +date inicio
    +EstadoPaciente estado
    +string notas
    +crear(datos)
    +crearDesdeSolicitud(solicitudId, datos)
    +actualizar(datos)
  }
  class PlanTratamiento {
    +uuid id
    +numeric costo_total
    +numeric enganche
    +int num_cuotas
    +int dia_corte
    +date inicio
    +guardarPlan(datos)
  }
  class Cuota {
    +uuid id
    +int numero
    +numeric monto
    +date vence_el
    +EstadoCuota estado derivado
    +numeric restante derivado
  }
  class Pago {
    +uuid id
    +TipoPago tipo
    +string concepto
    +numeric monto
    +MetodoPago metodo
    +date pagado_el
    +string nota
    +registrar(datos)
    +borrar()
  }
  class RecordatorioCobro {
    +uuid id
    +TipoRecordatorio tipo
    +string nota
    +timestamptz creado_en
    +registrarRecordatorio(cuotaId, pacienteId)
  }
  class Admin {
    +uuid user_id
    +string email
    +Rol rol
    +obtenerRol(userId)
    +puedeVer(rol, ruta)
  }
  class IntegracionGoogle {
    +smallint id = 1
    +string cuenta
    +string refresh_token_cifrado
    +string access_token_cifrado
    +string calendario_id
    +string ultimo_error
    +guardarAutorizacion(tokens)
    +guardarCalendario(id)
    +desconectar()
  }

  Solicitud "1" *-- "0..*" AccionProspecto : historial
  Solicitud "1" o-- "0..*" Cita : valoraciones
  Solicitud "1" -- "0..1" Paciente : se convierte en
  Paciente "1" o-- "0..*" Cita : controles
  Cita "0..1" -- "0..*" AccionProspecto : cita_id
  Paciente "1" *-- "0..1" PlanTratamiento : plan
  PlanTratamiento "1" *-- "0..*" Cuota : genera
  Paciente "1" *-- "0..*" Pago : paga
  Cuota "0..1" o-- "0..*" Pago : se aplica a
  Cuota "1" *-- "0..*" RecordatorioCobro : recordatorios
  Admin "1" -- "0..*" Cita : responsable
  Admin "1" -- "0..*" AccionProspecto : actor
```

Enumeraciones:

| Enum | Valores |
|---|---|
| EstadoSolicitud | nueva, contactada, agendada, descartada, terminado |
| Origen | sitio, instagram, recomendacion, otro |
| TipoAccionPendiente | whatsapp, llamada, cita, otro |
| TipoAccion | whatsapp, llamada, cita_creada, cita_reprogramada, cita_cancelada, conversion, nota |
| TipoCita | valoracion, control |
| EstadoCita | programada, confirmada, atendida, cancelada, no_asistio |
| GoogleSync | pendiente, sincronizada, error, desactivada |
| EstadoPaciente | activo, retencion, alta, pausado |
| EstadoCuota (derivado) | pendiente, parcial, pagada, vencida |
| TipoPago | mensualidad, enganche, cargo_suelto |
| MetodoPago | efectivo, transferencia, tarjeta |
| TipoRecordatorio | whatsapp, llamada |
| Rol | doctora, recepcionista |

Composición (`*--`): la parte se borra con el todo (`ON DELETE CASCADE`). Agregación (`o--`): sobrevive (`ON DELETE SET NULL`). Eso explica H-17: al rehacer el plan, las cuotas se borran en cascada y los pagos, que son agregación, quedan sin cuota.

## E-05 · Módulos de servicio (`src/lib`)

Cada módulo como una clase estática: sus funciones exportadas y de quién depende.

```mermaid
classDiagram
  direction LR
  class middleware {
    <<module>>
    +onRequest(context, next)
  }
  class roles {
    <<module>>
    +esRol(valor)
    +obtenerRol(supabase, userId)
    +puedeVer(rol, ruta)
    +SOLO_DOCTORA
  }
  class admin {
    <<module>>
    +emailsPermitidos()
    +normalizarRuta(path)
    +RUTAS_PUBLICAS_ADMIN
  }
  class panel {
    <<module>>
    +SECCIONES_POR_ROL
    +contarNuevasParaNavegacion()
  }
  class solicitudes {
    <<module>>
    +listar(filtros)
    +obtener(id)
    +cambiarEstado(id, estado)
    +contarPorEstado()
    +contarNuevas()
    +guardarNotas(id, texto)
  }
  class seguimiento {
    <<module>>
    +registrar(solicitudId, tipo, extra)
    +historial(solicitudId)
    +guardarProximaAccion(id, accion)
    +limpiarProximaAccion(id)
    +vencidosOHoy(finDelDia, tope)
    +guardarOrigen(id, origen)
  }
  class citas {
    <<module>>
    +crear(datos, sincronizable)
    +actualizar(id, cambios, sincronizable)
    +cambiarEstado(id, estado, sincronizable)
    +listarEntre(desde, hasta)
    +porSolicitud(id)
    +porPaciente(id)
    +pendientesDeSincronizar()
  }
  class horario {
    <<module>>
    +colocar(citas, dia)
    +cierreDe(dia)
    +cerradoDesde(dia)
    +posicionAhora()
  }
  class pacientes {
    <<module>>
    +crear(datos)
    +crearDesdeSolicitud(id, datos)
    +actualizar(id, datos)
    +listar(filtros)
    +paraSelector()
    +porSolicitud(id)
  }
  class pagos {
    <<module>>
    +guardarPlan(pacienteId, datos)
    +registrar(datos)
    +borrar(id)
    +cuotasDe(pacienteId)
    +saldoDe(pacienteId)
    +porCobrar(limite, horizonte)
    +listarMovimientos(filtros)
  }
  class cobranza {
    <<module>>
    +mensajeCobro(datos)
    +aWhatsappCobro(telefono, datos)
    +registrarRecordatorio(datos)
    +ultimoPorCuota(ids)
  }
  class metricas {
    <<module>>
    +calcular(periodo, conDinero)
  }
  class contactoDirecto {
    <<module>>
    +aWhatsapp(telefono, nombre, tratamiento)
    +aWhatsappCita(telefono, nombre, cuando)
    +aTelefono(telefono)
  }
  class tiempo {
    <<module>>
    +deMexicoAIso(local)
    +partesEnMexico(fecha)
    +diaEnMexico(fecha)
    +limitesDelDia(dia)
  }
  class googleSincronizar {
    <<module>>
    +sincronizar(cita)
    +reintentar(citas)
  }
  class googleAlmacen {
    <<module>>
    +sincronizacionActiva()
    +sesionValida()
    +accessToken()
    +guardarAutorizacion(tokens)
    +desconectar()
  }
  class googleCalendario {
    <<module>>
    +urlDeAutorizacion()
    +intercambiarCodigo()
    +refrescarToken()
    +crearEvento()
    +actualizarEvento()
    +cancelarEvento()
  }
  class googlePlan {
    <<module>>
    +planDeSincronizacion(cita)
    +eventoDeCita(cita)
  }
  class googleCripto {
    <<module>>
    +cifrar(texto)
    +descifrar(guardado)
  }
  class supabaseClientes {
    <<module>>
    +crearClienteServidor(context)
    +crearClienteServicio()
  }

  middleware ..> admin
  middleware ..> roles
  middleware ..> supabaseClientes
  panel ..> solicitudes
  citas ..> tiempo
  horario ..> tiempo
  metricas ..> tiempo
  cobranza ..> contactoDirecto
  googleSincronizar ..> googlePlan
  googleSincronizar ..> googleAlmacen
  googleSincronizar ..> googleCalendario
  googleAlmacen ..> googleCripto
  googleAlmacen ..> googleCalendario
  googleAlmacen ..> supabaseClientes
  googlePlan ..> tiempo
```

## E-06 · Modelo entidad-relación

```mermaid
erDiagram
  SOLICITUDES ||--o{ ACCIONES_PROSPECTO : historial
  SOLICITUDES |o--o| PACIENTES : se_convierte_en
  SOLICITUDES |o..o{ CITAS : valoraciones
  PACIENTES |o..o{ CITAS : controles
  CITAS |o..o{ ACCIONES_PROSPECTO : cita_id
  PACIENTES ||--o| PLANES_TRATAMIENTO : plan
  PLANES_TRATAMIENTO ||--o{ CUOTAS : genera
  PACIENTES ||--o{ PAGOS : paga
  CUOTAS |o..o{ PAGOS : se_aplica
  CUOTAS ||--o{ RECORDATORIOS_COBRO : recordatorios
  PACIENTES ||--o{ RECORDATORIOS_COBRO : de

  SOLICITUDES {
    uuid id PK
    text nombre
    text telefono
    text estado "nueva contactada agendada descartada terminado"
    text origen
    timestamptz proxima_accion_en
    text aviso_version
  }
  ACCIONES_PROSPECTO {
    uuid id PK
    uuid solicitud_id FK
    uuid cita_id FK
    text tipo
    uuid actor
  }
  PACIENTES {
    uuid id PK
    uuid solicitud_id FK, UK
    text nombre
    text estado
    date inicio
  }
  CITAS {
    uuid id PK
    uuid solicitud_id FK
    uuid paciente_id FK
    timestamptz inicia_en
    int duracion_min
    text tipo
    text estado
    text google_sync
  }
  PLANES_TRATAMIENTO {
    uuid id PK
    uuid paciente_id FK
    numeric costo_total
    numeric enganche
    int num_cuotas
    int dia_corte
  }
  CUOTAS {
    uuid id PK
    uuid plan_id FK
    int numero
    numeric monto
    date vence_el
  }
  PAGOS {
    uuid id PK
    uuid paciente_id FK
    uuid cuota_id FK
    text tipo
    numeric monto
    text metodo
    date pagado_el
  }
  RECORDATORIOS_COBRO {
    uuid id PK
    uuid cuota_id FK
    uuid paciente_id FK
    text tipo
  }
  ADMINS {
    uuid user_id PK
    text email
    text rol
  }
  INTEGRACION_GOOGLE {
    smallint id PK
    text refresh_token_cifrado
    text calendario_id
  }
```

Vistas derivadas: `vista_cuotas` (estado y restante de cada cuota) y `vista_saldo_paciente` (pagado, saldo, cuotas y monto vencido). RPC: `crear_plan_con_cuotas`.

## E-07 · Contratos de API y acciones de formulario

Todas las escrituras del panel son formularios `POST` con `accion=…` que responden `303` a un `GET` (patrón PRG). Astro rechaza un `POST` sin cabecera `Origin` válida (`security.checkOrigin`).

| Método y ruta | Entrada | Validación | Respuestas | Efecto |
|---|---|---|---|---|
| `POST /api/contact` | JSON: nombre, telefono, tratamiento, mensaje, consentimiento, empresa (honeypot) | Límite 5 cada 10 min por IP; `validate()`: nombre ≤ 120, teléfono con 7 dígitos o más, tratamiento de la lista, mensaje ≤ 2000, consentimiento | `200 {ok}` · `400` JSON mal formado · `422 {errores}` · `429` · `502` | Inserta en `solicitudes` con `aviso_version` |
| `GET /api/cron/keepalive` | `Authorization: Bearer CRON_SECRET` | Comparación en tiempo constante | `200 {ok, total, nuevas}` · `401` · `500` | Solo lecturas |
| `POST /admin/auth/entrar` | email, password | Correo en `ADMIN_EMAILS` antes de llamar a Auth | `303 /admin` · `303 /admin/login?error=credenciales` | Cookies de sesión |
| `POST /admin/auth/salir` | — | — | `303 /admin/login?salir=1` | `signOut({scope: 'global'})` |
| `GET /admin/integracion/google/conectar` | — | Credenciales presentes | `303` a Google (cookie `state`, 10 min) · `303 ?error=sin-credenciales` | — |
| `GET /admin/integracion/google/callback` | code, state | `state` igual a la cookie | `303 ?conectado=1` · `303 ?error=estado`, `cancelado`, `sin-codigo` o `conexion` | Tokens cifrados en `integracion_google` |
| `POST /admin/integracion/google` | `accion=calendario` (calendario) · `desconectar` · `sincronizar` | id de calendario no vacío | `303 ?guardado=1` · `303 ?error=calendario` o `guardar` | Calendario, borrado de tokens o reintento |
| `GET /admin/agenda/ocupacion` | `dia=AAAA-MM-DD` | Formato de fecha | `200 {ocupado[]}` · `400` · `502` | Solo lectura (franja de nueva cita) |
| `POST /admin` (Inicio) | `accion=seguimiento-hecho` + id · o id + estado | Estado válido y distinto de `terminado` | `303` a la misma URL (**errores silenciosos**, H-08) | Cierra seguimiento o cambia estado (+ acción whatsapp) |
| `POST /admin/prospectos` | id, estado | Igual que arriba | `303` a la misma URL (silencioso, H-08) | Cambia estado |
| `POST /admin/prospectos/[id]` | `accion=estado` · `notas` · `origen` · `seguimiento` (cuando, tipo, nota) · `seguimiento-hecho` · `seguimiento-quitar` · `llamada` | Estado, origen, fecha y tipo válidos | `303 ?guardado=1` (con `&pendiente=1` si queda seguimiento) · `303 ?error=estado`, `origen`, `seguimiento` o `guardar` | Solicitud y `acciones_prospecto` |
| `POST /admin/prospectos/[id]/convertir` | nombre, telefono, tratamiento, inicio, estado, notas | Nombre y estado válidos; `UNIQUE solicitud_id` | `303 /admin/pacientes/[id]?creado=1` · `200` con error en pantalla | Paciente, solicitud `terminado`, acción `conversion` |
| `POST /admin/agenda` | `accion=estado` (id, estado) · `sincronizar` | Estado de cita válido | `303` misma vista `?guardado=1` · `?error=1` | Cita y, si se cancela, acción `cita_cancelada` |
| `POST /admin/agenda/nueva` | `?solicitud` o `?paciente`; nombre, telefono, inicia_en, tipo, duracion_min, nota | Nombre, fecha, duración de 5 a 480, tipo válido | `303 /admin/agenda?dia&cita&guardado=1` · `200` con error y datos conservados | Cita; prospecto `agendada`; acción `cita_creada`; Google |
| `POST /admin/agenda/[id]` | `accion=reprogramar` (inicia_en, duracion_min, tipo, nombre, telefono, nota) · `estado` | Fecha, duración y tipo válidos | `303 ?guardado=1` · `303 ?error=datos` o `guardar` · `404` | Cita, acciones y Google |
| `POST /admin/pacientes/nuevo` | nombre, telefono, tratamiento, inicio, estado, notas, `?volver` | Nombre y estado válidos; `volver` solo ruta local | `303 volver?paciente=id` · `303 /admin/pacientes/[id]?creado=1` · `200` con error | Paciente |
| `POST /admin/pacientes/[id]` | `accion=datos` · `notas` · `recordatorio` (cuota) | Nombre y estado válidos | `303 ?guardado=1` · `303 ?recordatorio=1#mensualidades` · `303 ?error=…` | Paciente o recordatorio |
| `POST /admin/pacientes/[id]/plan` | tratamiento, costo_total, enganche, num_cuotas, dia_corte, inicio | Costo mayor que 0; 0 ≤ enganche ≤ costo; 0 a 120 cuotas; corte de 1 a 28 | `303 /admin/pacientes/[id]?plan=1` · `200` con error | RPC `crear_plan_con_cuotas` (borra y rehace, H-17) |
| `POST /admin/pagos` | `accion=recordatorio` (id, paciente) · borrar (id) | — | `303` a la misma URL (silencioso, H-08) | Recordatorio o borrado de pago |
| `POST /admin/pagos/nuevo` | paciente_id, aplica (`cuota:<id>`, mensualidad, enganche o cargo_suelto), monto, metodo, pagado_el, concepto, nota | Paciente; monto mayor que 0; tipo y método válidos | `303 /admin/pacientes/[id]?pago=1` · `200` con error (**pierde lo tecleado**, H-09) | Pago |
| Middleware (cualquier `/admin/*`) | Cookies | Sesión, allowlist, rol, `puedeVer` | `302 /admin/login` · `303 /admin?acceso=denegado` (GET) · `403` (POST) | `signOut` si la sesión no está autorizada |

## E-08 · Flujo de datos y caché

```mermaid
flowchart LR
  subgraph telefono ["Teléfono"]
    formulario[/"Formulario de la landing"/]
    panelUi["Panel (PWA)"]
    swCache[("SW: /_astro e iconos")]
    respaldo[("SW: pantalla sin conexión")]
  end
  subgraph vercelFlujo ["Vercel"]
    landingCdn["Landing prerenderizada en CDN"]
    apiContact["API contact"]
    paginasAdmin["Páginas /admin (no-store)"]
  end
  subgraph datos ["Supabase"]
    tablaSolicitudes[("solicitudes")]
    tablasPanel[("citas, pacientes, pagos")]
    vistas[("vistas de cuotas y saldo")]
  end
  calendario["Google Calendar"]

  landingCdn -->|"HTML cacheable"| formulario
  formulario -->|"JSON"| apiContact
  apiContact -->|"insert"| tablaSolicitudes
  panelUi -->|"navegación siempre a red"| paginasAdmin
  paginasAdmin -->|"lee"| tablaSolicitudes
  paginasAdmin -->|"lee y escribe"| tablasPanel
  tablasPanel -->|"deriva"| vistas
  vistas -->|"estado y saldo"| paginasAdmin
  paginasAdmin -.->|"espejo de citas"| calendario
  panelUi -->|"primero caché"| swCache
  panelUi -.->|"sin red"| respaldo

  style telefono fill:#C2E5FF,stroke:#3DADFF
  style vercelFlujo fill:#D9D9D9,stroke:#B3B3B3
  style datos fill:#CDF4D3,stroke:#66D575
```

| Qué | Dónde se cachea | Por qué |
|---|---|---|
| Landing (HTML, imágenes) | CDN de Vercel | Pública y prerenderizada |
| `/_astro/*` (JS y CSS con hash) | Cache Storage del teléfono, primero caché | Inmutables por el hash en el nombre |
| Iconos, manifest, favicon | Cache Storage, stale-while-revalidate | Cambian poco |
| HTML de `/admin` | **Nunca** (`private, no-store`; el SW siempre va a la red) | Contiene datos de pacientes |
| Pantalla sin conexión | Cache Storage, se instala con el SW | Respuesta a una navegación sin red |
