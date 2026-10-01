-- Migración 003: Añadir filtros de fuente de recursos y método de pago a las funciones RPC

-- Recrear resumen_gastos con los nuevos parámetros
create or replace function public.resumen_gastos(
  p_desde date default null,
  p_hasta date default null,
  p_gasto_compra_id smallint default null,
  p_fuente_recursos_id smallint default null,
  p_metodo_pago_id smallint default null
)
returns table (total numeric, cantidad_facturas bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(f.total), 0), count(*)
    from public.facturas f
   where f.estado = 'activa'
     and (p_gasto_compra_id is null or f.gasto_compra_id = p_gasto_compra_id)
     and (p_fuente_recursos_id is null or f.fuente_recursos_id = p_fuente_recursos_id)
     and (p_metodo_pago_id is null or f.metodo_pago_id = p_metodo_pago_id)
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'));
$$;

-- Recrear gastos_por_periodo con los nuevos parámetros
create or replace function public.gastos_por_periodo(
  p_agrupacion text,
  p_desde date default null,
  p_hasta date default null,
  p_gasto_compra_id smallint default null,
  p_fuente_recursos_id smallint default null,
  p_metodo_pago_id smallint default null
)
returns table (periodo date, total numeric, cantidad_facturas bigint)
language plpgsql stable security invoker set search_path = public as $$
begin
  if p_agrupacion not in ('day', 'week', 'month', 'year') then
    raise exception 'Agrupación inválida: use day, week, month o year.';
  end if;

  return query
  select date_trunc(p_agrupacion, f.fecha_registro at time zone 'America/Bogota')::date,
         sum(f.total),
         count(*)
    from public.facturas f
   where f.estado = 'activa'
     and (p_gasto_compra_id is null or f.gasto_compra_id = p_gasto_compra_id)
     and (p_fuente_recursos_id is null or f.fuente_recursos_id = p_fuente_recursos_id)
     and (p_metodo_pago_id is null or f.metodo_pago_id = p_metodo_pago_id)
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'))
   group by 1
   order by 1;
end $$;

-- Recrear gastos_por_categoria con los nuevos parámetros
create or replace function public.gastos_por_categoria(
  p_desde date default null,
  p_hasta date default null,
  p_fuente_recursos_id smallint default null,
  p_metodo_pago_id smallint default null
)
returns table (gasto_compra_id smallint, nombre text, total numeric, cantidad_facturas bigint)
language sql stable security invoker set search_path = public as $$
  select g.id, g.nombre, sum(f.total), count(*)
    from public.facturas f
    join public.gastos_compras g on g.id = f.gasto_compra_id
   where f.estado = 'activa'
     and (p_fuente_recursos_id is null or f.fuente_recursos_id = p_fuente_recursos_id)
     and (p_metodo_pago_id is null or f.metodo_pago_id = p_metodo_pago_id)
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'))
   group by g.id, g.nombre
   order by sum(f.total) desc;
$$;

-- Actualizar permisos para las funciones recreadas
grant execute on function
  public.resumen_gastos(date, date, smallint, smallint, smallint),
  public.gastos_por_periodo(text, date, date, smallint, smallint, smallint),
  public.gastos_por_categoria(date, date, smallint, smallint)
to authenticated;
