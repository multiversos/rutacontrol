create or replace function public.ensure_daily_record_uses_active_bus()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.buses
    where id = new.bus_id
      and status = 'active'
  ) then
    raise exception 'Daily records require an active bus.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_daily_records_require_active_bus on public.daily_records;
create trigger trg_daily_records_require_active_bus
before insert or update of bus_id on public.daily_records
for each row
execute function public.ensure_daily_record_uses_active_bus();

drop policy if exists "daily_records_insert_scope" on public.daily_records;
create policy "daily_records_insert_scope"
on public.daily_records
for insert
to authenticated
with check (
  status = 'draft'
  and exists (
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
  status = 'draft'
  and exists (
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
