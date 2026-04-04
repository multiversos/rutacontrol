begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'maintenance_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.maintenance_type as enum (
      'oil_change',
      'brake_pads',
      'filters',
      'spare_parts',
      'general_service',
      'other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'maintenance_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.maintenance_status as enum (
      'up_to_date',
      'due_soon',
      'overdue'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'maintenance_component_position'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.maintenance_component_position as enum (
      'front_left',
      'front_right',
      'rear_left',
      'rear_right'
    );
  end if;
end
$$;

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses (id) on delete cascade,
  maintenance_type public.maintenance_type not null,
  service_date date not null default (timezone('America/Caracas', now()))::date,
  provider varchar(160) not null,
  description text not null,
  total_cost_usd numeric(14, 2) not null,
  expected_work_days integer,
  previous_cycle_work_days integer,
  debt_id uuid references public.debts (id) on delete set null,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_records_provider_not_blank check (char_length(trim(provider)) > 0),
  constraint maintenance_records_description_not_blank check (char_length(trim(description)) > 0),
  constraint maintenance_records_cost_positive check (total_cost_usd > 0),
  constraint maintenance_records_expected_days_positive check (
    expected_work_days is null or expected_work_days > 0
  ),
  constraint maintenance_records_previous_cycle_nonnegative check (
    previous_cycle_work_days is null or previous_cycle_work_days >= 0
  )
);

create index if not exists idx_maintenance_records_bus_id on public.maintenance_records (bus_id);
create index if not exists idx_maintenance_records_service_date on public.maintenance_records (service_date desc);
create index if not exists idx_maintenance_records_type on public.maintenance_records (maintenance_type);
create index if not exists idx_maintenance_records_debt_id on public.maintenance_records (debt_id);

create table if not exists public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  maintenance_record_id uuid not null references public.maintenance_records (id) on delete cascade,
  component_name text not null,
  component_position public.maintenance_component_position,
  cost_usd numeric(14, 2) not null,
  expected_work_days integer,
  previous_cycle_work_days integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_items_component_name_not_blank check (char_length(trim(component_name)) > 0),
  constraint maintenance_items_cost_nonnegative check (cost_usd >= 0),
  constraint maintenance_items_expected_days_positive check (
    expected_work_days is null or expected_work_days > 0
  ),
  constraint maintenance_items_previous_cycle_nonnegative check (
    previous_cycle_work_days is null or previous_cycle_work_days >= 0
  )
);

create index if not exists idx_maintenance_items_record_id on public.maintenance_items (maintenance_record_id);
create index if not exists idx_maintenance_items_position on public.maintenance_items (component_position);
create unique index if not exists idx_maintenance_items_unique_position_per_record
  on public.maintenance_items (maintenance_record_id, component_position)
  where component_position is not null;

create or replace function public.bus_worked_days_since(
  _bus_id uuid,
  _service_date date,
  _until_date date default (timezone('America/Caracas', now()))::date
)
returns integer
language sql
stable
set search_path = public
as $$
  select count(*)
  from (
    select distinct dr.record_date
    from public.daily_records dr
    where dr.bus_id = _bus_id
      and dr.status = 'closed'
      and dr.record_date > _service_date
      and dr.record_date <= coalesce(_until_date, (timezone('America/Caracas', now()))::date)
  ) worked_days;
$$;

create or replace function public.get_maintenance_status(
  _worked_days integer,
  _expected_work_days integer
)
returns public.maintenance_status
language plpgsql
immutable
set search_path = public
as $$
declare
  due_soon_window integer;
begin
  if _expected_work_days is null or _expected_work_days <= 0 then
    return 'up_to_date'::public.maintenance_status;
  end if;

  if coalesce(_worked_days, 0) >= _expected_work_days then
    return 'overdue'::public.maintenance_status;
  end if;

  due_soon_window := greatest(3, ceil(_expected_work_days * 0.10)::integer);

  if (_expected_work_days - coalesce(_worked_days, 0)) <= due_soon_window then
    return 'due_soon'::public.maintenance_status;
  end if;

  return 'up_to_date'::public.maintenance_status;
