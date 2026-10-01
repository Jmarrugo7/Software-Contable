-- ============================================================================
-- CONTABLE · Sistema de Gestión y Control de Gastos mediante Facturas
-- Migración 001 · Esquema inicial (Supabase / PostgreSQL)
--
-- Cómo ejecutarla:
--   · Panel de Supabase → SQL Editor → pegar todo → Run, o
--   · Supabase CLI: guardar en supabase/migrations/ y correr `supabase db push`.
--
-- Referencias al ERS V2: RF-04..RF-41, RN-01..RN-14, RNF-03/04/05/10.
-- Excepción acordada con el usuario: FUENTES DE RECURSOS admite nuevas opciones
-- desde la interfaz (solo agregar; no editar ni borrar). Gasto/Compra y
-- Método de pago siguen siendo fijos (RN-08).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. CATÁLOGOS
-- ---------------------------------------------------------------------------

-- Gasto/Compra (unifica descripción + tipo de gasto, RF-06/RF-07). Lista fija.
create table public.gastos_compras (
  id                smallint generated always as identity primary key,
  nombre            text    not null check (length(btrim(nombre)) > 0),
  -- true solo para NOTA CREDITO: permite valores negativos (devoluciones)
  permite_negativo  boolean not null default false
);
create unique index gastos_compras_nombre_uq
  on public.gastos_compras (upper(btrim(nombre)));

-- Fuente de recursos (RF-17). Predefinidas + las que agregue el usuario.
create table public.fuentes_recursos (
  id              smallint generated always as identity primary key,
  nombre          text    not null check (length(btrim(nombre)) between 1 and 80),
  es_predefinida  boolean not null default false,
  created_at      timestamptz not null default now()
);
create unique index fuentes_recursos_nombre_uq
  on public.fuentes_recursos (upper(btrim(nombre)));

-- Normaliza el nombre (MAYÚSCULAS, espacios simples) para evitar duplicados
-- tipo "Caja menor" / "CAJA  MENOR".
create or replace function public.trg_fuentes_normalizar()
returns trigger language plpgsql as $$
begin
  new.nombre := upper(regexp_replace(btrim(new.nombre), '\s+', ' ', 'g'));
  if new.nombre = '' then
    raise exception 'El nombre de la fuente de recursos no puede estar vacío.';
  end if;
  return new;
end $$;

create trigger fuentes_recursos_normalizar
  before insert or update on public.fuentes_recursos
  for each row execute function public.trg_fuentes_normalizar();

-- Método de pago (RF-18). Lista fija.
create table public.metodos_pago (
  id                   smallint generated always as identity primary key,
  nombre               text    not null check (length(btrim(nombre)) > 0),
  -- true para TRANSFERENCIA: exige número de comprobante (RF-19, RN-09)
  requiere_comprobante boolean not null default false
);
create unique index metodos_pago_nombre_uq
  on public.metodos_pago (upper(btrim(nombre)));

-- ---------------------------------------------------------------------------
-- 2. DATOS INICIALES (tomados de GASTOS_FINAL_OPTISUMINISTROS.xlsx, ya depurados)
-- ---------------------------------------------------------------------------

insert into public.gastos_compras (nombre, permite_negativo) values
  ('MATERIALES', false),
  ('ALIMENTACION', false),
  ('TRANSPORTE, FLETES Y ACARREOS', false),
  ('HIDRATACION', false),
  ('ELEMENTOS DE CAFETERIA', false),
  ('ELEMENTOS DE ASEO', false),
  ('ADECUACIONES', false),
  ('DOTACION PERSONAL', false),
  ('PAGOS LABORADO PERSONAL', false),
  ('SERVICIOS PUBLICOS', false),
  ('SERVICIO DE VIGILANCIA', false),
  ('ALQUILER EQUIPO', false),
  ('PRESTAMO A TERCEROS', false),
  ('POLIZA', false),
  ('ARRIENDO', false),
  ('MATERIALES/HERRAMIENTAS', false),
  ('PAPELERIA', false),
  ('HONORARIOS', false),
  ('COMPARTIR PERSONAL', false),
  ('DEPOSITO', false),
  ('CAPACITACION PERSONAL', false),
  ('DONACIONES', false),
  ('OTROS', false),
  ('NOTA CREDITO', true);

insert into public.fuentes_recursos (nombre, es_predefinida) values
  ('DISMEJ SAS', true),
  ('CAJA MENOR', true),
  ('SRA FIDIA', true);

