-- La agenda, el seguimiento de prospectos y el registro de cobranza.
--
-- Cuatro tablas nuevas y cuatro columnas en `solicitudes`. La idea de fondo es
-- que el panel deje de ser un archivo de lo que pasó y pueda contestar «¿qué
-- toca hoy?»: para eso hacen falta citas con hora, una próxima acción por
-- prospecto y un rastro de lo que ya se hizo.

/* ------------------------------------------------------- Seguimiento */

-- De dónde salió el prospecto. Las filas que ya existen quedan como 'sitio'
-- porque hasta hoy la única entrada era el formulario de la página.
alter table public.solicitudes
  add column origen text not null default 'sitio'
    check (origen = any (array['sitio', 'instagram', 'recomendacion', 'otro']));

-- La próxima acción: tres columnas y no una tabla porque un prospecto tiene como
-- mucho UNA cosa pendiente. Una tabla obligaría a decidir cuál de varias es «la»
-- pendiente cada vez que se pinta la cola de hoy.
--
-- Nulo significa «nada agendado», y por eso estas tres sí admiten nulo: el resto
-- del esquema no tiene nulos justo porque en el resto del esquema no significan
-- nada.
alter table public.solicitudes
  add column proxima_accion_en timestamptz,
  add column proxima_accion_tipo text
    check (proxima_accion_tipo is null
           or proxima_accion_tipo = any (array['whatsapp', 'llamada', 'cita', 'otro'])),
  -- Corta a propósito: es un recordatorio operativo («insistir el jueves»), no
  -- un sitio donde escribir el historial clínico. Para eso están `notas`.
  add column proxima_accion_nota text not null default ''
    check (char_length(proxima_accion_nota) <= 300);

-- La cola «Hoy» filtra por esta columna en cada carga del tablero.
create index solicitudes_proxima_accion
  on public.solicitudes (proxima_accion_en)
  where proxima_accion_en is not null;

create index solicitudes_origen on public.solicitudes (origen);

-- El formulario público (rol `anon`) NO recibe estas columnas: con ellas podría
-- declararse «recomendación» o dejarse una acción pendiente a sí mismo.
grant select (origen, proxima_accion_en, proxima_accion_tipo, proxima_accion_nota)
  on public.solicitudes to authenticated;
grant update (origen, proxima_accion_en, proxima_accion_tipo, proxima_accion_nota)
  on public.solicitudes to authenticated;

/* ------------------------------------------------------------- Citas */

-- Una cita no es un estado de la solicitud ni un campo del paciente: es un hecho
-- con hora, duración y asistencia propia, y la misma persona tiene muchas a lo
-- largo del tratamiento.
--
-- Guarda `nombre_contacto` y `telefono_contacto` COPIADOS, no resueltos por
-- join. Ese es el punto entero: la recepcionista opera la agenda sin poder leer
-- `pacientes`, y si el nombre viniera por join, RLS le devolvería una agenda de
-- citas anónimas. El precio es que editar el teléfono en la ficha no reescribe
-- las citas viejas, y está bien: una cita es lo que se acordó ese día.
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- A lo sumo una de las dos. Una cita suelta (alguien que llegó sin ficha ni
  -- formulario) las deja las dos en nulo y se sostiene con nombre y teléfono.
  solicitud_id uuid references public.solicitudes(id) on delete set null,
  paciente_id uuid references public.pacientes(id) on delete set null,
  check (solicitud_id is null or paciente_id is null),

  nombre_contacto text not null default ''
    check (char_length(nombre_contacto) between 1 and 120),
  telefono_contacto text not null default ''
    check (char_length(telefono_contacto) <= 30),

  -- timestamptz: la agenda se escribe y se lee en America/Mexico_City, pero se
  -- guarda en UTC. Con `timestamp` a secas, el primer cambio de horario de
  -- verano movería las citas una hora sin que nadie tocara nada.
  inicia_en timestamptz not null,
  duracion_min int not null default 30 check (duracion_min between 5 and 480),

  tipo text not null default 'valoracion'
    check (tipo = any (array['valoracion', 'control'])),

  estado text not null default 'programada'
    check (estado = any (array['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'])),

  -- Operativa, no clínica: «viene con su mamá», «trae radiografía».
  nota text not null default '' check (char_length(nota) <= 1000),

  -- Quién la creó. Sin FK a auth.users: esa tabla vive en otro esquema y
  -- encadenarla obligaría a decidir qué pasa con la agenda si se borra la
  -- cuenta. El correo se resuelve contra `admins` cuando hace falta mostrarlo.
  responsable uuid default auth.uid(),

  -- Espejo del evento en Google Calendar. Vacío mientras no haya calendario
  -- conectado; ver `integracion_google` más abajo.
  google_evento_id text not null default '' check (char_length(google_evento_id) <= 200),
  -- `desactivada` = no hay integración conectada, así que no hay nada que
  -- sincronizar y la cita no debe aparecer como pendiente para siempre.
  google_sync text not null default 'desactivada'
    check (google_sync = any (array['pendiente', 'sincronizada', 'error', 'desactivada'])),
  google_error text not null default '' check (char_length(google_error) <= 500)
);

create index citas_inicia on public.citas (inicia_en);
create index citas_estado on public.citas (estado);
create index citas_solicitud on public.citas (solicitud_id);
create index citas_paciente on public.citas (paciente_id);
-- Para el reintento de sincronización: son pocas filas y se buscan por esto.
create index citas_google_sync on public.citas (google_sync)
  where google_sync in ('pendiente', 'error');

create trigger citas_tocar_actualizado_en
  before update on public.citas
  for each row execute function public.tocar_actualizado_en();

alter table public.citas enable row level security;