end;
$$;

create or replace function public.current_maintenance_cycles(
  _record_date date default (timezone('America/Caracas', now()))::date
)
returns table (
  maintenance_record_id uuid,
  maintenance_item_id uuid,
  bus_id uuid,
  maintenance_type public.maintenance_type,
  service_date date,
  provider text,
  description text,
  total_cost_usd numeric,
  debt_id uuid,
  component_name text,
  component_position public.maintenance_component_position,
  expected_work_days integer,
  worked_days integer,
  status public.maintenance_status,
  previous_cycle_work_days integer
)
language sql
stable
set search_path = public
as $$
  with latest_record_cycles as (
    select
      mr.id as maintenance_record_id,
      null::uuid as maintenance_item_id,
      mr.bus_id,
      mr.maintenance_type,
      mr.service_date,
      mr.provider::text as provider,
      mr.description::text as description,
      mr.total_cost_usd,
      mr.debt_id,
      null::text as component_name,
      null::public.maintenance_component_position as component_position,
      mr.expected_work_days,
      mr.previous_cycle_work_days,
      row_number() over (
        partition by mr.bus_id, mr.maintenance_type
        order by mr.service_date desc, mr.created_at desc, mr.id desc
      ) as row_number_value
    from public.maintenance_records mr
    join public.buses b
      on b.id = mr.bus_id
     and b.status = 'active'
    where mr.expected_work_days is not null
      and not exists (
        select 1
        from public.maintenance_items mi
        where mi.maintenance_record_id = mr.id
          and mi.expected_work_days is not null
      )
  ),
  latest_item_cycles as (
    select
      mr.id as maintenance_record_id,
      mi.id as maintenance_item_id,
      mr.bus_id,
      mr.maintenance_type,
      mr.service_date,
      mr.provider::text as provider,
      mr.description::text as description,
      mr.total_cost_usd,
      mr.debt_id,
      mi.component_name,
      mi.component_position,
      mi.expected_work_days,
      mi.previous_cycle_work_days,
      row_number() over (
        partition by mr.bus_id, mr.maintenance_type, mi.component_name, mi.component_position
        order by mr.service_date desc, mr.created_at desc, mi.created_at desc, mi.id desc
      ) as row_number_value
    from public.maintenance_items mi
    join public.maintenance_records mr
      on mr.id = mi.maintenance_record_id
    join public.buses b
      on b.id = mr.bus_id
     and b.status = 'active'
    where mi.expected_work_days is not null
  ),
  cycles as (
    select
      maintenance_record_id,
      maintenance_item_id,
      bus_id,
      maintenance_type,
      service_date,
      provider,
      description,
      total_cost_usd,
      debt_id,
      component_name,
      component_position,
      expected_work_days,
      previous_cycle_work_days
    from latest_record_cycles
    where row_number_value = 1

    union all

    select
      maintenance_record_id,
      maintenance_item_id,
      bus_id,
      maintenance_type,
      service_date,
      provider,
      description,
      total_cost_usd,
      debt_id,
      component_name,
      component_position,
      expected_work_days,
      previous_cycle_work_days
    from latest_item_cycles
    where row_number_value = 1
  ),
  cycle_with_days as (
    select
      cycles.*,
      public.bus_worked_days_since(cycles.bus_id, cycles.service_date, _record_date) as worked_days
    from cycles
  )
  select
    cycle_with_days.maintenance_record_id,
    cycle_with_days.maintenance_item_id,
    cycle_with_days.bus_id,
    cycle_with_days.maintenance_type,
    cycle_with_days.service_date,
    cycle_with_days.provider,
    cycle_with_days.description,
    cycle_with_days.total_cost_usd,
    cycle_with_days.debt_id,
    cycle_with_days.component_name,
    cycle_with_days.component_position,
    cycle_with_days.expected_work_days,
    cycle_with_days.worked_days,
    public.get_maintenance_status(
      cycle_with_days.worked_days,
      cycle_with_days.expected_work_days
    ) as status,
    cycle_with_days.previous_cycle_work_days
  from cycle_with_days;
$$;

