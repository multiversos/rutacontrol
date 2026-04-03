# RutaControl

Estado del repositorio: `Sprint 1 listo para conexion externa`.

RutaControl es una aplicacion interna para registrar la operacion diaria y financiera de una empresa de buses de pasajeros. El alcance actual cubre login con Supabase Auth, roles `admin` y `registrador`, CRUD de rutas, CRUD de buses y registros diarios con recalculo financiero en SQL.

## Estado verificado

- App validada localmente con `npm install`, `npm run typecheck`, `npm run lint` y `npm run build`.
- Estructura App Router estable en `/dashboard`, `/dashboard/buses`, `/dashboard/routes`, `/dashboard/daily` y `/dashboard/daily/new`.
- Auth endurecida con `profiles.active`, perfiles faltantes y redireccion por rol.
- RLS, triggers y migracion principal preparados en [supabase/migrations/0001_core.sql](N:/projects/busescontrol/supabase/migrations/0001_core.sql).
- Seed base preparado en [supabase/seed.sql](N:/projects/busescontrol/supabase/seed.sql).
- Proyecto Vercel creado, enlazado y desplegado.

## Estado de servicios externos

- GitHub remoto: `origin` configurado a `https://github.com/multiversos/rutacontrol.git`, pero el repo remoto todavia no existe o no es accesible desde la integracion actual.
- Supabase: codigo y CLI listos, pero todavia no hay proyecto autenticado ni secretos reales.
- Vercel:
  - produccion: [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app)
  - preview mas reciente: [https://rutacontrol-9fz7i3mzn-multiversos-4148s-projects.vercel.app](https://rutacontrol-9fz7i3mzn-multiversos-4148s-projects.vercel.app)
  - nota: el preview sigue protegido por autenticacion de Vercel

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_APP_NAME`
- `BUSINESS_TIMEZONE`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionales:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` no es necesaria para cerrar Sprint 1 y no debe usarse para saltarse RLS en la UI.

## Arranque local

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Documentacion de handoff

- Conexion externa: [docs/deployment-checklist.md](N:/projects/busescontrol/docs/deployment-checklist.md)
- Smoke test de Sprint 1: [docs/smoke-test-sprint-1.md](N:/projects/busescontrol/docs/smoke-test-sprint-1.md)
- Estado exacto del proyecto: [docs/project-status.md](N:/projects/busescontrol/docs/project-status.md)
- Checklist historico de fundacion: [docs/sprint-0-checklist.md](N:/projects/busescontrol/docs/sprint-0-checklist.md)

## Bloqueos externos actuales

- Falta crear o dar acceso al repo remoto `multiversos/rutacontrol`.
- Falta crear el proyecto Supabase real.
- Faltan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Falta aplicar migracion y seed en Supabase real.

## Criterio exacto para cerrar Sprint 1

Sprint 1 se considera cerrado cuando se cumplan estas cinco condiciones:

1. `main` existe en el remoto de GitHub y acepta `git push -u origin main`.
2. Existe un proyecto Supabase real enlazado, con migracion y seed aplicados.
3. La app tiene configuradas las variables publicas de Supabase en local o en Vercel.
4. Existe al menos un usuario `admin` activo y un usuario `registrador` activo en `public.profiles`.
5. El checklist de [docs/smoke-test-sprint-1.md](N:/projects/busescontrol/docs/smoke-test-sprint-1.md) pasa de punta a punta.
