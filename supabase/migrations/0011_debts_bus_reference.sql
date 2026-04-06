alter table public.debts
add column if not exists bus_id uuid references public.buses (id) on delete restrict;

create index if not exists idx_debts_bus_id on public.debts (bus_id);

update public.debts as debts
set bus_id = daily_records.bus_id
from public.daily_records as daily_records
where debts.daily_record_id = daily_records.id
  and debts.bus_id is null;

update public.debts as debts
set bus_id = maintenance_records.bus_id
from public.maintenance_records as maintenance_records
where debts.id = maintenance_records.debt_id
  and debts.bus_id is null;

create or replace function public.sync_debt_bus_reference()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  linked_bus_id uuid;
begin
  if new.daily_record_id is null then
    return new;
  end if;

  select bus_id
  into linked_bus_id
  from public.daily_records
  where id = new.daily_record_id;

  if linked_bus_id is null then
    raise exception 'No pudimos resolver el bus del registro diario asociado a la deuda.'
      using errcode = '23514';
  end if;

  if new.bus_id is null then
    new.bus_id := linked_bus_id;
    return new;
  end if;

  if new.bus_id <> linked_bus_id then
    raise exception 'La deuda no puede vincularse a un bus distinto del registro diario seleccionado.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.sync_maintenance_debt_bus_reference()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  linked_bus_id uuid;
begin
  if new.debt_id is null then
    return new;
  end if;

  select bus_id
  into linked_bus_id
  from public.debts
  where id = new.debt_id
  for update;

  if linked_bus_id is null then
    update public.debts
    set bus_id = new.bus_id
    where id = new.debt_id;

    return new;
  end if;

  if linked_bus_id <> new.bus_id then
    raise exception 'La deuda asociada al mantenimiento ya esta vinculada a otro bus.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_debts_sync_bus_reference on public.debts;
create trigger trg_debts_sync_bus_reference
before insert or update on public.debts
for each row
execute function public.sync_debt_bus_reference();

drop trigger if exists trg_maintenance_records_sync_debt_bus_reference on public.maintenance_records;
create trigger trg_maintenance_records_sync_debt_bus_reference
after insert or update on public.maintenance_records
for each row
execute function public.sync_maintenance_debt_bus_reference();
