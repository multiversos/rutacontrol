create extension if not exists pgcrypto with schema extensions;

alter table public.daily_records
  alter column departure_time drop not null,
  alter column income_bs drop not null,
  alter column income_bs drop default,
  alter column exchange_rate drop not null,
  alter column fuel_cost drop not null,
  alter column fuel_cost drop default,
  alter column worker_payment drop not null,
  alter column worker_payment drop default,
  alter column other_expenses drop not null,
  alter column other_expenses drop default,
  alter column net_profit_usd drop not null,
  alter column net_profit_usd drop default;

alter table public.daily_records
  drop constraint if exists daily_records_status_consistency;

alter table public.daily_records
  add constraint daily_records_status_consistency check (
    (status = 'draft' and closed_at is null and closure_hash is null)
    or (status = 'closed' and closed_at is not null and closure_hash is not null)
  );

create or replace function public.build_daily_record_closure_hash(
  _bus_id uuid,
  _user_id uuid,
  _record_date date,
  _departure_time time,
  _income_bs numeric,
  _exchange_rate numeric,
  _fuel_cost numeric,
  _worker_payment numeric,
  _other_expenses numeric,
  _net_profit_usd numeric,
  _income_usd numeric,
  _calculated_net numeric,
  _difference numeric,
  _notes text
)
returns text
language sql
immutable
as $$
  select encode(
    extensions.digest(
      concat_ws(
        '|',
        _bus_id::text,
        _user_id::text,
        to_char(_record_date, 'YYYY-MM-DD'),
        to_char(_departure_time, 'HH24:MI:SS'),
        to_char(_income_bs, 'FM999999999990D00'),
        to_char(_exchange_rate, 'FM999999999990D000000'),
        to_char(_fuel_cost, 'FM999999999990D00'),
        to_char(_worker_payment, 'FM999999999990D00'),
        to_char(_other_expenses, 'FM999999999990D00'),
        to_char(_net_profit_usd, 'FM999999999990D00'),
        to_char(_income_usd, 'FM999999999990D00'),
        to_char(_calculated_net, 'FM999999999990D00'),
        to_char(_difference, 'FM999999999990D00'),
        coalesce(_notes, '')
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.recalculate_daily_record_totals()
returns trigger
language plpgsql
as $$
declare
  closure_ready boolean;
  previous_closed_at timestamptz;
  previous_closure_hash text;
begin
  previous_closed_at := case
    when tg_op = 'UPDATE' then old.closed_at
    else null
  end;

  previous_closure_hash := case
    when tg_op = 'UPDATE' then old.closure_hash
    else null
  end;

  new.income_usd := case
    when new.income_bs is not null
      and new.exchange_rate is not null
      and new.exchange_rate > 0
      then round((new.income_bs / new.exchange_rate)::numeric, 2)
    else 0
  end;

  new.calculated_net := round(
    (
      coalesce(new.income_usd, 0)
      - coalesce(new.fuel_cost, 0)
      - coalesce(new.worker_payment, 0)
      - coalesce(new.other_expenses, 0)
    )::numeric,
    2
  );

  new.difference := round(
    (
      coalesce(new.net_profit_usd, 0)
      - new.calculated_net
    )::numeric,
    2
  );

  closure_ready := (
    new.bus_id is not null
    and new.user_id is not null
    and new.record_date is not null
    and new.departure_time is not null
    and new.income_bs is not null
    and new.exchange_rate is not null
    and new.fuel_cost is not null
    and new.worker_payment is not null
    and new.other_expenses is not null
    and new.net_profit_usd is not null
  );

  if closure_ready then
    new.status := 'closed';
    new.closed_at := coalesce(previous_closed_at, new.closed_at, timezone('utc', now()));
    new.closure_hash := coalesce(
      previous_closure_hash,
      public.build_daily_record_closure_hash(
        new.bus_id,
        new.user_id,
        new.record_date,
        new.departure_time,
        new.income_bs,
        new.exchange_rate,
        new.fuel_cost,
        new.worker_payment,
        new.other_expenses,
        new.net_profit_usd,
        new.income_usd,
        new.calculated_net,
        new.difference,
        new.notes
      )
    );
  else
    new.status := 'draft';
    new.closed_at := null;
    new.closure_hash := null;
  end if;

  return new;
end;
$$;

drop policy if exists "daily_records_insert_scope" on public.daily_records;
create policy "daily_records_insert_scope"
on public.daily_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.buses
    where id = daily_records.bus_id
      and status = 'active'
  )
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
  exists (
    select 1
    from public.buses
    where id = daily_records.bus_id
      and status = 'active'
  )
  and (
    public.is_admin()
    or (
      public.is_registrador()
      and user_id = auth.uid()
    )
  )
);
