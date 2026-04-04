# RutaControl

Estado del repositorio: `Sprint 1 cerrado`.

RutaControl es una aplicacion web interna para registrar la operacion diaria y financiera de una empresa de buses de pasajeros. El MVP actual cubre autenticacion con Supabase Auth, roles `admin` y `registrador`, CRUD de rutas, CRUD de buses y registros diarios con recalculo financiero en SQL.

## Estado actual

- Sprint 0: cerrado
- Sprint 1: cerrado el 3 de abril de 2026
- Sprint 2: no implementado todavia

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
- Supabase real conectado con esquema, seed y smoke tests autenticados ejecutados
- Vercel produccion activo en [rutacontrol.vercel.app](https://rutacontrol.vercel.app)

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

La siguiente fase es Sprint 2. Su alcance todavia no esta implementado y debe limitarse a:

1. cierre automatico
2. bloqueo post-cierre
3. hash SHA-256
4. diferencia de caja
