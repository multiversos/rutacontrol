# RutaControl

Estado del repositorio: `Sprint 5 cerrado`.

En la rama de trabajo de Sprint 6 ya existe una base Android con Capacitor y una shell movil propia bajo `/mobile`, sin tocar la logica de negocio ni el esquema SQL.

RutaControl es una aplicacion web interna para registrar la operacion diaria y financiera de una empresa de buses de pasajeros. El estado actual cubre autenticacion con Supabase Auth, roles `admin` y `registrador`, CRUD de rutas, CRUD de buses, registros diarios con recalculo financiero en SQL, cierre automatico operativo, dashboard administrativo con KPIs, historial, auditoria visible, alertas internas, deudas con pagos parciales y reparaciones con comprobante y uploads reales a Supabase Storage.

## Estado actual

- Sprint 0: cerrado
- Sprint 1: cerrado el 3 de abril de 2026
- Sprint 2: cerrado el 3 de abril de 2026
- Sprint 3: cerrado el 3 de abril de 2026
- Sprint 4: cerrado el 3 de abril de 2026
- Sprint 5: cerrado el 4 de abril de 2026

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

## Criterios aprobados de Sprint 2

- `daily_records` incompletos como `draft`: PASS
- cierre automatico a `closed`: PASS
- persistencia de `closed_at`: PASS
- persistencia de `closure_hash`: PASS
- `closure_hash` inmutable tras cierre: PASS
- bloqueo real de edicion post-cierre: PASS
- diferencia de caja persistida correctamente: PASS
- regresion Sprint 1: PASS

## Criterios aprobados de Sprint 3

- login admin -> `/dashboard`: PASS
- dashboard admin renderiza: PASS
- KPI ingreso del dia: PASS
- KPI neto del dia: PASS
- KPI diferencias abiertas: PASS
- KPI buses pendientes: PASS
- filtro por fecha: PASS
- filtro por bus: PASS
- historial semanal: PASS
- historial mensual: PASS
- auditoria visible para admin: PASS
- registrador fuera del dashboard admin: PASS
- regresion Sprint 1 y Sprint 2: PASS

## Infraestructura verificada

- GitHub remoto operativo en [multiversos/rutacontrol](https://github.com/multiversos/rutacontrol)
- Supabase real conectado con migraciones `0001`, `0002`, `0003`, `0004`, `0005`, `0006` y `0007` aplicadas
- Vercel produccion activo en [rutacontrol.vercel.app](https://rutacontrol.vercel.app)

## Stack

- Next.js App Router
- TypeScript estricto
- Tailwind CSS
- Supabase SSR
- Vercel
- Capacitor Android

## Rutas activas del MVP

- `/login`
- `/dashboard`
- `/dashboard/routes`
- `/dashboard/buses`
- `/dashboard/daily`
- `/dashboard/daily/new`
- `/dashboard/debts`
- `/dashboard/repairs`

## Rutas base movil

- `/mobile`
- `/mobile/register`
- `/mobile/buses`
- `/mobile/alerts`
- `/mobile/more`

## Criterios aprobados de Sprint 5

- modulo de deudas: PASS
- deuda nueva en `pending`: PASS
- pago parcial: PASS
- paso a `partial`: PASS
- pago total y paso a `paid`: PASS
- modulo de reparaciones: PASS
- reparacion con comprobante real: PASS
- reparacion invalida sin comprobante: PASS
- historial por bus: PASS
- proximo servicio sugerido: PASS
- registrador fuera de `/dashboard/debts`: PASS
- registrador fuera de `/dashboard/repairs`: PASS
- regresion Sprint 1, 2, 3 y 4: PASS

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

## Base Android con Capacitor

Arquitectura aplicada:

- Capacitor envuelve la app Next.js existente como contenedor Android
- La app Android apunta al origen remoto y arranca con `appStartPath=/mobile`
- El fallback local `capacitor-shell/index.html` cubre fallo inicial de carga remota con reintento
- SSR, Supabase Auth, Server Actions y calculos criticos siguen ocurriendo en servidor
- La web desktop se mantiene intacta; la experiencia movil vive en rutas separadas
- Back button, status bar, teclado, safe areas y estado de red se atienden solo en la experiencia movil

Scripts disponibles:

```bash
npm run android:doctor
npm run android:sync
npm run android:open
npm run android:run
```

Flujo recomendado:

```bash
# shell Android contra produccion o staging
set CAPACITOR_SERVER_URL=https://rutacontrol.vercel.app/mobile
npm run android:sync
npm run android:open

# desarrollo local con emulador Android
set CAPACITOR_SERVER_URL=http://10.0.2.2:3000/mobile
npm run dev
npm run android:sync
npm run android:run
```

Notas:

- `CAPACITOR_SERVER_URL` debe incluir la ruta `/mobile`
- En emulador Android, `10.0.2.2` apunta al `localhost` de tu maquina
- La carpeta `capacitor-shell/` existe como `webDir` minima y como fallback `server.errorPath`
- Metadata Android: `applicationId` `com.multiversos.rutacontrol`, `versionName` `0.6.0-internal.1`, `versionCode` `60001`
- Release interno firmado requiere keystore fuera del repo y variables `RUTACONTROL_RELEASE_*`

## Documentacion operativa

- Estado del proyecto: [docs/project-status.md](N:/projects/busescontrol/docs/project-status.md)
- Checklist de despliegue e integraciones: [docs/deployment-checklist.md](N:/projects/busescontrol/docs/deployment-checklist.md)
- Evidencia y checklist funcional de Sprint 1: [docs/smoke-test-sprint-1.md](N:/projects/busescontrol/docs/smoke-test-sprint-1.md)
- Checklist de fundacion: [docs/sprint-0-checklist.md](N:/projects/busescontrol/docs/sprint-0-checklist.md)
- Plan de Sprint 6 Android: [docs/sprint-6-plan.md](N:/projects/busescontrol/docs/sprint-6-plan.md)
- Cierre Android release interno: [docs/sprint-6-android-release.md](N:/projects/busescontrol/docs/sprint-6-android-release.md)

## Siguiente fase

Sprint 6 queda abierto de forma explicita en una rama separada para la base Android con Capacitor. La base estable tras Sprint 5 sigue incluyendo deudas, pagos parciales, reparaciones con comprobante, historial por unidad y proximo servicio sugerido, sin abrir trabajo funcional nuevo de negocio fuera del roadmap.