insert into public.metodos_pago (nombre, requiere_comprobante) values
  ('TRANSFERENCIA', true),
  ('EFECTIVO', false),
  ('TARJETA DE CREDITO', false),
  ('DESCONOCIDO', false);

-- ---------------------------------------------------------------------------
-- 3. FACTURAS
-- ---------------------------------------------------------------------------

create table public.facturas (
  id                 uuid primary key default gen_random_uuid(),

  -- RF-05 / RN-02: la fecha es el momento del registro (el trigger la fija)
  fecha_registro     timestamptz not null default now(),

  gasto_compra_id    smallint    not null references public.gastos_compras (id),
  proveedor          text        not null check (length(btrim(proveedor)) > 0),
  numero_factura     text,                                            -- RF-09 opcional

  cantidad           numeric(12,2) not null default 1 check (cantidad > 0),  -- RF-10
  precio_unitario    numeric(14,2) not null,                          -- RF-11

  -- RF-12: subtotal = cantidad × precio unitario (calculado por la BD)
  subtotal           numeric(14,2) generated always as
                       (round(cantidad * precio_unitario, 2)) stored,

  -- RF-13 / RF-14: valores digitados por el contador
  iva                numeric(14,2) not null default 0,
  retefuente         numeric(14,2) not null default 0,
  reteica            numeric(14,2) not null default 0,
  reteiva            numeric(14,2) not null default 0,

  -- RF-15 / RN-07: total = subtotal + IVA − retefuente − reteICA − reteIVA
  total              numeric(14,2) generated always as
                       (round(cantidad * precio_unitario, 2)
                        + iva - retefuente - reteica - reteiva) stored,

  observaciones      text        not null check (length(btrim(observaciones)) > 0), -- RF-16
  fuente_recursos_id smallint    not null references public.fuentes_recursos (id),
  metodo_pago_id     smallint    not null references public.metodos_pago (id),
  numero_comprobante text,                                            -- RF-19

  estado             text        not null default 'activa'
                       check (estado in ('activa', 'anulada')),

  created_by         uuid        default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index facturas_estado_fecha_idx on public.facturas (estado, fecha_registro desc);
create index facturas_gasto_compra_idx on public.facturas (gasto_compra_id);
create index facturas_proveedor_idx    on public.facturas (upper(proveedor));

-- Reglas de negocio que viven en la base de datos (RNF-04: integridad)
create or replace function public.trg_facturas_validar()
returns trigger language plpgsql as $$
declare
  v_permite_negativo boolean;
  v_requiere_comp    boolean;
begin
  -- Limpieza de textos
  new.proveedor           := btrim(new.proveedor);
  new.observaciones       := btrim(new.observaciones);
  new.numero_factura      := nullif(btrim(coalesce(new.numero_factura, '')), '');
  new.numero_comprobante  := nullif(btrim(coalesce(new.numero_comprobante, '')), '');

  if tg_op = 'INSERT' then
    new.fecha_registro := now();     -- RN-02: el cliente no puede fijar la fecha
    new.estado         := 'activa';  -- toda factura nace activa
    new.created_at     := now();
  else
    new.fecha_registro := old.fecha_registro;   -- la fecha nunca cambia al editar
    new.created_at     := old.created_at;
    new.updated_at     := now();

    -- Una anulada no se edita: primero se reactiva (RN-11)
    if old.estado = 'anulada' and new.estado = 'anulada' then
      raise exception 'Una factura anulada no se puede editar. Reactívela primero.';
    end if;

    -- El estado solo cambia mediante anular_factura() / reactivar_factura()
    if old.estado <> new.estado
       and coalesce(current_setting('app.cambio_estado', true), '') <> 'on' then
      raise exception 'Use anular_factura() o reactivar_factura() para cambiar el estado.';
    end if;
  end if;

  -- Montos: solo NOTA CREDITO admite negativos (devoluciones)
  select permite_negativo into v_permite_negativo
    from public.gastos_compras where id = new.gasto_compra_id;

  if v_permite_negativo then
    if new.precio_unitario = 0 then
      raise exception 'El precio unitario no puede ser cero.';
    end if;
  else
    if new.precio_unitario <= 0 then
      raise exception 'El precio unitario debe ser mayor que cero. Los valores negativos solo aplican a NOTA CREDITO.';
    end if;
    if new.iva < 0 or new.retefuente < 0 or new.reteica < 0 or new.reteiva < 0 then
      raise exception 'IVA y retenciones no pueden ser negativos.';
    end if;
    if round(new.cantidad * new.precio_unitario, 2)
       + new.iva - new.retefuente - new.reteica - new.reteiva < 0 then
      raise exception 'Las retenciones no pueden dejar el total de la factura en negativo.';
    end if;
  end if;

  -- RF-19 / RN-09: transferencia exige número de comprobante
  select requiere_comprobante into v_requiere_comp
    from public.metodos_pago where id = new.metodo_pago_id;

  if v_requiere_comp and new.numero_comprobante is null then
    raise exception 'El número de comprobante es obligatorio para pagos por transferencia.';
  end if;

  return new;
end $$;

create trigger facturas_validar
  before insert or update on public.facturas
  for each row execute function public.trg_facturas_validar();

-- RN-11 / RNF-05: las facturas nunca se borran físicamente
create or replace function public.trg_facturas_no_borrar()
returns trigger language plpgsql as $$
begin
  raise exception 'Las facturas no se eliminan; use la opción Anular.';
end $$;

create trigger facturas_no_borrar
  before delete on public.facturas
  for each row execute function public.trg_facturas_no_borrar();

-- ---------------------------------------------------------------------------
-- 4. ANULACIONES (historial; una factura puede anularse y reactivarse varias veces)
-- ---------------------------------------------------------------------------

create table public.anulaciones (
  id              uuid primary key default gen_random_uuid(),
  factura_id      uuid not null references public.facturas (id) on delete restrict,
  fecha_anulacion timestamptz not null default now(),
  motivo          text,                       -- RF-27 opcional
  reactivada_en   timestamptz                 -- se llena al reactivar (RF-30)
);
create index anulaciones_factura_idx on public.anulaciones (factura_id);

create or replace function public.anular_factura(p_factura_id uuid, p_motivo text default null)
returns void language plpgsql security invoker set search_path = public as $$
begin
  perform set_config('app.cambio_estado', 'on', true);

  update public.facturas set estado = 'anulada'
   where id = p_factura_id and estado = 'activa';
  if not found then
    raise exception 'La factura no existe o ya está anulada.';
  end if;

  insert into public.anulaciones (factura_id, motivo)
  values (p_factura_id, nullif(btrim(coalesce(p_motivo, '')), ''));

  perform set_config('app.cambio_estado', 'off', true);
end $$;

create or replace function public.reactivar_factura(p_factura_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  perform set_config('app.cambio_estado', 'on', true);

  update public.facturas set estado = 'activa'
   where id = p_factura_id and estado = 'anulada';
  if not found then
    raise exception 'La factura no existe o no está anulada.';
  end if;

  update public.anulaciones set reactivada_en = now()
   where factura_id = p_factura_id and reactivada_en is null;

  perform set_config('app.cambio_estado', 'off', true);
end $$;

-- ---------------------------------------------------------------------------
-- 5. ARCHIVOS ADJUNTOS (RF-20, RNF-10)
-- ---------------------------------------------------------------------------

create table public.archivos_adjuntos (
  id             uuid primary key default gen_random_uuid(),
  factura_id     uuid   not null references public.facturas (id) on delete restrict,
  nombre         text   not null,
  tipo_mime      text   not null check (tipo_mime in
                   ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  tamano_bytes   bigint not null check (tamano_bytes > 0 and tamano_bytes <= 10485760), -- 10 MB
  storage_path   text   not null unique,   -- convención: {factura_id}/{uuid}-{nombre}
  created_at     timestamptz not null default now()
);
create index archivos_adjuntos_factura_idx on public.archivos_adjuntos (factura_id);

-- Bucket privado en Supabase Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('facturas-adjuntos', 'facturas-adjuntos', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- ---------------------------------------------------------------------------
-- 6. FUNCIONES DEL TABLERO DE CONTROL DE GASTOS (RF-31..RF-41)
--    Solo cuentan facturas ACTIVAS (RN-10). Fechas en hora de Colombia.
--    Semana ISO (lunes a domingo). Son "security invoker": respetan RLS.
--    Parámetros opcionales en null = sin filtro.
-- ---------------------------------------------------------------------------

-- Indicadores: total y cantidad (RF-32, RF-33)
create or replace function public.resumen_gastos(
  p_desde date default null,
  p_hasta date default null,
  p_gasto_compra_id smallint default null
)
returns table (total numeric, cantidad_facturas bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(f.total), 0), count(*)
    from public.facturas f
   where f.estado = 'activa'
     and (p_gasto_compra_id is null or f.gasto_compra_id = p_gasto_compra_id)
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'));
$$;

-- Serie temporal por día / semana / mes / año (RF-36..RF-39)
--   p_agrupacion: 'day' | 'week' | 'month' | 'year'
create or replace function public.gastos_por_periodo(
  p_agrupacion text,
  p_desde date default null,
  p_hasta date default null,
  p_gasto_compra_id smallint default null
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
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'))
   group by 1
   order by 1;
end $$;

-- Distribución por Gasto/Compra (RF-34)
create or replace function public.gastos_por_categoria(
  p_desde date default null,
  p_hasta date default null
)
returns table (gasto_compra_id smallint, nombre text, total numeric, cantidad_facturas bigint)
language sql stable security invoker set search_path = public as $$
  select g.id, g.nombre, sum(f.total), count(*)
    from public.facturas f
    join public.gastos_compras g on g.id = f.gasto_compra_id
   where f.estado = 'activa'
     and (p_desde is null or f.fecha_registro >= (p_desde::timestamp at time zone 'America/Bogota'))
     and (p_hasta is null or f.fecha_registro <  ((p_hasta + 1)::timestamp at time zone 'America/Bogota'))
   group by g.id, g.nombre
   order by sum(f.total) desc;
$$;

-- ---------------------------------------------------------------------------
-- 7. SEGURIDAD (RLS) · RNF-03
--    Solo usuarios autenticados. IMPORTANTE: desactivar el registro público
--    (Authentication → Sign In / Providers → "Allow new users to sign up" = OFF),
--    de lo contrario cualquiera podría crear una cuenta y quedar "autenticado".
-- ---------------------------------------------------------------------------

alter table public.gastos_compras    enable row level security;
alter table public.fuentes_recursos  enable row level security;
alter table public.metodos_pago      enable row level security;
alter table public.facturas          enable row level security;
alter table public.anulaciones       enable row level security;
alter table public.archivos_adjuntos enable row level security;

-- Catálogos fijos: solo lectura
create policy gastos_compras_select on public.gastos_compras
  for select to authenticated using (true);
create policy metodos_pago_select on public.metodos_pago
  for select to authenticated using (true);

-- Fuentes de recursos: leer y AGREGAR (nunca editar ni borrar)
create policy fuentes_recursos_select on public.fuentes_recursos
  for select to authenticated using (true);
create policy fuentes_recursos_insert on public.fuentes_recursos
  for insert to authenticated with check (es_predefinida = false);

-- Facturas: leer, crear, editar. Sin DELETE.
create policy facturas_select on public.facturas
  for select to authenticated using (true);
create policy facturas_insert on public.facturas
  for insert to authenticated with check (true);
create policy facturas_update on public.facturas
  for update to authenticated using (true) with check (true);

-- Anulaciones: historial, sin borrado
create policy anulaciones_select on public.anulaciones
  for select to authenticated using (true);
create policy anulaciones_insert on public.anulaciones
  for insert to authenticated with check (true);
create policy anulaciones_update on public.anulaciones
  for update to authenticated using (true) with check (true);

-- Adjuntos: solo se agregan/quitan en facturas activas
create policy adjuntos_select on public.archivos_adjuntos
  for select to authenticated using (true);
create policy adjuntos_insert on public.archivos_adjuntos
  for insert to authenticated
  with check (exists (select 1 from public.facturas f
                       where f.id = factura_id and f.estado = 'activa'));
create policy adjuntos_delete on public.archivos_adjuntos
  for delete to authenticated
  using (exists (select 1 from public.facturas f
                  where f.id = factura_id and f.estado = 'activa'));

-- Storage: bucket privado, solo autenticado
create policy adjuntos_storage_select on storage.objects
  for select to authenticated using (bucket_id = 'facturas-adjuntos');
create policy adjuntos_storage_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'facturas-adjuntos');
create policy adjuntos_storage_delete on storage.objects
  for delete to authenticated using (bucket_id = 'facturas-adjuntos');

-- Permisos: nada para anónimos; sin DELETE sobre facturas
revoke all on public.gastos_compras, public.fuentes_recursos, public.metodos_pago,
              public.facturas, public.anulaciones, public.archivos_adjuntos
  from anon;
revoke delete, truncate on public.facturas, public.anulaciones from authenticated;

revoke execute on function
  public.anular_factura(uuid, text),
  public.reactivar_factura(uuid),
  public.resumen_gastos(date, date, smallint),
  public.gastos_por_periodo(text, date, date, smallint),
  public.gastos_por_categoria(date, date)
from public, anon;

grant execute on function
  public.anular_factura(uuid, text),
  public.reactivar_factura(uuid),
  public.resumen_gastos(date, date, smallint),
  public.gastos_por_periodo(text, date, date, smallint),
  public.gastos_por_categoria(date, date)
to authenticated;

commit;
