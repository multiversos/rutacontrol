# RutaControl

Base operativa del MVP interno para control diario y financiero de una flota pequena de buses. El repositorio ya incluye auth con Supabase, RLS, catalogos base y registro diario con persistencia en Supabase.

## Estado actual

- Estructura lista para Next.js App Router, TypeScript estricto, Tailwind y Supabase SSR.
- Migracion inicial con tablas, triggers, RLS y reglas de negocio del Sprint 1.
- Login con redireccion por rol y validacion de `profiles.active`.
- CRUD de rutas y buses para `admin`.
- Registro diario con calculo en vivo alineado al redondeo SQL y bloqueo final por constraint.
- Rutas reales verificadas en `/dashboard`, `/dashboard/buses`, `/dashboard/routes`, `/dashboard/daily` y `/dashboard/daily/new`.
- Validacion local completada: `npm install`, `npm run typecheck`, `npm run lint` y `npm run build` ejecutados con exito.
- Git inicializado en `main` y remoto `origin` configurado a `https://github.com/multiversos/rutacontrol.git`.
- Proyecto Vercel creado y enlazado al workspace.
- Deploy real disponible en produccion y preview.

## Stack tecnico

- Next.js 16
- React 19
- TypeScript estricto
- Tailwind CSS
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Server Actions para el CRUD interno

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

`SUPABASE_SERVICE_ROLE_KEY` no se usa para saltarse RLS en la UI de Sprint 1. Solo debe reservarse para trabajos privilegiados de servidor cuando realmente hagan falta.

## Arranque local

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Supabase

Aplicar migraciones con CLI local:

```bash
npx supabase init
npx supabase db reset
```

O enlazar un proyecto remoto:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Generar tipos:

```bash
npx supabase gen types typescript --project-id "<PROJECT_REF>" --schema public > lib/supabase/database.types.ts
```

## Seed inicial

`supabase/seed.sql` crea:

- rutas de ejemplo
- buses de ejemplo
- promocion de `admin@rutacontrol.local` a rol `admin` si el usuario ya existe en `auth.users`

## Git y remoto

Estado actual:

- repo local inicializado en `main`
- commit local creado
- remoto `origin` configurado
- push pendiente hasta que exista el repo remoto

Comandos pendientes cuando exista el repo `multiversos/rutacontrol`:

```bash
git push -u origin main
```

## Vercel

Estado actual:

- proyecto `rutacontrol` creado en Vercel
- workspace enlazado con `.vercel/project.json`
- preview operativo: `https://rutacontrol-9fz7i3mzn-multiversos-4148s-projects.vercel.app`
- produccion operativa: `https://rutacontrol.vercel.app`

Variables ya configuradas en produccion:

- `NEXT_PUBLIC_APP_NAME`
- `BUSINESS_TIMEZONE`
- `NEXT_PUBLIC_SITE_URL`

Variables aun pendientes por secretos externos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` si aplica
- `SUPABASE_SERVICE_ROLE_KEY` solo si se necesitara para procesos privilegiados

## Bloqueos externos reales

- Falta crear o proporcionar el repositorio remoto `multiversos/rutacontrol`.
- Falta crear el proyecto Supabase y entregar credenciales reales.
- Falta vincular GitHub con el repo real para habilitar pushes y previews por integracion Git.

## Pasos manuales inevitables

1. Crear o proporcionar el repositorio `multiversos/rutacontrol`.
2. Crear el proyecto Supabase y completar las variables reales en `.env.local`.
3. Empujar `main` al remoto con `git push -u origin main`.
4. Crear o vincular el proyecto en Vercel y cargar las variables de entorno.
