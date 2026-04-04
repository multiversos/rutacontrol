begin;

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'debt_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.debt_status as enum ('pending', 'partial', 'paid');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'repair_category'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.repair_category as enum (
      'mechanical',
      'electrical',
      'bodywork',
      'tires',
      'oil_change',
      'inspection',
      'other'
    );
  end if;
end
$$;

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid references public.daily_records (id) on delete set null,
  creditor varchar(160) not null,
  description text not null,
  amount_usd numeric(14, 2) not null,
  amount_paid_usd numeric(14, 2) not null default 0,
  balance_due_usd numeric(14, 2) not null default 0,
  status public.debt_status not null default 'pending',
  due_date date,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint debts_creditor_not_blank check (char_length(trim(creditor)) > 0),
  constraint debts_description_not_blank check (char_length(trim(description)) > 0),
  constraint debts_amount_positive check (amount_usd > 0),
  constraint debts_amount_paid_nonnegative check (amount_paid_usd >= 0),
  constraint debts_balance_due_nonnegative check (balance_due_usd >= 0)
);

create index if not exists idx_debts_status on public.debts (status);
create index if not exists idx_debts_created_at on public.debts (created_at desc);
create index if not exists idx_debts_due_date on public.debts (due_date);
create index if not exists idx_debts_daily_record_id on public.debts (daily_record_id);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  amount_usd numeric(14, 2) not null,
  payment_date date not null default (timezone('America/Caracas', now()))::date,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint debt_payments_amount_positive check (amount_usd > 0)
);

create index if not exists idx_debt_payments_debt_id on public.debt_payments (debt_id);
create index if not exists idx_debt_payments_payment_date on public.debt_payments (payment_date desc);

create table if not exists public.repairs (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses (id) on delete cascade,
  category public.repair_category not null default 'other',
  provider varchar(160) not null,
  description text not null,
  cost_usd numeric(14, 2) not null,
  repair_date date not null default (timezone('America/Caracas', now()))::date,
  next_service_due_date date,
  next_service_notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint repairs_provider_not_blank check (char_length(trim(provider)) > 0),
  constraint repairs_description_not_blank check (char_length(trim(description)) > 0),
  constraint repairs_cost_positive check (cost_usd > 0),
  constraint repairs_next_service_after_repair check (
    next_service_due_date is null or next_service_due_date >= repair_date
  )
);

create index if not exists idx_repairs_bus_id on public.repairs (bus_id);
create index if not exists idx_repairs_repair_date on public.repairs (repair_date desc);
create index if not exists idx_repairs_next_service_due_date on public.repairs (next_service_due_date);
create index if not exists idx_repairs_category on public.repairs (category);

create table if not exists public.repair_attachments (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repairs (id) on delete cascade,
  bucket_name text not null default 'repair-receipts',
  object_path text not null unique,
  original_name text not null,
  content_type text not null,
  file_size_bytes bigint not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint repair_attachments_name_not_blank check (char_length(trim(original_name)) > 0),
  constraint repair_attachments_path_not_blank check (char_length(trim(object_path)) > 0),
  constraint repair_attachments_bucket_not_blank check (char_length(trim(bucket_name)) > 0),
  constraint repair_attachments_size_positive check (file_size_bytes > 0)
);

create index if not exists idx_repair_attachments_repair_id on public.repair_attachments (repair_id);

create or replace function public.set_debt_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_amount numeric(14, 2);
  normalized_paid numeric(14, 2);
  normalized_balance numeric(14, 2);
begin
  normalized_amount := round(coalesce(new.amount_usd, 0), 2);
  normalized_paid := round(coalesce(new.amount_paid_usd, 0), 2);

  if normalized_paid > normalized_amount then
    raise exception 'Los pagos no pueden exceder el monto original de la deuda.'
      using errcode = '23514';
  end if;

  normalized_balance := round(normalized_amount - normalized_paid, 2);

  new.amount_usd := normalized_amount;
  new.amount_paid_usd := normalized_paid;
  new.balance_due_usd := normalized_balance;
  new.status := case
    when normalized_balance = normalized_amount then 'pending'::public.debt_status
    when normalized_balance > 0 then 'partial'::public.debt_status
    else 'paid'::public.debt_status
  end;

  return new;
end;
$$;

create or replace function public.refresh_debt_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_debt_id uuid;
  debt_amount numeric(14, 2);
  total_paid numeric(14, 2);
begin
  target_debt_id := case
    when tg_op = 'DELETE' then old.debt_id
    else new.debt_id
  end;

  select amount_usd
  into debt_amount
  from public.debts
  where id = target_debt_id
  for update;

  if debt_amount is null then
    return coalesce(new, old);
  end if;

  select round(coalesce(sum(amount_usd), 0), 2)
  into total_paid
  from public.debt_payments
  where debt_id = target_debt_id;

  update public.debts
  set amount_paid_usd = total_paid
  where id = target_debt_id;

  return coalesce(new, old);
end;
$$;

create or replace function public.ensure_repair_has_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_repair_id uuid;
begin
  target_repair_id := case
    when tg_table_name = 'repairs' then new.id
    when tg_op = 'DELETE' then old.repair_id
    else new.repair_id
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

