# RutaControl

Estado del repositorio: `Sprint 2 cerrado`.

RutaControl es una aplicacion web interna para registrar la operacion diaria y financiera de una empresa de buses de pasajeros. El estado actual cubre autenticacion con Supabase Auth, roles `admin` y `registrador`, CRUD de rutas, CRUD de buses, registros diarios con recalculo financiero en SQL y cierre automatico operativo de `daily_records`.

## Estado actual

- Sprint 0: cerrado
- Sprint 1: cerrado el 3 de abril de 2026
- Sprint 2: cerrado el 3 de abril de 2026
- Sprint 3: pendiente, no iniciado

## Criterios aprobados de Sprint 1

- Login admin: PASS
- Login registrador: PASS
- Redireccion por rol: PASS
- Acceso a dashboard autenticado: PASS
- CRUD de rutas: PASS
- CRUD de buses: PASS
- Creacion y edicion de `daily_records`: PASS
- `UNIQUE (bus_id, record_date)`: PASS
- Rechazo real de buses inactive: PASS
- Persistencia autenticada contra Supabase: PASS
- RLS basica: PASS

## Infraestructura verificada

- GitHub remoto operativo en [multiversos/rutacontrol](https://github.com/multiversos/rutacontrol)
- Supabase real conectado con migraciones `0001`, `0002` y `0003` aplicadas
- Vercel produccion activo en [rutacontrol.vercel.app](https://rutacontrol.vercel.app)

## Criterios aprobados de Sprint 2

- `daily_records` incompletos como `draft`: PASS
- cierre automatico a `closed`: PASS
- persistencia de `closed_at`: PASS
- persistencia de `closure_hash`: PASS
- `closure_hash` inmutable tras cierre: PASS
- bloqueo real de edicion post-cierre: PASS
- diferencia de caja persistida correctamente: PASS
- regresion Sprint 1: PASS

## Stack

- Next.js App Router
- TypeScript estricto
- Tailwind CSS
- Supabase SSR
- Vercel

## Rutas activas del MVP

- `/login`
- `/dashboard`
- `/dashboard/routes`
- `/dashboard/buses`
- `/dashboard/daily`
- `/dashboard/daily/new`

## Variables de entorno principales

- `NEXT_PUBLIC_APP_NAME`
- `BUSINESS_TIMEZONE`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` opcional
- `SUPABASE_SERVICE_ROLE_KEY` solo para procesos de servidor realmente privilegiados

## Arranque local

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Documentacion operativa

- Estado del proyecto: [docs/project-status.md](N:/projects/busescontrol/docs/project-status.md)
- Checklist de despliegue e integraciones: [docs/deployment-checklist.md](N:/projects/busescontrol/docs/deployment-checklist.md)
- Evidencia y checklist funcional de Sprint 1: [docs/smoke-test-sprint-1.md](N:/projects/busescontrol/docs/smoke-test-sprint-1.md)
- Checklist de fundacion: [docs/sprint-0-checklist.md](N:/projects/busescontrol/docs/sprint-0-checklist.md)

## Siguiente fase

Sprint 3 todavia no esta abierto en este release. `main` queda congelada en el cierre de Sprint 2 y cualquier nuevo alcance debe abrirse despues desde este baseline estable.
