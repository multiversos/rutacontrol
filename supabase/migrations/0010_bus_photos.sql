begin;

alter table public.buses
  add column if not exists photo_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'buses_photo_path_not_blank'
      and connamespace = 'public'::regnamespace
  ) then
    alter table public.buses
      add constraint buses_photo_path_not_blank
      check (photo_path is null or char_length(trim(photo_path)) > 0);
  end if;
end
$$;

create index if not exists idx_buses_photo_path on public.buses (photo_path);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bus-photos',
  'bus-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_bus_photos_admin_select'
  ) then
    execute $policy$
      create policy "storage_bus_photos_admin_select"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'bus-photos'
        and public.is_admin()
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_bus_photos_admin_insert'
  ) then
    execute $policy$
      create policy "storage_bus_photos_admin_insert"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'bus-photos'
        and public.is_admin()
      )
    $policy$;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_bus_photos_admin_delete'
  ) then
    execute $policy$
      create policy "storage_bus_photos_admin_delete"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'bus-photos'
        and public.is_admin()
      )
    $policy$;
  end if;
end
$$;

commit;
