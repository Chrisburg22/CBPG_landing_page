-- El dinero: plan de tratamiento, calendario de cuotas y pagos.
--
-- Tres tablas y no una porque son tres cosas con vidas distintas: el plan es lo
-- acordado, las cuotas son lo que se espera cobrar y cuándo, y los pagos son lo
-- que efectivamente entró. Mezclarlas haría imposible responder a «¿cuánto
-- debería haber cobrado este mes?» sin adivinar.
--
-- Un plan puede tener CERO cuotas: es un tratamiento con precio cerrado que se
-- va pagando sin calendario. El saldo se calcula igual (total menos pagado), y
-- simplemente no hay nada que pueda vencer.

create table public.planes_tratamiento (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- ON DELETE CASCADE: sin paciente no hay plan que valga. No existe política de
  -- DELETE sobre pacientes, así que en la práctica esto solo actúa si alguien
  -- borra desde la consola de Supabase.
  paciente_id uuid not null references public.pacientes(id) on delete cascade,

  tratamiento text not null default '' check (char_length(tratamiento) <= 120),

  -- numeric y NUNCA float: en coma flotante binaria, 0.1 + 0.2 no es 0.3, y un
  -- saldo que no cuadra por un centavo es un saldo en el que no se confía.
  costo_total numeric(10, 2) not null default 0 check (costo_total >= 0),
  enganche numeric(10, 2) not null default 0 check (enganche >= 0),

  -- 0 = sin calendario de mensualidades. El techo de 120 es para que un cero de
  -- más al teclear no genere miles de filas.
  num_cuotas int not null default 0 check (num_cuotas between 0 and 120),

  -- Día del mes en que vence cada mensualidad. Tope 28 a propósito: con 29, 30 o
  -- 31 habría que decidir qué pasa en febrero, y ninguna respuesta es buena.
  dia_corte int not null default 1 check (dia_corte between 1 and 28),

  inicio date not null default current_date,

  check (enganche <= costo_total)
);

create index planes_paciente on public.planes_tratamiento (paciente_id);

create trigger planes_tocar_actualizado_en
  before update on public.planes_tratamiento
  for each row execute function public.tocar_actualizado_en();

-- Cuotas: lo que se espera cobrar y cuándo.
--
-- SIN columna `estado`. El estado de una cuota (pendiente, parcial, pagada,
-- vencida) es una función de lo pagado y de la fecha de hoy, así que guardarlo
-- obligaría a recalcularlo cada día — y el día que ese recálculo no corriera,
-- el panel mentiría. Se deriva en `vista_cuotas` (migración 0005).
create table public.cuotas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  plan_id uuid not null references public.planes_tratamiento(id) on delete cascade,
  numero int not null check (numero >= 1),
  monto numeric(10, 2) not null check (monto >= 0),
  vence_el date not null,

  -- Dos cuotas número 3 del mismo plan no significan nada.
  unique (plan_id, numero)
);

create index cuotas_plan on public.cuotas (plan_id);
create index cuotas_vence on public.cuotas (vence_el);

-- Pagos: lo que entró de verdad.
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  paciente_id uuid not null references public.pacientes(id) on delete cascade,

  -- Nulo = no corresponde a ninguna mensualidad: enganche o cargo suelto.
  -- ON DELETE SET NULL y no CASCADE: si se rehace el plan y desaparecen sus
  -- cuotas, el dinero que ya entró no puede evaporarse con ellas.
  cuota_id uuid references public.cuotas(id) on delete set null,

  tipo text not null default 'mensualidad'
    check (tipo = any (array['mensualidad', 'enganche', 'cargo_suelto'])),

  concepto text not null default '' check (char_length(concepto) <= 160),
  monto numeric(10, 2) not null check (monto > 0),

  metodo text not null default 'efectivo'
    check (metodo = any (array['efectivo', 'transferencia', 'tarjeta'])),

  pagado_el date not null default current_date,
  nota text not null default '' check (char_length(nota) <= 1000)
);

create index pagos_paciente on public.pagos (paciente_id);
create index pagos_cuota on public.pagos (cuota_id);
create index pagos_fecha on public.pagos (pagado_el);

create trigger pagos_tocar_actualizado_en
  before update on public.pagos
  for each row execute function public.tocar_actualizado_en();

-- RLS: la misma barrera del resto del panel. Ninguna escritura pública.
alter table public.planes_tratamiento enable row level security;
alter table public.cuotas enable row level security;
alter table public.pagos enable row level security;

create policy "planes: lectura solo admin" on public.planes_tratamiento
  for select using (privado.es_admin());
create policy "planes: alta solo admin" on public.planes_tratamiento
  for insert with check (privado.es_admin());
create policy "planes: actualizacion solo admin" on public.planes_tratamiento
  for update using (privado.es_admin());
create policy "planes: baja solo admin" on public.planes_tratamiento
  for delete using (privado.es_admin());

create policy "cuotas: lectura solo admin" on public.cuotas
  for select using (privado.es_admin());
create policy "cuotas: alta solo admin" on public.cuotas
  for insert with check (privado.es_admin());
create policy "cuotas: baja solo admin" on public.cuotas
  for delete using (privado.es_admin());

create policy "pagos: lectura solo admin" on public.pagos
  for select using (privado.es_admin());
create policy "pagos: alta solo admin" on public.pagos
  for insert with check (privado.es_admin());
create policy "pagos: actualizacion solo admin" on public.pagos
  for update using (privado.es_admin());
create policy "pagos: baja solo admin" on public.pagos
  for delete using (privado.es_admin());

-- El plan sí se puede borrar y rehacer: es un acuerdo, y los acuerdos cambian.
-- Un pago registrado no: corregir un importe se hace editándolo, y quitarlo
-- entero es una operación que debe poder deshacerse mirando quién y cuándo.
-- Por eso pagos tiene DELETE (un dedazo hay que poder arreglarlo) pero cuotas
-- no lo tiene suelto: sus bajas van por CASCADE al rehacer el plan.

grant select on public.planes_tratamiento to authenticated;
grant insert (paciente_id, tratamiento, costo_total, enganche, num_cuotas, dia_corte, inicio)
  on public.planes_tratamiento to authenticated;
grant update (tratamiento, costo_total, enganche, num_cuotas, dia_corte, inicio)
  on public.planes_tratamiento to authenticated;
grant delete on public.planes_tratamiento to authenticated;

grant select on public.cuotas to authenticated;
grant insert (plan_id, numero, monto, vence_el) on public.cuotas to authenticated;
grant delete on public.cuotas to authenticated;

grant select on public.pagos to authenticated;
grant insert (paciente_id, cuota_id, tipo, concepto, monto, metodo, pagado_el, nota)
  on public.pagos to authenticated;
grant update (cuota_id, tipo, concepto, monto, metodo, pagado_el, nota)
  on public.pagos to authenticated;
grant delete on public.pagos to authenticated;