-- La agenda es de las dos: `es_admin()`, no `es_doctora()`.
create policy "citas: lectura admin" on public.citas
  for select using (privado.es_admin());
create policy "citas: alta admin" on public.citas
  for insert with check (privado.es_admin());
create policy "citas: actualizacion admin" on public.citas
  for update using (privado.es_admin());

-- Sin política de DELETE: una cita que ya no va se CANCELA. Borrarla perdería
-- el hueco que ocupó y el rastro de que existió, que es justo lo que hace falta
-- para entender un «no asistió».

grant select on public.citas to authenticated;
grant insert (solicitud_id, paciente_id, nombre_contacto, telefono_contacto, inicia_en,
              duracion_min, tipo, estado, nota, responsable,
              google_evento_id, google_sync, google_error)
  on public.citas to authenticated;
-- `solicitud_id` y `paciente_id` no son actualizables: mover una cita de persona
-- es crear otra cita. El resto sí, incluidas las tres columnas de Google — las
-- escribe el adaptador dentro de la misma petición que crea o mueve la cita.
grant update (nombre_contacto, telefono_contacto, inicia_en, duracion_min, tipo, estado,
              nota, google_evento_id, google_sync, google_error)
  on public.citas to authenticated;

/* --------------------------------------------- Acciones sobre prospectos */

-- El rastro mínimo de qué se hizo con cada prospecto y cuándo. Sin esto, un
-- estado «contactada» no dice si se le escribió ayer o hace tres semanas.
create table public.acciones_prospecto (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  cita_id uuid references public.citas(id) on delete set null,

  tipo text not null
    check (tipo = any (array['whatsapp', 'llamada', 'cita_creada', 'cita_reprogramada',
                             'cita_cancelada', 'conversion', 'nota'])),

  nota text not null default '' check (char_length(nota) <= 500),
  actor uuid default auth.uid()
);

create index acciones_solicitud on public.acciones_prospecto (solicitud_id, creado_en desc);
create index acciones_creado on public.acciones_prospecto (creado_en);
create index acciones_tipo on public.acciones_prospecto (tipo);

alter table public.acciones_prospecto enable row level security;

create policy "acciones: lectura admin" on public.acciones_prospecto
  for select using (privado.es_admin());
create policy "acciones: alta admin" on public.acciones_prospecto
  for insert with check (privado.es_admin());

-- Ni UPDATE ni DELETE, a propósito: es un registro de hechos. Corregir el
-- pasado aquí lo convertiría en un cuento.

grant select on public.acciones_prospecto to authenticated;
grant insert (solicitud_id, cita_id, tipo, nota, actor)
  on public.acciones_prospecto to authenticated;

/* --------------------------------------------------- Recordatorios de cobro */

-- Qué recordatorio de pago se mandó, cuándo y quién. WhatsApp se abre a mano
-- desde el teléfono de la doctora, así que la aplicación no puede saber si el
-- mensaje llegó: lo único honesto que puede registrar es que ella lo dio por
-- enviado. Sirve para no cobrarle dos veces a la misma persona el mismo día.
create table public.recordatorios_cobro (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  cuota_id uuid not null references public.cuotas(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  tipo text not null default 'whatsapp'
    check (tipo = any (array['whatsapp', 'llamada'])),
  enviado_por uuid default auth.uid(),
  nota text not null default '' check (char_length(nota) <= 300)
);

create index recordatorios_cuota on public.recordatorios_cobro (cuota_id, creado_en desc);
create index recordatorios_paciente on public.recordatorios_cobro (paciente_id);

alter table public.recordatorios_cobro enable row level security;

-- Cobranza es de la doctora. La recepcionista no ve cuotas, así que tampoco
-- tiene por qué ver quién debe.
create policy "recordatorios: lectura solo doctora" on public.recordatorios_cobro
  for select using (privado.es_doctora());
create policy "recordatorios: alta solo doctora" on public.recordatorios_cobro
  for insert with check (privado.es_doctora());

grant select on public.recordatorios_cobro to authenticated;
grant insert (cuota_id, paciente_id, tipo, enviado_por, nota)
  on public.recordatorios_cobro to authenticated;

/* ------------------------------------------------- Integración con Google */

-- Los tokens del calendario. Una sola fila: el consultorio tiene un calendario
-- compartido, no uno por usuaria.
--
-- RLS activo y CERO políticas, y ningún GRANT a `authenticated`. No es un olvido:
-- así la tabla es invisible para el cliente del panel —que lleva la sesión de
-- quien navega— y solo se puede leer con la clave secreta, desde el servidor.
-- Los tokens además van cifrados con AES-256-GCM (ver src/lib/google/cripto.ts):
-- un volcado de la base no basta para suplantar al consultorio en Google.
create table public.integracion_google (
  -- Fila única. El CHECK sobre la PK es lo que impide que aparezca una segunda.
  id smallint primary key default 1 check (id = 1),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  /** Correo de la cuenta de Google que autorizó. Solo para mostrarlo. */
  cuenta text not null default '' check (char_length(cuenta) <= 200),
  /** Calendario destino. Vacío = autorizado pero sin elegir calendario todavía. */
  calendario_id text not null default '' check (char_length(calendario_id) <= 300),
  calendario_nombre text not null default '' check (char_length(calendario_nombre) <= 200),

  refresh_token_cifrado text not null default '',
  access_token_cifrado text not null default '',
  access_expira_en timestamptz,

  conectado_en timestamptz,
  /** Último fallo de sincronización, para poder explicarlo en pantalla. */
  ultimo_error text not null default '' check (char_length(ultimo_error) <= 500)
);

create trigger integracion_google_tocar_actualizado_en
  before update on public.integracion_google
  for each row execute function public.tocar_actualizado_en();

alter table public.integracion_google enable row level security;
