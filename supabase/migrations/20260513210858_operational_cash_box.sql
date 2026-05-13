begin;

alter table public.debt_payments
  add column if not exists paid_from_operational_cash boolean not null default false;

create table if not exists public.operational_cash_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  type text not null,
  direction text not null,
  amount_usd numeric(14, 2) not null,
  description text not null,
  daily_record_id uuid references public.daily_records (id) on delete set null,
  debt_payment_id uuid references public.debt_payments (id) on delete set null,
  bus_id uuid references public.buses (id) on delete set null,
  debt_id uuid references public.debts (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint operational_cash_movements_type_check check (
    type in ('daily_net', 'debt_payment', 'manual_adjustment')
  ),
  constraint operational_cash_movements_direction_check check (
    direction in ('in', 'out', 'adjustment')
  ),
  constraint operational_cash_movements_description_not_blank check (
    char_length(trim(description)) > 0
  ),
  constraint operational_cash_movements_amount_direction_check check (
    (
      direction in ('in', 'out')
      and amount_usd >= 0
    )
    or direction = 'adjustment'
  )
);

create index if not exists idx_operational_cash_movements_date
on public.operational_cash_movements (movement_date desc, created_at desc);

create index if not exists idx_operational_cash_movements_type
on public.operational_cash_movements (type);

create index if not exists idx_operational_cash_movements_bus_id
on public.operational_cash_movements (bus_id);

create index if not exists idx_operational_cash_movements_debt_id
on public.operational_cash_movements (debt_id);

create unique index if not exists operational_cash_movements_daily_record_once
on public.operational_cash_movements (daily_record_id)
where type = 'daily_net' and daily_record_id is not null;

create unique index if not exists operational_cash_movements_debt_payment_once
on public.operational_cash_movements (debt_payment_id)
where type = 'debt_payment' and debt_payment_id is not null;

drop trigger if exists trg_operational_cash_movements_set_updated_at
on public.operational_cash_movements;
create trigger trg_operational_cash_movements_set_updated_at
before update on public.operational_cash_movements
for each row
execute function public.set_updated_at();

