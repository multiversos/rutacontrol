begin;

create or replace function public.ensure_repair_has_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_payload jsonb;
  target_repair_id uuid;
begin
  source_payload := case
    when tg_op = 'DELETE' then to_jsonb(old)
    else to_jsonb(new)
  end;

  target_repair_id := case
    when tg_table_name = 'repairs' then (source_payload ->> 'id')::uuid
    else (source_payload ->> 'repair_id')::uuid
  end;

  if target_repair_id is null then
    return null;
  end if;

  if exists (
    select 1
    from public.repairs
    where id = target_repair_id
  )
  and not exists (
    select 1
    from public.repair_attachments
    where repair_id = target_repair_id
  ) then
    raise exception 'Las reparaciones requieren al menos un comprobante adjunto.'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

commit;
