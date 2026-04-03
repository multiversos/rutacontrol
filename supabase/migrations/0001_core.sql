begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.app_role as enum ('admin', 'registrador');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'bus_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.bus_status as enum ('active', 'maintenance', 'inactive');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'daily_record_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.daily_record_status as enum ('draft', 'closed');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'expense_category'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.expense_category as enum ('fuel', 'worker_payment', 'other');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'audit_action'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.audit_action as enum ('create', 'update', 'delete', 'close');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(320) not null unique,
  name varchar(160) not null,
  role public.app_role not null default 'registrador',
  active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_name_not_blank check (char_length(trim(name)) > 0)
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  origin varchar(120) not null,
  destination varchar(120) not null,
  expected_income numeric(14,2),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint routes_name_not_blank check (char_length(trim(name)) > 0),
  constraint routes_origin_not_blank check (char_length(trim(origin)) > 0),
  constraint routes_destination_not_blank check (char_length(trim(destination)) > 0),
  constraint routes_unique_triplet unique (name, origin, destination)
);

create table if not exists public.buses (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) not null unique,
  plate varchar(20) not null unique,
  route_id uuid not null references public.routes (id) on delete restrict,
  status public.bus_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint buses_code_not_blank check (char_length(trim(code)) > 0),
  constraint buses_plate_not_blank check (char_length(trim(plate)) > 0)
);

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  record_date date not null,
  departure_time time not null,
  income_bs numeric(14,2) not null default 0 check (income_bs >= 0),
  exchange_rate numeric(14,6) not null check (exchange_rate > 0),
  income_usd numeric(14,2) not null default 0,
  fuel_cost numeric(14,2) not null default 0 check (fuel_cost >= 0),
  worker_payment numeric(14,2) not null default 0 check (worker_payment >= 0),
  other_expenses numeric(14,2) not null default 0 check (other_expenses >= 0),
  net_profit_usd numeric(14,2) not null default 0,
  calculated_net numeric(14,2) not null default 0,
  difference numeric(14,2) not null default 0,
  status public.daily_record_status not null default 'draft',
  closure_hash varchar(128),
  notes text,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint daily_records_one_bus_per_day unique (bus_id, record_date),
  constraint daily_records_closed_consistency check (
    (status = 'draft' and closed_at is null and closure_hash is null)
    or (status = 'closed' and closed_at is not null)
  )
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid not null references public.daily_records (id) on delete cascade,
  category public.expense_category not null,
  description varchar(255),
  amount_bs numeric(14,2) check (amount_bs is null or amount_bs >= 0),
  amount_usd numeric(14,2) not null default 0 check (amount_usd >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  table_name varchar(64) not null,
  record_id text not null,
  action public.audit_action not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_active on public.profiles (active);
create index if not exists idx_routes_active on public.routes (active);
create index if not exists idx_buses_route_id on public.buses (route_id);
create index if not exists idx_buses_status on public.buses (status);
create index if not exists idx_daily_records_bus_id on public.daily_records (bus_id);
create index if not exists idx_daily_records_user_id on public.daily_records (user_id);
create index if not exists idx_daily_records_record_date on public.daily_records (record_date desc);
create index if not exists idx_daily_records_status on public.daily_records (status);
create index if not exists idx_expenses_daily_record_id on public.expenses (daily_record_id);
create index if not exists idx_audit_log_table_name on public.audit_log (table_name);
create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin'::public.app_role, false);
$$;

create or replace function public.is_registrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'registrador'::public.app_role, false);
$$;

create or replace function public.touch_last_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_login = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.app_role := 'registrador';
  next_name text;
begin
  if (new.raw_user_meta_data ->> 'role') in ('admin', 'registrador') then
    next_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
  end if;

  next_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    initcap(replace(split_part(coalesce(new.email, ''), '@', 1), '.', ' ')),
    'Usuario RutaControl'
  );

  insert into public.profiles (id, email, name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    next_name,
    next_role,
    true
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(excluded.name, ''), public.profiles.name);

  return new;
end;
$$;

create or replace function public.handle_updated_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = coalesce(new.email, public.profiles.email),
      name = coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        public.profiles.name
      ),
      updated_at = timezone('utc', now())
  where id = new.id;

  return new;
end;
$$;

create or replace function public.recalculate_daily_record_totals()
returns trigger
language plpgsql
as $$
begin
  new.income_usd := round((new.income_bs / nullif(new.exchange_rate, 0))::numeric, 2);
  new.calculated_net := round(
    (
      new.income_usd
      - new.fuel_cost
      - new.worker_payment
      - new.other_expenses
    )::numeric,
    2
  );
  new.difference := round((new.net_profit_usd - new.calculated_net)::numeric, 2);

  if new.status = 'draft' then
    new.closed_at := null;
    new.closure_hash := null;
  elsif new.status = 'closed' and new.closed_at is null then
    new.closed_at := timezone('utc', now());
  end if;

  return new;
end;
$$;

create or replace function public.prevent_closed_daily_record_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'closed' then
    raise exception 'No se puede modificar un registro diario cerrado';
  end if;

  return old;
end;
$$;

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entry_action public.audit_action;
  entry_record_id text;
  old_status text;
  new_status text;
