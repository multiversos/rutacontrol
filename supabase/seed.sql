insert into public.routes (
  name,
  origin,
  destination,
  expected_income,
  active
)
values
  ('Ruta Centro', 'Barquisimeto', 'Cabudare', 140.00, true),
  ('Ruta Norte', 'Barquisimeto', 'Duaca', 165.00, true),
  ('Ruta Oeste', 'Barquisimeto', 'Quibor', 190.00, true)
on conflict (name, origin, destination) do update
set expected_income = excluded.expected_income,
    active = excluded.active,
    updated_at = timezone('utc', now());

insert into public.buses (
  code,
  plate,
  route_id,
  status
)
select
  seed.code,
  seed.plate,
  routes.id,
  seed.status::public.bus_status
from (
  values
    ('B-01', 'AB123CD', 'Ruta Centro', 'active'),
    ('B-02', 'EF456GH', 'Ruta Norte', 'active'),
    ('B-03', 'IJ789KL', 'Ruta Oeste', 'maintenance')
) as seed(code, plate, route_name, status)
join public.routes
  on routes.name = seed.route_name
on conflict (code) do update
set plate = excluded.plate,
    route_id = excluded.route_id,
    status = excluded.status,
    updated_at = timezone('utc', now());

insert into public.profiles (
  id,
  email,
  name,
  role,
  active
)
select
  au.id,
  au.email,
  coalesce(nullif(trim(au.raw_user_meta_data ->> 'name'), ''), 'Administrador RutaControl'),
  'admin'::public.app_role,
  true
from auth.users au
where lower(au.email) = lower('admin@rutacontrol.local')
on conflict (id) do update
set email = excluded.email,
    name = excluded.name,
    role = 'admin'::public.app_role,
    active = true,
    updated_at = timezone('utc', now());
