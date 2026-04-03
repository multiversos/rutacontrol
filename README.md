# RutaControl

Base operativa del MVP interno para control diario y financiero de una flota pequena de buses. El repositorio ya incluye auth con Supabase, RLS, catalogos base y registro diario con persistencia en Supabase.

## Estado actual

- Estructura lista para Next.js App Router, TypeScript estricto, Tailwind y Supabase SSR.
- Migracion inicial con tablas, triggers, RLS y reglas de negocio del Sprint 1.
- Login con redireccion por rol y validacion de `profiles.active`.
- CRUD de rutas y buses para `admin`.
- Registro diario con calculo en vivo alineado al redondeo SQL y bloqueo final por constraint.
- Preparacion de deploy para Vercel a nivel de codigo.

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

## Vercel

Next.js se detecta automaticamente. Configura en Vercel:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `BUSINESS_TIMEZONE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` si aplica
- `SUPABASE_SERVICE_ROLE_KEY` solo si se necesitara para procesos privilegiados

## Git y remoto

Cuando `git` este disponible:

```bash
git init -b main
git add .
git commit -m "feat: bootstrap sprint 1 base"
git remote add origin https://github.com/multiversos/rutacontrol.git
git push -u origin main
```

## Bloqueos del entorno

- `git` no esta disponible en la maquina o no esta en PATH.
- `node` no esta disponible en la maquina o no esta en PATH.
- `npm` no esta disponible en la maquina o no esta en PATH.
- `pnpm` no esta disponible en la maquina o no esta en PATH.

## Pasos manuales inevitables

1. Instalar `git` y Node.js `>= 20.9`.
2. Crear o proporcionar el repositorio `multiversos/rutacontrol`.
3. Crear el proyecto Supabase y completar las variables reales en `.env.local`.
4. Ejecutar instalacion, validaciones y build.
5. Importar o desplegar el proyecto en Vercel con las variables configuradas.
