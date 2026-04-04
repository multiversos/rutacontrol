begin;

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
      dr.status::text as record_status
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

commit;
