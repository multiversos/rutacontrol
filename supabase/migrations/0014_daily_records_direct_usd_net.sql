begin;

alter table public.daily_records
  alter column income_usd drop not null,
  alter column income_usd drop default;

create or replace function public.recalculate_daily_record_totals()
returns trigger
language plpgsql
as $$
declare
  closure_ready boolean;
  has_income_input boolean;
  previous_closed_at timestamptz;
begin
  previous_closed_at := case
    when tg_op = 'UPDATE' then old.closed_at
    else null
  end;

  has_income_input := (
    new.income_usd is not null
    or (
      new.income_bs is not null
      and new.exchange_rate is not null
      and new.exchange_rate > 0
    )
  );

  if has_income_input then
    new.income_usd := round(
      coalesce(
        new.income_usd,
        new.income_bs / new.exchange_rate
      )::numeric,
      2
    );
  else
    new.income_usd := null;
  end if;

  new.calculated_net := round(
    (
      coalesce(new.income_usd, 0)
      - coalesce(new.fuel_cost, 0)
      - coalesce(new.worker_payment, 0)
      - coalesce(new.other_expenses, 0)
    )::numeric,
    2
  );

  new.net_profit_usd := new.calculated_net;
  new.difference := 0;

  closure_ready := (
    new.bus_id is not null
    and new.user_id is not null
    and new.record_date is not null
    and new.departure_time is not null
    and has_income_input
    and new.fuel_cost is not null
    and new.worker_payment is not null
    and new.other_expenses is not null
  );

  if closure_ready then
    new.status := 'closed';
    new.closed_at := coalesce(previous_closed_at, new.closed_at, timezone('utc', now()));
    new.closure_hash := public.build_daily_record_closure_hash(
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
    );
  else
    new.status := 'draft';
    new.closed_at := null;
    new.closure_hash := null;
  end if;

  return new;
end;
$$;

commit;
