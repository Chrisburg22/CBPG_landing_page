-- Pacientes: quien ya empezó tratamiento.
--
-- Es una tabla aparte de `solicitudes` y no un estado más de ella porque son dos
-- cosas distintas con vidas distintas. Una solicitud es un hecho puntual —"esta
-- persona llenó el formulario tal día y aceptó el aviso versión tal"— y es
-- inmutable salvo su estado y sus notas. Un paciente es una relación que dura
-- meses y cuyos datos cambian: el teléfono, el tratamiento, el estado del
-- tratamiento. Mezclarlas obligaría a que las columnas de una fueran nulas en la
-- otra y a que el listado de prospectos tuviera que filtrar pacientes.

create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- De qué solicitud viene. Nullable a propósito: la doctora también da de alta
  -- pacientes que llegaron por recomendación y nunca pasaron por el formulario.
  -- UNIQUE porque una solicitud se convierte una sola vez; sin esto, dos clics
  -- seguidos en «Convertir» crearían dos pacientes con el mismo origen.
  -- ON DELETE SET NULL y no CASCADE: si algún día se borra una solicitud por
  -- una petición de supresión de datos, el paciente y su historial siguen ahí.
  solicitud_id uuid unique references public.solicitudes(id) on delete set null,

  nombre text not null default '' check (char_length(nombre) between 1 and 120),
  telefono text not null default '' check (char_length(telefono) between 1 and 30),
  tratamiento text not null default '' check (char_length(tratamiento) between 1 and 120),

  -- activo: en tratamiento · retencion: terminó y trae retenedores
  -- alta: cerrado    · pausado: interrumpido temporalmente
  estado text not null default 'activo'
    check (estado = any (array['activo', 'retencion', 'alta', 'pausado'])),

  inicio date not null default current_date,

  -- PUEDE CONTENER DATOS DE SALUD, igual que solicitudes.mensaje: nunca a logs,
  -- nunca a una URL, nunca con set:html.
  notas text not null default '' check (char_length(notas) <= 4000)
);

-- Busca por nombre en el listado. El índice trigram sirve al ilike '%…%' que usa
-- `listar()`; un btree normal no lo aprovecharía por el comodín inicial.
create extension if not exists pg_trgm;
create index pacientes_nombre_trgm on public.pacientes using gin (nombre gin_trgm_ops);
create index pacientes_estado on public.pacientes (estado);

create trigger pacientes_tocar_actualizado_en
  before update on public.pacientes
  for each row execute function public.tocar_actualizado_en();

-- RLS: misma barrera que `solicitudes`. Ojo con la diferencia — en solicitudes
-- el rol anónimo puede insertar (es el formulario público); aquí no hay ninguna
-- escritura pública, así que `anon` no recibe ningún permiso.
alter table public.pacientes enable row level security;

create policy "pacientes: lectura solo admin"
  on public.pacientes for select
  using (privado.es_admin());

create policy "pacientes: alta solo admin"
  on public.pacientes for insert
  with check (privado.es_admin());

create policy "pacientes: actualizacion solo admin"
  on public.pacientes for update
  using (privado.es_admin());

-- Sin política de DELETE a propósito: un paciente colgará pagos e historial, y
-- borrarlo desde la interfaz sería una forma fácil de perder meses de registro.
-- Para «ya no es paciente» está el estado `alta`.

grant select on public.pacientes to authenticated;

-- GRANT por columna en la escritura: `id`, `creado_en` y `actualizado_en` los
-- pone la base, no la interfaz. Es la misma idea que en solicitudes, y el tipo
-- de TypeScript refleja esta lista para que un update ilegal no compile.
grant insert (solicitud_id, nombre, telefono, tratamiento, estado, inicio, notas)
  on public.pacientes to authenticated;
grant update (solicitud_id, nombre, telefono, tratamiento, estado, inicio, notas)
  on public.pacientes to authenticated;
