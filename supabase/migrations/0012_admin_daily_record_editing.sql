begin;

create or replace function public.recalculate_daily_record_totals()
returns trigger
language plpgsql
as $$
declare
  closure_ready boolean;
  previous_closed_at timestamptz;
begin
  previous_closed_at := case
    when tg_op = 'UPDATE' then old.closed_at
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

drop policy if exists "daily_records_update_scope" on public.daily_records;
create policy "daily_records_update_scope"
on public.daily_records
for update
to authenticated
using (
  public.is_admin()
  or (
    status = 'draft'
    and public.is_registrador()
    and user_id = auth.uid()
  )
)
with check (
  (
    public.is_admin()
    or exists (
      select 1
      from public.buses
      where id = daily_records.bus_id
        and status = 'active'
    )
  )
  and (
    public.is_admin()
    or (
      public.is_registrador()
      and user_id = auth.uid()
    )
  )
);

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
    if tg_op = 'UPDATE' and old.status = 'closed' then
      delete from public.alerts
      where dedupe_key in (
        format('closure:%s', new.id),
        format('difference:%s', new.id)
      );
    end if;

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
  else
    delete from public.alerts
    where dedupe_key = format('difference:%s', new.id);
  end if;

  return new;
end;
$$;

create or replace function public.log_daily_record_update_event(
  _record_id uuid,
  _old_values jsonb default '{}'::jsonb,
  _new_values jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Solo el admin puede registrar auditoria manual para registros diarios.'
      using errcode = '42501';
  end if;

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
    'daily_records',
    _record_id::text,
    'update'::public.audit_action,
    coalesce(_old_values, '{}'::jsonb),
    jsonb_build_object('audit_event', 'daily_record_updated') || coalesce(_new_values, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

grant execute on function public.log_daily_record_update_event(uuid, jsonb, jsonb) to authenticated;

create or replace function public.sync_daily_record_debts_bus_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.bus_id is distinct from old.bus_id then
    update public.debts
    set bus_id = new.bus_id
    where daily_record_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_daily_records_sync_debt_bus_reference on public.daily_records;
create trigger trg_daily_records_sync_debt_bus_reference
after update of bus_id on public.daily_records
for each row
execute function public.sync_daily_record_debts_bus_reference();

commit;
