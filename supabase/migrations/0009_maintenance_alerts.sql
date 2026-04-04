alter type public.alert_type add value if not exists 'maintenance';

create or replace function public.reconcile_maintenance_alerts(
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
    raise exception 'Solo el admin puede reconciliar alertas de mantenimiento.'
      using errcode = '42501';
  end if;

  with due_cycles as (
    select
      cycle.*,
      buses.code as bus_code,
      format(
        'maintenance:%s:%s:%s:%s',
        cycle.bus_id,
        cycle.maintenance_type,
        coalesce(cycle.component_name, 'general'),
        coalesce(cycle.component_position::text, 'general')
      ) as dedupe_key
    from public.current_maintenance_cycles(_record_date) cycle
    join public.buses
      on buses.id = cycle.bus_id
    where cycle.status in (
      'due_soon'::public.maintenance_status,
      'overdue'::public.maintenance_status
    )
  )
  delete from public.alerts alerts_to_remove
  where alerts_to_remove.alert_type = 'maintenance'
    and alerts_to_remove.dedupe_key is not null
    and alerts_to_remove.dedupe_key not in (
      select dedupe_key
      from due_cycles
    );

  with due_cycles as (
    select
      cycle.*,
      buses.code as bus_code,
      format(
        'maintenance:%s:%s:%s:%s',
        cycle.bus_id,
        cycle.maintenance_type,
        coalesce(cycle.component_name, 'general'),
        coalesce(cycle.component_position::text, 'general')
      ) as dedupe_key
    from public.current_maintenance_cycles(_record_date) cycle
    join public.buses
      on buses.id = cycle.bus_id
    where cycle.status in (
      'due_soon'::public.maintenance_status,
      'overdue'::public.maintenance_status
    )
  ),
  inserted as (
    select public.upsert_alert(
      'maintenance'::public.alert_type,
      case
        when due_cycles.status = 'overdue'::public.maintenance_status then 'critical'::public.alert_severity
        else 'warning'::public.alert_severity
      end,
      case
        when due_cycles.component_name is not null then
          format(
            'El mantenimiento %s (%s) del bus %s esta %s: %s de %s dias trabajados.',
            replace(due_cycles.maintenance_type::text, '_', ' '),
            replace(coalesce(due_cycles.component_position::text, due_cycles.component_name), '_', ' '),
            due_cycles.bus_code,
            case
              when due_cycles.status = 'overdue'::public.maintenance_status then 'vencido'
              else 'proximo a vencer'
            end,
            due_cycles.worked_days,
            due_cycles.expected_work_days
          )
        else
          format(
            'El mantenimiento %s del bus %s esta %s: %s de %s dias trabajados.',
            replace(due_cycles.maintenance_type::text, '_', ' '),
            due_cycles.bus_code,
            case
              when due_cycles.status = 'overdue'::public.maintenance_status then 'vencido'
              else 'proximo a vencer'
            end,
            due_cycles.worked_days,
            due_cycles.expected_work_days
          )
      end,
      null,
      due_cycles.bus_id,
      null,
      due_cycles.dedupe_key,
      jsonb_build_object(
        'service_date', due_cycles.service_date,
        'expected_work_days', due_cycles.expected_work_days,
        'worked_days', due_cycles.worked_days,
        'status', due_cycles.status,
        'maintenance_type', due_cycles.maintenance_type,
        'component_name', due_cycles.component_name,
        'component_position', due_cycles.component_position
      )
    ) as alert_id
    from due_cycles
  )
  select count(*)
  into affected_count
  from inserted;

  return affected_count;
end;
$$;

grant execute on function public.reconcile_maintenance_alerts(date) to authenticated;
