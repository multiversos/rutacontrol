begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'alert_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.alert_type as enum ('login', 'closure', 'difference', 'missing');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'alert_severity'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.alert_severity as enum ('info', 'warning', 'critical');
  end if;
end
$$;

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid references public.daily_records (id) on delete set null,
  bus_id uuid references public.buses (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  alert_type public.alert_type not null,
  severity public.alert_severity not null,
  message text not null,
  read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  created_at timestamptz not null default timezone('utc', now()),
  constraint alerts_message_not_blank check (char_length(trim(message)) > 0),
  constraint alerts_read_consistency check (
    (read = false and read_at is null)
    or (read = true and read_at is not null)
  )
);

create index if not exists idx_alerts_created_at on public.alerts (created_at desc);
create index if not exists idx_alerts_read on public.alerts (read);
create index if not exists idx_alerts_severity on public.alerts (severity);
create index if not exists idx_alerts_type on public.alerts (alert_type);
create index if not exists idx_alerts_bus_id on public.alerts (bus_id);
create index if not exists idx_alerts_daily_record_id on public.alerts (daily_record_id);

create or replace function public.get_difference_alert_severity(_difference numeric)
returns public.alert_severity
language sql
immutable
as $$
  select case
    when abs(coalesce(_difference, 0)) >= 10 then 'critical'::public.alert_severity
    when abs(coalesce(_difference, 0)) >= 0.01 then 'warning'::public.alert_severity
    else 'info'::public.alert_severity
  end;
$$;

create or replace function public.upsert_alert(
  _alert_type public.alert_type,
  _severity public.alert_severity,
  _message text,
  _daily_record_id uuid default null,
  _bus_id uuid default null,
  _profile_id uuid default null,
  _dedupe_key text default null,
  _metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  alert_id uuid;
begin
  insert into public.alerts (
    daily_record_id,
    bus_id,
    profile_id,
    alert_type,
    severity,
    message,
    metadata,
    dedupe_key
  )
  values (
    _daily_record_id,
    _bus_id,
    _profile_id,
    _alert_type,
    _severity,
    _message,
    coalesce(_metadata, '{}'::jsonb),
    _dedupe_key
  )
  on conflict (dedupe_key) do update
    set daily_record_id = excluded.daily_record_id,
        bus_id = excluded.bus_id,
        profile_id = excluded.profile_id,
        severity = excluded.severity,
        message = excluded.message,
        metadata = excluded.metadata
  returning id into alert_id;

  return alert_id;
end;
$$;

create or replace function public.create_login_alert()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  alert_id uuid;
begin
  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and active = true
  limit 1;

  if actor_profile.id is null or actor_profile.role <> 'registrador' then
    return null;
  end if;

  alert_id := public.upsert_alert(
    'login'::public.alert_type,
    'info'::public.alert_severity,
    format(
      'El registrador %s inicio sesion correctamente.',
      actor_profile.name
    ),
    null,
    null,
    actor_profile.id,
    null,
    jsonb_build_object(
      'email', actor_profile.email,
      'role', actor_profile.role,
      'user_id', actor_profile.id
    )
  );

  return alert_id;
end;
$$;

create or replace function public.notify_daily_record_alerts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bus_code text;
  difference_severity public.alert_severity;
begin
  if new.status <> 'closed' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'closed' then
    return new;
  end if;

  select code
  into bus_code
  from public.buses
  where id = new.bus_id;

  perform public.upsert_alert(
    'closure'::public.alert_type,
    'info'::public.alert_severity,
    format(
      'Cierre diario completado para el bus %s el %s.',
      coalesce(bus_code, new.bus_id::text),
      to_char(new.record_date, 'YYYY-MM-DD')
    ),
    new.id,
    new.bus_id,
    new.user_id,
    format('closure:%s', new.id),
    jsonb_build_object(
      'record_date', new.record_date,
      'difference', new.difference,
      'status', new.status
    )
  );

  if abs(coalesce(new.difference, 0)) >= 0.01 then
    difference_severity := public.get_difference_alert_severity(new.difference);

    perform public.upsert_alert(
      'difference'::public.alert_type,
      difference_severity,
      format(
        'Diferencia de caja de %s USD en el cierre del bus %s para %s.',
        to_char(abs(new.difference), 'FM999999999990D00'),
        coalesce(bus_code, new.bus_id::text),
        to_char(new.record_date, 'YYYY-MM-DD')
      ),
      new.id,
      new.bus_id,
      new.user_id,
      format('difference:%s', new.id),
      jsonb_build_object(
        'difference', new.difference,
        'record_date', new.record_date,
        'severity_rule', 'warning < 10 USD, critical >= 10 USD',
        'status', new.status
      )
    );
  end if;

  return new;
end;
$$;

create or replace function public.reconcile_missing_closure_alerts(
  _record_date date default (timezone('America/Caracas', now()))::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer := 0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Solo el admin puede reconciliar alertas operativas.'
      using errcode = '42501';
  end if;

  delete from public.alerts alerts_to_remove
  where alerts_to_remove.alert_type = 'missing'
    and alerts_to_remove.metadata ->> 'record_date' = _record_date::text
    and not exists (
      select 1
      from public.buses b
      left join public.daily_records dr
        on dr.bus_id = b.id
       and dr.record_date = _record_date
      where b.id = alerts_to_remove.bus_id
        and b.status = 'active'
        and (
          dr.id is null
          or dr.status <> 'closed'
        )
    );

  with missing_rows as (
    select
      b.id as bus_id,
      b.code as bus_code,
      dr.id as daily_record_id,
      dr.status as record_status
    from public.buses b
    left join public.daily_records dr
      on dr.bus_id = b.id
     and dr.record_date = _record_date
    where b.status = 'active'
      and (
        dr.id is null
        or dr.status <> 'closed'
      )
  ),
  inserted as (
    select public.upsert_alert(
      'missing'::public.alert_type,
      'warning'::public.alert_severity,
      case
        when missing_rows.daily_record_id is null then
          format(
            'El bus %s sigue sin registro para la fecha %s.',
            missing_rows.bus_code,
            to_char(_record_date, 'YYYY-MM-DD')
          )
        else
          format(
            'El bus %s sigue sin cierre para la fecha %s.',
            missing_rows.bus_code,
            to_char(_record_date, 'YYYY-MM-DD')
          )
      end,
      missing_rows.daily_record_id,
      missing_rows.bus_id,
      null,
      format('missing:%s:%s', missing_rows.bus_id, _record_date),
      jsonb_build_object(
        'record_date', _record_date,
        'status', coalesce(missing_rows.record_status, 'missing')
      )
    ) as alert_id
    from missing_rows
  )
  select count(*)
  into affected_count
  from inserted;

  return affected_count;
end;
$$;

grant select, update on table public.alerts to authenticated;
grant execute on function public.create_login_alert() to authenticated;
grant execute on function public.reconcile_missing_closure_alerts(date) to authenticated;

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_admin" on public.alerts;
create policy "alerts_select_admin"
on public.alerts
for select
to authenticated
using (public.is_admin());

drop policy if exists "alerts_update_admin" on public.alerts;
create policy "alerts_update_admin"
on public.alerts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists trg_daily_records_alerts on public.daily_records;
create trigger trg_daily_records_alerts
after insert or update on public.daily_records
for each row
execute function public.notify_daily_record_alerts();

commit;
