# Smoke Test Sprint 1

Checklist de prueba manual para ejecutar apenas exista un proyecto Supabase real.

## Precondiciones

- [ ] Proyecto Supabase creado y enlazado.
- [ ] Migracion [supabase/migrations/0001_core.sql](N:/projects/busescontrol/supabase/migrations/0001_core.sql) aplicada.
- [ ] Seed [supabase/seed.sql](N:/projects/busescontrol/supabase/seed.sql) aplicado.
- [ ] Variables publicas de Supabase cargadas en `.env.local` o en Vercel.
- [ ] Existe un usuario `admin@rutacontrol.local` en Supabase Auth.
- [ ] Existe un usuario `registrador@rutacontrol.local` en Supabase Auth.
- [ ] Ambos usuarios tienen fila en `public.profiles` con `active = true`.
- [ ] `admin@rutacontrol.local` tiene `role = admin`.
- [ ] `registrador@rutacontrol.local` tiene `role = registrador`.

## Datos base esperados despues del seed

- [ ] Rutas: `Ruta Centro`, `Ruta Norte`, `Ruta Oeste`
- [ ] Buses: `B-01`, `B-02`, `B-03`
- [ ] `B-03` debe quedar en `maintenance`

## Auth y roles

- [ ] Abrir `/login` y confirmar que ya no aparece la alerta de configuracion pendiente.
- [ ] Intentar login invalido y confirmar que permanece en `/login` con error visible.
- [ ] Iniciar sesion con `admin@rutacontrol.local` y confirmar redireccion a `/dashboard`.
- [ ] Iniciar sesion con `registrador@rutacontrol.local` y confirmar redireccion a `/dashboard/daily/new`.
- [ ] Como `registrador`, entrar manualmente a `/dashboard/routes` y confirmar redireccion a `/dashboard/daily/new`.
- [ ] Como `registrador`, entrar manualmente a `/dashboard/buses` y confirmar redireccion a `/dashboard/daily/new`.

## CRUD de rutas

- [ ] Como `admin`, abrir `/dashboard/routes`.
- [ ] Confirmar que el listado carga rutas visibles.
- [ ] Crear una nueva ruta y confirmar que aparece en la tabla.
- [ ] Editar esa ruta y confirmar persistencia despues del guardado.
- [ ] Confirmar que `registrador` no puede operar este modulo.

## CRUD de buses

- [ ] Como `admin`, abrir `/dashboard/buses`.
- [ ] Confirmar que cada bus visible tiene una ruta asociada.
- [ ] Crear un bus nuevo asignandole una ruta valida.
- [ ] Editar el bus creado y cambiar su estado.
- [ ] Confirmar que `registrador` no puede operar este modulo.

## Registro diario

Caso base sugerido:

- bus: `B-01`
- fecha: hoy
- `income_bs = 3500.00`
- `exchange_rate = 35.000000`
- `fuel_cost = 20.00`
- `worker_payment = 10.00`
- `other_expenses = 5.00`
- `net_profit_usd = 65.00`

Resultados esperados:

- `income_usd = 100.00`
- `calculated_net = 65.00`
- `difference = 0.00`

Checklist:

- [ ] Como `registrador`, abrir `/dashboard/daily/new`.
- [ ] Confirmar que `B-03` no aparece como opcion operable o no puede guardarse por backend.
- [ ] Completar el caso base y confirmar que el calculo en vivo coincide con los resultados esperados.
- [ ] Guardar el registro y confirmar exito.
- [ ] Abrir `/dashboard/daily` y confirmar que el registro aparece en la tabla.
- [ ] Filtrar por fecha y confirmar que el registro permanece visible.
- [ ] Filtrar por bus y confirmar que el registro permanece visible.
- [ ] Reintentar guardar otro registro para `B-01` en la misma fecha y confirmar que el sistema rechaza el duplicado.
- [ ] Editar el registro existente y confirmar persistencia.
- [ ] Cambiar `net_profit_usd` a un valor distinto del neto calculado y confirmar que `difference` se pinta en rojo.

## Visibilidad por rol

- [ ] Como `admin`, abrir `/dashboard/daily` y confirmar visibilidad de la operacion.
- [ ] Como `registrador`, abrir `/dashboard/daily` y confirmar que solo ve sus propios registros.
- [ ] Confirmar que el dashboard admin muestra KPIs y que el registrador no ve ese panel.

## Resultado esperado del smoke test

Sprint 1 queda aprobado para prueba real cuando todos los checks anteriores pasan sin:

- errores de auth
- errores de RLS
- diferencias visuales contra el calculo persistido
- duplicados del mismo bus en la misma fecha
- accesos indebidos del `registrador` a modulos admin
