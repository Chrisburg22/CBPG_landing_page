-- Dos roles: la doctora y la recepcionista.
--
-- Hasta aquí «tener cuenta» y «poder verlo todo» eran lo mismo: `privado.es_admin()`
-- devolvía true para cualquier fila de `admins`. Con la recepcionista entrando al
-- panel eso deja de servir — el expediente, las notas, los planes y el dinero no
-- son suyos — así que el rol se vuelve una columna y las políticas del dinero y de
-- las fichas pasan a exigir `privado.es_doctora()`.
--
-- La separación se hace EN LA BASE y no en la interfaz a propósito: esconder un
-- enlace no impide escribir la URL a mano, y el cliente del panel lleva la sesión
-- de quien navega. Si RLS no lo impide, no está impedido.

alter table public.admins
  add column rol text not null default 'recepcionista'
    check (rol = any (array['doctora', 'recepcionista']));

-- Las cuentas que ya existían son de la doctora: son las únicas que había, y son
-- las que hoy usan pacientes, planes y pagos. El default de la columna es el rol
-- MENOS privilegiado para que una cuenta nueva creada a mano no herede el panel
-- entero por olvido.
update public.admins set rol = 'doctora';

comment on column public.admins.rol is
  'doctora: acceso total. recepcionista: prospectos, seguimiento y agenda.';

-- STABLE SECURITY DEFINER con search_path vacío, igual que `es_admin()`: la
-- consulta a `admins` dentro de una política sobre `admins` sería recursiva si
-- corriera con los permisos de quien pregunta.
create function privado.rol_actual()
returns text
language sql
stable
security definer
set search_path to ''
as $$
  select a.rol from public.admins a where a.user_id = (select auth.uid());
$$;

create function privado.es_doctora()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(privado.rol_actual() = 'doctora', false);
$$;

-- Las políticas del dinero y de las fichas dejan de conformarse con `es_admin()`.
-- Se recrean en vez de alterarse porque una política no se puede modificar sin
-- reescribir su expresión de todos modos, y así el diff dice exactamente qué
-- cambió.

drop policy "pacientes: lectura solo admin" on public.pacientes;
drop policy "pacientes: alta solo admin" on public.pacientes;
drop policy "pacientes: actualizacion solo admin" on public.pacientes;

create policy "pacientes: lectura solo doctora"
  on public.pacientes for select using (privado.es_doctora());
create policy "pacientes: alta solo doctora"
  on public.pacientes for insert with check (privado.es_doctora());
create policy "pacientes: actualizacion solo doctora"
  on public.pacientes for update using (privado.es_doctora());

drop policy "planes: lectura solo admin" on public.planes_tratamiento;
drop policy "planes: alta solo admin" on public.planes_tratamiento;
drop policy "planes: actualizacion solo admin" on public.planes_tratamiento;
drop policy "planes: baja solo admin" on public.planes_tratamiento;

create policy "planes: lectura solo doctora"
  on public.planes_tratamiento for select using (privado.es_doctora());
create policy "planes: alta solo doctora"
  on public.planes_tratamiento for insert with check (privado.es_doctora());
create policy "planes: actualizacion solo doctora"
  on public.planes_tratamiento for update using (privado.es_doctora());
create policy "planes: baja solo doctora"
  on public.planes_tratamiento for delete using (privado.es_doctora());

drop policy "cuotas: lectura solo admin" on public.cuotas;
drop policy "cuotas: alta solo admin" on public.cuotas;
drop policy "cuotas: baja solo admin" on public.cuotas;

create policy "cuotas: lectura solo doctora"
  on public.cuotas for select using (privado.es_doctora());
create policy "cuotas: alta solo doctora"
  on public.cuotas for insert with check (privado.es_doctora());
create policy "cuotas: baja solo doctora"
  on public.cuotas for delete using (privado.es_doctora());

drop policy "pagos: lectura solo admin" on public.pagos;
drop policy "pagos: alta solo admin" on public.pagos;
drop policy "pagos: actualizacion solo admin" on public.pagos;
drop policy "pagos: baja solo admin" on public.pagos;

create policy "pagos: lectura solo doctora"
  on public.pagos for select using (privado.es_doctora());
create policy "pagos: alta solo doctora"
  on public.pagos for insert with check (privado.es_doctora());
create policy "pagos: actualizacion solo doctora"
  on public.pagos for update using (privado.es_doctora());
create policy "pagos: baja solo doctora"
  on public.pagos for delete using (privado.es_doctora());

-- `vista_cuotas` y `vista_saldo_paciente` no se tocan: llevan `security_invoker`,
-- así que heredan lo que acabamos de estrechar en sus tablas base. Una
-- recepcionista que consulte la vista obtiene cero filas, no un error.

-- `solicitudes` sigue con `es_admin()`: los prospectos son justo el trabajo
-- compartido. Y `crear_plan_con_cuotas` tampoco cambia — es SECURITY INVOKER,
-- así que ya rebota contra las políticas nuevas de planes y cuotas.

-- El panel necesita leer su propio rol para decidir qué dibuja. La política
-- «cada quien ve solo su fila» ya existe desde la migración original; esto
-- añade la columna al GRANT, que es lo que PostgREST mira.
grant select (rol) on public.admins to authenticated;
