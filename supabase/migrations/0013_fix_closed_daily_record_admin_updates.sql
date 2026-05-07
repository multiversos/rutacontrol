begin;

create or replace function public.prevent_closed_daily_record_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'closed' then
    if tg_op = 'UPDATE' and public.is_admin() then
      return new;
    end if;

    if tg_op = 'DELETE' then
      raise exception 'No se puede eliminar un registro diario cerrado'
        using errcode = '42501';
    end if;

    raise exception 'Solo el admin puede modificar un registro diario cerrado'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_daily_records_prevent_update_when_closed on public.daily_records;
create trigger trg_daily_records_prevent_update_when_closed
before update or delete on public.daily_records
for each row
when (old.status = 'closed')
execute function public.prevent_closed_daily_record_mutation();

commit;