create or replace function public.create_maintenance_record(
  _bus_id uuid,
  _maintenance_type public.maintenance_type,
  _service_date date,
  _provider text,
  _description text,
  _total_cost_usd numeric,
  _expected_work_days integer default null,
  _notes text default null,
  _debt_creditor text default null,
  _debt_amount_usd numeric default null,
  _debt_due_date date default null,
  _items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  linked_debt_id uuid;
  maintenance_id uuid := gen_random_uuid();
  normalized_items jsonb := coalesce(_items, '[]'::jsonb);
  item jsonb;
  item_name text;
  item_position public.maintenance_component_position;
  item_cost numeric(14, 2);
  item_expected_days integer;
  item_notes text;
  previous_record_date date;
  previous_item_date date;
  previous_cycle_days integer;
begin
  actor_id := auth.uid();

  if actor_id is null or not public.is_admin() then
    raise exception 'Solo el admin puede registrar mantenimiento.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.buses
    where id = _bus_id
  ) then
    raise exception 'El bus seleccionado no existe.'
      using errcode = '23503';
  end if;

  if _total_cost_usd is null or round(_total_cost_usd, 2) <= 0 then
    raise exception 'El costo total del mantenimiento debe ser mayor a cero.'
      using errcode = '23514';
  end if;

  if _expected_work_days is not null and _expected_work_days <= 0 then
    raise exception 'El umbral de dias trabajados debe ser mayor a cero.'
      using errcode = '23514';
  end if;

  if jsonb_typeof(normalized_items) <> 'array' then
    raise exception 'Los componentes del mantenimiento deben recibirse como un arreglo.'
      using errcode = '22023';
  end if;

  if _maintenance_type = 'brake_pads'::public.maintenance_type
    and jsonb_array_length(normalized_items) = 0 then
    raise exception 'Las bandas de freno requieren detalle por rueda.'
      using errcode = '23514';
  end if;

  if _debt_amount_usd is not null then
    if _debt_amount_usd <= 0 or _debt_amount_usd > round(_total_cost_usd, 2) then
      raise exception 'La deuda asociada debe ser positiva y no puede exceder el costo total.'
        using errcode = '23514';
    end if;

    if nullif(trim(coalesce(_debt_creditor, '')), '') is null then
      raise exception 'Indica el acreedor o taller para asociar la deuda del mantenimiento.'
        using errcode = '23514';
    end if;

    insert into public.debts (
      creditor,
      description,
      amount_usd,
      due_date,
      created_by
    )
    values (
      trim(_debt_creditor),
      format(
        'Deuda asociada al mantenimiento %s del bus %s: %s',
        replace(_maintenance_type::text, '_', ' '),
        _bus_id,
        trim(_description)
      ),
      round(_debt_amount_usd, 2),
      _debt_due_date,
      actor_id
    )
    returning id into linked_debt_id;
  end if;

  select service_date
  into previous_record_date
  from public.maintenance_records mr
  where mr.bus_id = _bus_id
    and mr.maintenance_type = _maintenance_type
    and mr.service_date < _service_date
  order by mr.service_date desc, mr.created_at desc, mr.id desc
  limit 1;

  if previous_record_date is not null then
    previous_cycle_days := public.bus_worked_days_since(
      _bus_id,
      previous_record_date,
      (_service_date - 1)
    );
  else
    previous_cycle_days := null;
  end if;

  insert into public.maintenance_records (
    id,
    bus_id,
    maintenance_type,
    service_date,
    provider,
    description,
    total_cost_usd,
    expected_work_days,
    previous_cycle_work_days,
    debt_id,
    notes,
    created_by
  )
  values (
    maintenance_id,
    _bus_id,
    _maintenance_type,
    _service_date,
    trim(_provider),
    trim(_description),
    round(_total_cost_usd, 2),
    _expected_work_days,
    previous_cycle_days,
    linked_debt_id,
    nullif(trim(coalesce(_notes, '')), ''),
    actor_id
  );

  for item in
    select value
    from jsonb_array_elements(normalized_items)
  loop
    item_name := nullif(trim(coalesce(item ->> 'componentName', '')), '');
    item_notes := nullif(trim(coalesce(item ->> 'notes', '')), '');

    if item_name is null and _maintenance_type = 'brake_pads'::public.maintenance_type then
      item_name := 'Bandas de freno';
    elsif item_name is null then
      raise exception 'Cada componente del mantenimiento debe indicar un nombre.'
        using errcode = '23514';
    end if;

    if nullif(trim(coalesce(item ->> 'componentPosition', '')), '') is not null then
      item_position := (item ->> 'componentPosition')::public.maintenance_component_position;
    else
      item_position := null;
    end if;

    if _maintenance_type = 'brake_pads'::public.maintenance_type and item_position is null then
      raise exception 'Cada rueda de bandas de freno debe indicar su posicion.'
        using errcode = '23514';
    end if;

    item_cost := round(coalesce(nullif(trim(coalesce(item ->> 'costUsd', '')), '')::numeric, 0), 2);

    if item_cost <= 0 then
      raise exception 'Cada componente del mantenimiento debe indicar un costo valido.'
        using errcode = '23514';
    end if;

    if nullif(trim(coalesce(item ->> 'expectedWorkDays', '')), '') is not null then
      item_expected_days := (item ->> 'expectedWorkDays')::integer;
    else
      item_expected_days := null;
    end if;

    if item_expected_days is not null and item_expected_days <= 0 then
      raise exception 'La duracion esperada por componente debe ser mayor a cero.'
        using errcode = '23514';
    end if;

    select mr.service_date
    into previous_item_date
    from public.maintenance_items mi
    join public.maintenance_records mr
      on mr.id = mi.maintenance_record_id
    where mr.bus_id = _bus_id
      and mr.maintenance_type = _maintenance_type
      and mi.component_name = item_name
      and mi.component_position is not distinct from item_position
      and mr.service_date < _service_date
    order by mr.service_date desc, mr.created_at desc, mi.created_at desc, mi.id desc
    limit 1;

    if previous_item_date is not null then
      previous_cycle_days := public.bus_worked_days_since(
        _bus_id,
        previous_item_date,
        (_service_date - 1)
      );
    else
      previous_cycle_days := null;
    end if;

    insert into public.maintenance_items (
      maintenance_record_id,
      component_name,
      component_position,
      cost_usd,
      expected_work_days,
      previous_cycle_work_days,
      notes
    )
    values (
      maintenance_id,
      item_name,
      item_position,
      item_cost,
      item_expected_days,
      previous_cycle_days,
      item_notes
    );
  end loop;

  return maintenance_id;