create or replace function public.create_repair_with_receipt(
  _repair_id uuid,
  _bus_id uuid,
  _category public.repair_category,
  _provider text,
  _description text,
  _cost_usd numeric,
  _repair_date date,
  _next_service_due_date date default null,
  _next_service_notes text default null,
  _bucket_name text default 'repair-receipts',
  _object_path text default null,
  _original_name text default null,
  _content_type text default null,
  _file_size_bytes bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
begin
  actor_id := auth.uid();

  if actor_id is null or not public.is_admin() then
    raise exception 'Solo el admin puede registrar reparaciones.'
      using errcode = '42501';
  end if;

  if _object_path is null
    or _original_name is null
    or _content_type is null
    or _file_size_bytes is null
    or _file_size_bytes <= 0 then
    raise exception 'Toda reparacion requiere un comprobante adjunto valido.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = _bucket_name
      and name = _object_path
  ) then
    raise exception 'El comprobante debe existir en Supabase Storage antes de registrar la reparacion.'
      using errcode = '23514';
  end if;

  insert into public.repairs (
    id,
    bus_id,
    category,
    provider,
    description,
    cost_usd,
    repair_date,
    next_service_due_date,
    next_service_notes,
    created_by
  )
  values (
    _repair_id,
    _bus_id,
    coalesce(_category, 'other'::public.repair_category),
    trim(_provider),
    trim(_description),
    round(_cost_usd, 2),
    _repair_date,
    _next_service_due_date,
    nullif(trim(coalesce(_next_service_notes, '')), ''),
    actor_id
  );

  insert into public.repair_attachments (
    repair_id,
    bucket_name,
    object_path,
    original_name,
    content_type,
    file_size_bytes
  )
  values (
    _repair_id,
    _bucket_name,
    _object_path,
    _original_name,
    _content_type,
    _file_size_bytes
  );

  return _repair_id;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'repair-receipts',
  'repair-receipts',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant execute on function public.create_repair_with_receipt(
  uuid,
  uuid,
  public.repair_category,
  text,
  text,
  numeric,
  date,
  date,
  text,
  text,
  text,
  text,
  text,
  bigint
) to authenticated;

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.repairs enable row level security;
alter table public.repair_attachments enable row level security;

drop policy if exists "debts_admin_select" on public.debts;
create policy "debts_admin_select"
on public.debts
for select
to authenticated
using (public.is_admin());

drop policy if exists "debts_admin_write" on public.debts;
create policy "debts_admin_write"
on public.debts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "debt_payments_admin_select" on public.debt_payments;
create policy "debt_payments_admin_select"
on public.debt_payments
for select
to authenticated
using (public.is_admin());

drop policy if exists "debt_payments_admin_write" on public.debt_payments;
create policy "debt_payments_admin_write"
on public.debt_payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "repairs_admin_select" on public.repairs;
create policy "repairs_admin_select"
on public.repairs
for select
to authenticated
using (public.is_admin());

drop policy if exists "repair_attachments_admin_select" on public.repair_attachments;
create policy "repair_attachments_admin_select"
on public.repair_attachments
for select
to authenticated
using (public.is_admin());

drop policy if exists "storage_repair_receipts_admin_select" on storage.objects;
create policy "storage_repair_receipts_admin_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'repair-receipts'
  and public.is_admin()
);

drop policy if exists "storage_repair_receipts_admin_insert" on storage.objects;
create policy "storage_repair_receipts_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'repair-receipts'
  and public.is_admin()
);

drop policy if exists "storage_repair_receipts_admin_delete" on storage.objects;
create policy "storage_repair_receipts_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'repair-receipts'
  and public.is_admin()
);

drop trigger if exists trg_debts_set_updated_at on public.debts;
create trigger trg_debts_set_updated_at
before update on public.debts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_debts_set_snapshot on public.debts;
create trigger trg_debts_set_snapshot
before insert or update on public.debts
for each row
execute function public.set_debt_snapshot();

drop trigger if exists trg_debt_payments_set_updated_at on public.debt_payments;
create trigger trg_debt_payments_set_updated_at
before update on public.debt_payments
for each row
execute function public.set_updated_at();

drop trigger if exists trg_debt_payments_refresh_balance on public.debt_payments;
create trigger trg_debt_payments_refresh_balance
after insert or update or delete on public.debt_payments
for each row
execute function public.refresh_debt_balance();

drop trigger if exists trg_repairs_set_updated_at on public.repairs;
create trigger trg_repairs_set_updated_at
before update on public.repairs
for each row
execute function public.set_updated_at();

drop trigger if exists trg_repairs_require_attachment on public.repairs;
create constraint trigger trg_repairs_require_attachment
after insert or update on public.repairs
deferrable initially deferred
for each row
execute function public.ensure_repair_has_attachment();

drop trigger if exists trg_repair_attachments_keep_requirement on public.repair_attachments;
create constraint trigger trg_repair_attachments_keep_requirement
after delete on public.repair_attachments
deferrable initially deferred
for each row
execute function public.ensure_repair_has_attachment();

commit;
