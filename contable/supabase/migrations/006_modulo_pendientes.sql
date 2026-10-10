-- =============================================================
-- Migración 006: Módulo de Pendientes
-- Tablas: pendientes, actividades_realizadas
-- =============================================================

-- ─── Tabla principal de pendientes ───
create table if not exists public.pendientes (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('CUENTA_POR_PAGAR', 'CUENTA_POR_COBRAR', 'NOTA')),
  descripcion text not null check (trim(descripcion) <> ''),
  valor       numeric(15,2),  -- solo aplica para cuentas por pagar/cobrar; NULL para notas
  cumplido    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Para cuentas por pagar y cobrar el valor es obligatorio
  constraint chk_valor_requerido check (
    (tipo = 'NOTA') or (valor is not null and valor > 0)
  )
);

comment on table public.pendientes is 'Aspectos pendientes: cuentas por pagar, cobrar y notas.';

-- ─── Tabla de actividades realizadas (historial de cumplimiento) ───
create table if not exists public.actividades_realizadas (
  id             uuid primary key default gen_random_uuid(),
  pendiente_id   uuid not null references public.pendientes(id) on delete cascade,
  tipo_actividad text not null check (tipo_actividad in ('CUENTA_POR_PAGAR', 'CUENTA_POR_COBRAR', 'NOTA')),
  descripcion    text not null,
  valor          numeric(15,2),  -- copia del valor al momento de cumplir
  fecha_cumplida timestamptz not null default now()
);

comment on table public.actividades_realizadas is 'Registro histórico de pendientes cumplidos.';

-- ─── Trigger: actualizar updated_at automáticamente ───
create or replace function public.trg_pendientes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pendientes_updated_at
  before update on public.pendientes
  for each row execute function public.trg_pendientes_updated_at();

-- ─── Trigger: al marcar cumplido, registrar en actividades_realizadas ───
create or replace function public.trg_registrar_actividad_cumplida()
returns trigger as $$
begin
  if new.cumplido = true and old.cumplido = false then
    insert into public.actividades_realizadas (pendiente_id, tipo_actividad, descripcion, valor)
    values (new.id, new.tipo, new.descripcion, new.valor);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger registrar_actividad_cumplida
  after update on public.pendientes
  for each row execute function public.trg_registrar_actividad_cumplida();

-- ─── RLS ───
alter table public.pendientes enable row level security;
alter table public.actividades_realizadas enable row level security;

-- Permitir todo a usuarios autenticados (app mono-usuario)
create policy "pendientes_all" on public.pendientes
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "actividades_all" on public.actividades_realizadas
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ─── Índices ───
create index if not exists idx_pendientes_tipo on public.pendientes(tipo);
create index if not exists idx_pendientes_cumplido on public.pendientes(cumplido);
create index if not exists idx_actividades_fecha on public.actividades_realizadas(fecha_cumplida desc);