end;
$$;

grant execute on function public.bus_worked_days_since(uuid, date, date) to authenticated;
grant execute on function public.get_maintenance_status(integer, integer) to authenticated;
grant execute on function public.current_maintenance_cycles(date) to authenticated;
grant execute on function public.create_maintenance_record(
  uuid,
  public.maintenance_type,
  date,
  text,
  text,
  numeric,
  integer,
  text,
  text,
  numeric,
  date,
  jsonb
) to authenticated;

alter table public.maintenance_records enable row level security;
alter table public.maintenance_items enable row level security;

drop policy if exists "maintenance_records_admin_select" on public.maintenance_records;
create policy "maintenance_records_admin_select"
on public.maintenance_records
for select
to authenticated
using (public.is_admin());

drop policy if exists "maintenance_records_admin_write" on public.maintenance_records;
create policy "maintenance_records_admin_write"
on public.maintenance_records
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "maintenance_items_admin_select" on public.maintenance_items;
create policy "maintenance_items_admin_select"
on public.maintenance_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "maintenance_items_admin_write" on public.maintenance_items;
create policy "maintenance_items_admin_write"
on public.maintenance_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists trg_maintenance_records_set_updated_at on public.maintenance_records;
create trigger trg_maintenance_records_set_updated_at
before update on public.maintenance_records
for each row
execute function public.set_updated_at();

drop trigger if exists trg_maintenance_items_set_updated_at on public.maintenance_items;
create trigger trg_maintenance_items_set_updated_at
before update on public.maintenance_items
for each row
execute function public.set_updated_at();

commit;