begin
  old_status := case
    when tg_op = 'INSERT' then ''
    else coalesce(to_jsonb(old) ->> 'status', '')
  end;

  new_status := case
    when tg_op = 'DELETE' then ''
    else coalesce(to_jsonb(new) ->> 'status', '')
  end;

  entry_action := case
    when tg_op = 'INSERT' then 'create'::public.audit_action
    when tg_op = 'UPDATE' and old_status is distinct from new_status and new_status = 'closed' then 'close'::public.audit_action
    when tg_op = 'UPDATE' then 'update'::public.audit_action
    when tg_op = 'DELETE' then 'delete'::public.audit_action
  end;

  entry_record_id := coalesce(
    case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    'unknown'
  );

  insert into public.audit_log (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    tg_table_name,
    entry_record_id,
    entry_action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_routes_set_updated_at on public.routes;
create trigger trg_routes_set_updated_at
before update on public.routes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_buses_set_updated_at on public.buses;
create trigger trg_buses_set_updated_at
before update on public.buses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_daily_records_set_updated_at on public.daily_records;
create trigger trg_daily_records_set_updated_at
before update on public.daily_records
for each row
execute function public.set_updated_at();

drop trigger if exists trg_expenses_set_updated_at on public.expenses;
create trigger trg_expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

drop trigger if exists trg_auth_user_updated on auth.users;
create trigger trg_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute function public.handle_updated_auth_user();

drop trigger if exists trg_daily_records_recalculate on public.daily_records;
create trigger trg_daily_records_recalculate
before insert or update on public.daily_records
for each row
execute function public.recalculate_daily_record_totals();

drop trigger if exists trg_daily_records_prevent_update_when_closed on public.daily_records;
create trigger trg_daily_records_prevent_update_when_closed
before update or delete on public.daily_records
for each row
when (old.status = 'closed')
execute function public.prevent_closed_daily_record_mutation();

drop trigger if exists trg_routes_audit on public.routes;
create trigger trg_routes_audit
after insert or update or delete on public.routes
for each row
execute function public.log_audit_event();

drop trigger if exists trg_buses_audit on public.buses;
create trigger trg_buses_audit
after insert or update or delete on public.buses
for each row
execute function public.log_audit_event();

drop trigger if exists trg_daily_records_audit on public.daily_records;
create trigger trg_daily_records_audit
after insert or update or delete on public.daily_records
for each row
execute function public.log_audit_event();

drop trigger if exists trg_expenses_audit on public.expenses;
create trigger trg_expenses_audit
after insert or update or delete on public.expenses
for each row
execute function public.log_audit_event();

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.routes to authenticated;
grant select, insert, update, delete on table public.buses to authenticated;
grant select, insert, update, delete on table public.daily_records to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select on table public.audit_log to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_registrador() to authenticated;
grant execute on function public.touch_last_login() to authenticated;

alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.buses enable row level security;
alter table public.daily_records enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "routes_select_active_users" on public.routes;
create policy "routes_select_active_users"
on public.routes
for select
to authenticated
using (public.is_active_user());

drop policy if exists "routes_admin_write" on public.routes;
create policy "routes_admin_write"
on public.routes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "buses_select_active_users" on public.buses;
create policy "buses_select_active_users"
on public.buses
for select
to authenticated
using (public.is_active_user());

drop policy if exists "buses_admin_write" on public.buses;
create policy "buses_admin_write"
on public.buses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "daily_records_select_scope" on public.daily_records;
create policy "daily_records_select_scope"
on public.daily_records
for select
to authenticated
using (
  public.is_admin()
  or (
    public.is_registrador()
    and user_id = auth.uid()
  )
);

drop policy if exists "daily_records_insert_scope" on public.daily_records;
create policy "daily_records_insert_scope"
on public.daily_records
for insert
to authenticated
with check (
  status = 'draft'
  and (
    public.is_admin()
    or (
      public.is_registrador()
      and user_id = auth.uid()
    )
  )
);

drop policy if exists "daily_records_update_scope" on public.daily_records;
create policy "daily_records_update_scope"
on public.daily_records
for update
to authenticated
using (
  status = 'draft'
  and (
    public.is_admin()
    or (
      public.is_registrador()
      and user_id = auth.uid()
    )
  )
)
with check (
  status = 'draft'
  and (
    public.is_admin()
    or (
      public.is_registrador()
      and user_id = auth.uid()
    )
  )
);

drop policy if exists "daily_records_delete_admin_only" on public.daily_records;
create policy "daily_records_delete_admin_only"
on public.daily_records
for delete
to authenticated
using (
  public.is_admin()
  and status = 'draft'
);

drop policy if exists "expenses_select_scope" on public.expenses;
create policy "expenses_select_scope"
on public.expenses
for select
to authenticated
using (
  exists (
    select 1
    from public.daily_records dr
    where dr.id = expenses.daily_record_id
      and (
        public.is_admin()
        or (
          public.is_registrador()
          and dr.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "expenses_insert_scope" on public.expenses;
create policy "expenses_insert_scope"
on public.expenses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.daily_records dr
    where dr.id = expenses.daily_record_id
      and dr.status = 'draft'
      and (
        public.is_admin()
        or (
          public.is_registrador()
          and dr.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "expenses_update_scope" on public.expenses;
create policy "expenses_update_scope"
on public.expenses
for update
to authenticated
using (
  exists (
    select 1
    from public.daily_records dr
    where dr.id = expenses.daily_record_id
      and dr.status = 'draft'
      and (
        public.is_admin()
        or (
          public.is_registrador()
          and dr.user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.daily_records dr
    where dr.id = expenses.daily_record_id
      and dr.status = 'draft'
      and (
        public.is_admin()
        or (
          public.is_registrador()
          and dr.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "expenses_delete_scope" on public.expenses;
create policy "expenses_delete_scope"
on public.expenses
for delete
to authenticated
using (
  exists (
    select 1
    from public.daily_records dr
    where dr.id = expenses.daily_record_id
      and dr.status = 'draft'
      and (
        public.is_admin()
        or (
          public.is_registrador()
          and dr.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin"
on public.audit_log
for select
to authenticated
using (public.is_admin());

commit;
