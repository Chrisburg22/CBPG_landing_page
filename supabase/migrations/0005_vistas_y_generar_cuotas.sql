-- Lo que evita que el saldo mienta: el estado de cada cuota y el saldo de cada
-- paciente se CALCULAN, no se guardan.
--
-- `security_invoker = true` en las dos vistas es lo que hace que hereden las
-- políticas RLS de sus tablas base. Sin eso, una vista se ejecuta con los
-- permisos de quien la creó (el superusuario) y se convierte en un agujero que
-- deja leer todo saltándose RLS.

create view public.vista_cuotas
with (security_invoker = true) as
select
  c.id,
  c.plan_id,
  p.paciente_id,
  c.numero,
  c.monto,
  c.vence_el,
  coalesce(sum(g.monto), 0)::numeric(10, 2) as pagado,
  (c.monto - coalesce(sum(g.monto), 0))::numeric(10, 2) as restante,
  -- La precedencia importa y no es obvia: una cuota vencida a la que se le
  -- abonó algo sigue siendo un problema de cobro, así que `vencida` gana a
  -- `parcial`. Y `pagada` gana a todo: si ya se pagó, la fecha da igual.
  case
    when coalesce(sum(g.monto), 0) >= c.monto then 'pagada'
    when c.vence_el < current_date then 'vencida'
    when coalesce(sum(g.monto), 0) > 0 then 'parcial'
    else 'pendiente'
  end as estado
from public.cuotas c
join public.planes_tratamiento p on p.id = c.plan_id
left join public.pagos g on g.cuota_id = c.id
group by c.id, c.plan_id, p.paciente_id, c.numero, c.monto, c.vence_el;

-- Un renglón por paciente CON plan. Los pacientes sin plan no aparecen: no
-- tienen saldo que mostrar, y un cero fingido se confundiría con «ya pagó todo».
create view public.vista_saldo_paciente
with (security_invoker = true) as
select
  p.paciente_id,
  p.id as plan_id,
  p.costo_total,
  p.num_cuotas,
  coalesce(g.pagado, 0)::numeric(10, 2) as pagado,
  (p.costo_total - coalesce(g.pagado, 0))::numeric(10, 2) as saldo,
  coalesce(v.vencidas, 0) as cuotas_vencidas,
  coalesce(v.monto_vencido, 0)::numeric(10, 2) as monto_vencido,
  v.proxima_vence_el,
  -- Cuántas mensualidades se han cubierto por completo. Es lo que la ficha
  -- enseña como «mes 7 de 18».
  coalesce(v.pagadas, 0) as cuotas_pagadas
from public.planes_tratamiento p
-- Todos los pagos del paciente cuentan contra el total, tengan cuota o no:
-- el enganche y los cargos sueltos también son dinero que entró.
left join (
  select paciente_id, sum(monto) as pagado
  from public.pagos group by paciente_id
) g on g.paciente_id = p.paciente_id
left join (
  select
    plan_id,
    count(*) filter (where estado = 'vencida') as vencidas,
    sum(restante) filter (where estado = 'vencida') as monto_vencido,
    count(*) filter (where estado = 'pagada') as pagadas,
    min(vence_el) filter (where estado <> 'pagada') as proxima_vence_el
  from public.vista_cuotas group by plan_id
) v on v.plan_id = p.id;

grant select on public.vista_cuotas to authenticated;
grant select on public.vista_saldo_paciente to authenticated;

-- Alta del plan y su calendario, en una sola transacción.
--
-- Va como función y no como dos llamadas desde la aplicación porque PostgREST no
-- expone transacciones: un plan insertado cuyas cuotas fallaran dejaría un
-- calendario vacío que nadie notaría hasta el primer cobro.
--
-- SECURITY INVOKER (el valor por defecto) a propósito: así las políticas RLS de
-- planes_tratamiento y cuotas siguen aplicando dentro de la función. Con
-- SECURITY DEFINER, cualquiera con acceso a la API podría crear planes.
create function public.crear_plan_con_cuotas(
  p_paciente_id uuid,
  p_tratamiento text,
  p_costo_total numeric,
  p_enganche numeric,
  p_num_cuotas int,
  p_dia_corte int,
  p_inicio date
) returns uuid
language plpgsql
set search_path to ''
as $$
declare
  v_plan_id uuid;
  v_financiado numeric(10, 2);
  v_cuota numeric(10, 2);
  v_acumulado numeric(10, 2) := 0;
  v_monto numeric(10, 2);
  i int;
begin
  -- Rehacer el plan es la operación normal cuando cambian los términos, así que
  -- el anterior se va con sus cuotas. Los pagos ya registrados sobreviven: su
  -- cuota_id se pone a NULL por la FK, y el dinero sigue contando en el saldo.
  delete from public.planes_tratamiento where paciente_id = p_paciente_id;

  insert into public.planes_tratamiento
    (paciente_id, tratamiento, costo_total, enganche, num_cuotas, dia_corte, inicio)
  values
    (p_paciente_id, p_tratamiento, p_costo_total, p_enganche, p_num_cuotas, p_dia_corte, p_inicio)
  returning id into v_plan_id;

  if p_num_cuotas > 0 then
    v_financiado := p_costo_total - p_enganche;
    v_cuota := round(v_financiado / p_num_cuotas, 2);

    for i in 1..p_num_cuotas loop
      -- La última cuota absorbe el redondeo. Sin esto, 10000/3 daría tres cuotas
      -- de 3333.33 que suman 9999.99, y quedaría un centavo eterno por cobrar.
      if i = p_num_cuotas then
        v_monto := v_financiado - v_acumulado;
      else
        v_monto := v_cuota;
        v_acumulado := v_acumulado + v_cuota;
      end if;

      insert into public.cuotas (plan_id, numero, monto, vence_el)
      values (
        v_plan_id,
        i,
        v_monto,
        -- El día de corte está limitado a 28 por el CHECK de la tabla, así que
        -- esta fecha siempre existe, también en febrero.
        (date_trunc('month', p_inicio) + (i || ' month')::interval)::date
          + (p_dia_corte - 1)
      );
    end loop;
  end if;

  return v_plan_id;
end;
$$;

grant execute on function public.crear_plan_con_cuotas to authenticated;