create or replace function public.sync_operational_cash_from_daily_record(
  _record_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  movement_id uuid;
  net_amount numeric(14, 2);
  record_row record;
begin
  actor_id := auth.uid();

  select
    dr.id,
    dr.bus_id,
    dr.user_id,
    dr.record_date,
    dr.status,
    round(coalesce(dr.calculated_net, 0), 2) as calculated_net,
    b.code as bus_code
  into record_row
  from public.daily_records dr
  left join public.buses b on b.id = dr.bus_id
  where dr.id = _record_id;

  if record_row.id is null then
    raise exception 'No se encontro el registro diario para sincronizar caja.'
      using errcode = '23503';
  end if;

  if actor_id is not null
    and not (
      public.is_admin()
      or (
        public.is_active_user()
        and record_row.user_id = actor_id
      )
    ) then
    raise exception 'No tienes permisos para sincronizar este movimiento de caja.'
      using errcode = '42501';
  end if;

  if record_row.status <> 'closed' then
    update public.operational_cash_movements
    set direction = 'adjustment',
        amount_usd = 0,
        movement_date = record_row.record_date,
        description = format(
          'Registro diario sin impacto en Caja operativa: Bus %s - %s',
          coalesce(record_row.bus_code, record_row.bus_id::text),
          to_char(record_row.record_date, 'YYYY-MM-DD')
        ),
        bus_id = record_row.bus_id,
        created_by = record_row.user_id,
        updated_at = timezone('utc', now())
    where daily_record_id = record_row.id
      and type = 'daily_net'
    returning id into movement_id;

    return movement_id;
  end if;

  net_amount := record_row.calculated_net;

  insert into public.operational_cash_movements (
    movement_date,
    type,
    direction,
    amount_usd,
    description,
    daily_record_id,
    bus_id,
    created_by
  )
  values (
    record_row.record_date,
    'daily_net',
    case when net_amount < 0 then 'out' else 'in' end,
    abs(net_amount),
    format(
      case
        when net_amount < 0 then 'Neto diario negativo: Bus %s - %s'
        else 'Neto diario: Bus %s - %s'
      end,
      coalesce(record_row.bus_code, record_row.bus_id::text),
      to_char(record_row.record_date, 'YYYY-MM-DD')
    ),
    record_row.id,
    record_row.bus_id,
    record_row.user_id
  )
  on conflict (daily_record_id)
  where type = 'daily_net' and daily_record_id is not null
  do update
  set movement_date = excluded.movement_date,
      direction = excluded.direction,
      amount_usd = excluded.amount_usd,
      description = excluded.description,
      bus_id = excluded.bus_id,
      created_by = excluded.created_by,
      updated_at = timezone('utc', now())
  returning id into movement_id;

  return movement_id;
end;
$$;

create or replace function public.sync_operational_cash_from_debt_payment(
  _payment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  movement_id uuid;
  payment_row record;
begin
  actor_id := auth.uid();

  if actor_id is not null and not public.is_admin() then
    raise exception 'Solo el admin puede sincronizar pagos de deuda con Caja operativa.'
      using errcode = '42501';
  end if;

  select
    dp.id,
    dp.debt_id,
    dp.amount_usd,
    dp.payment_date,
    dp.created_by,
    dp.paid_from_operational_cash,
    d.bus_id,
    d.creditor,
    d.description as debt_description
  into payment_row
  from public.debt_payments dp
  join public.debts d on d.id = dp.debt_id
  where dp.id = _payment_id;

  if payment_row.id is null then
    raise exception 'No se encontro el pago de deuda para sincronizar caja.'
      using errcode = '23503';
  end if;

  if not payment_row.paid_from_operational_cash then
    update public.operational_cash_movements
    set direction = 'adjustment',
        amount_usd = 0,
        movement_date = payment_row.payment_date,
        description = format(
          'Pago de deuda sin impacto en Caja operativa: %s',
          coalesce(nullif(trim(payment_row.creditor), ''), payment_row.debt_id::text)
        ),
        debt_id = payment_row.debt_id,
        bus_id = payment_row.bus_id,
        created_by = payment_row.created_by,
        updated_at = timezone('utc', now())
    where debt_payment_id = payment_row.id
      and type = 'debt_payment'
    returning id into movement_id;

    return movement_id;
  end if;

  insert into public.operational_cash_movements (
    movement_date,
    type,
    direction,
    amount_usd,
    description,
    debt_payment_id,
    bus_id,
    debt_id,
    created_by
  )
  values (
    payment_row.payment_date,
    'debt_payment',
    'out',
    round(payment_row.amount_usd, 2),
    format(
      'Pago de deuda: %s',
      coalesce(
        nullif(trim(payment_row.debt_description), ''),
        nullif(trim(payment_row.creditor), ''),
        payment_row.debt_id::text
      )
    ),
    payment_row.id,
    payment_row.bus_id,
    payment_row.debt_id,
    payment_row.created_by
  )
  on conflict (debt_payment_id)
  where type = 'debt_payment' and debt_payment_id is not null
  do update
  set movement_date = excluded.movement_date,
      direction = excluded.direction,
      amount_usd = excluded.amount_usd,
      description = excluded.description,
      debt_id = excluded.debt_id,
      bus_id = excluded.bus_id,
      created_by = excluded.created_by,
      updated_at = timezone('utc', now())
  returning id into movement_id;

  return movement_id;
end;
$$;

create or replace function public.sync_operational_cash_from_deleted_debt_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  movement_id uuid;
begin
  update public.operational_cash_movements
  set direction = 'adjustment',
      amount_usd = 0,
      debt_payment_id = null,
      description = 'Pago de deuda eliminado; movimiento anulado en Caja operativa',
      updated_at = timezone('utc', now())
  where debt_payment_id = old.id
    and type = 'debt_payment'
  returning id into movement_id;

  return old;
end;
$$;

create or replace function public.trg_sync_operational_cash_daily_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_operational_cash_from_daily_record(new.id);
  return new;
end;
$$;

create or replace function public.trg_sync_operational_cash_debt_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_operational_cash_from_debt_payment(new.id);
  return new;
end;
$$;

drop trigger if exists trg_daily_records_sync_operational_cash
on public.daily_records;
create trigger trg_daily_records_sync_operational_cash
after insert or update of
  bus_id,
  calculated_net,
  exchange_rate,
  fuel_cost,
  income_bs,
  income_usd,
  net_profit_usd,
  other_expenses,
  record_date,
  status,
  user_id,
  worker_payment
on public.daily_records
for each row
execute function public.trg_sync_operational_cash_daily_record();

drop trigger if exists trg_debt_payments_sync_operational_cash
on public.debt_payments;
create trigger trg_debt_payments_sync_operational_cash
after insert or update of
  amount_usd,
  payment_date,
  debt_id,
  paid_from_operational_cash,
  created_by
on public.debt_payments
for each row
execute function public.trg_sync_operational_cash_debt_payment();

drop trigger if exists trg_debt_payments_zero_operational_cash_on_delete
on public.debt_payments;
create trigger trg_debt_payments_zero_operational_cash_on_delete
before delete on public.debt_payments
for each row
execute function public.sync_operational_cash_from_deleted_debt_payment();

insert into public.operational_cash_movements (
  movement_date,
  type,
  direction,
  amount_usd,
  description,
  daily_record_id,
  bus_id,
  created_by
)
select
  dr.record_date,
  'daily_net',
  case when round(coalesce(dr.calculated_net, 0), 2) < 0 then 'out' else 'in' end,
  abs(round(coalesce(dr.calculated_net, 0), 2)),
  format(
    case
      when round(coalesce(dr.calculated_net, 0), 2) < 0
        then 'Neto diario negativo: Bus %s - %s'
      else 'Neto diario: Bus %s - %s'
    end,
    coalesce(b.code, dr.bus_id::text),
    to_char(dr.record_date, 'YYYY-MM-DD')
  ),
  dr.id,
  dr.bus_id,
  dr.user_id
from public.daily_records dr
left join public.buses b on b.id = dr.bus_id
where dr.status = 'closed'
on conflict (daily_record_id)
where type = 'daily_net' and daily_record_id is not null
do update
set movement_date = excluded.movement_date,
    direction = excluded.direction,
    amount_usd = excluded.amount_usd,
    description = excluded.description,
    bus_id = excluded.bus_id,
    created_by = excluded.created_by,
    updated_at = timezone('utc', now());

grant select, insert, update on table public.operational_cash_movements to authenticated;
grant execute on function public.sync_operational_cash_from_daily_record(uuid) to authenticated;
grant execute on function public.sync_operational_cash_from_debt_payment(uuid) to authenticated;

alter table public.operational_cash_movements enable row level security;

drop policy if exists "operational_cash_movements_admin_select"
on public.operational_cash_movements;
create policy "operational_cash_movements_admin_select"
on public.operational_cash_movements
for select
to authenticated
using (public.is_admin());

drop policy if exists "operational_cash_movements_admin_insert"
on public.operational_cash_movements;
create policy "operational_cash_movements_admin_insert"
on public.operational_cash_movements
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "operational_cash_movements_admin_update"
on public.operational_cash_movements;
create policy "operational_cash_movements_admin_update"
on public.operational_cash_movements
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
