# Sprint 4 Plan

Estado: `implementado en rama sprint-4`, pendiente de validacion completa en Supabase real.

Punto de partida: `main` congelada en `v0.3.0-sprint3`

## Alcance ejecutado

Sprint 4 cubre solamente:

1. sistema interno de alertas visible para admin
2. alertas de `login`, `closure`, `difference` y `missing`
3. filtros por severidad, estado, fecha y bus
4. marcado de alertas como leidas
5. monitoreo operativo sin Telegram ni canales externos

## Decisiones de implementacion

- Telegram queda fuera de alcance y no se implementa ninguna integracion externa.
- La logica principal de alertas vive en servidor y base de datos.
- `closure` y `difference` se generan desde trigger sobre `daily_records`.
- `login` se genera desde la Server Action de acceso usando RPC autenticada.
- `missing` se reconcilia de forma idempotente al cargar dashboard y alertas para no depender de cron externo.

## Criterio de severidad

- `info`: login del registrador y cierre diario completado.
- `warning`: bus activo sin cierre o diferencia absoluta entre `0.01` y `9.99` USD.
- `critical`: diferencia absoluta mayor o igual a `10.00` USD.

## Idempotencia y deduplicacion

- `closure:<daily_record_id>`
- `difference:<daily_record_id>`
- `missing:<bus_id>:<record_date>`

Las alertas se almacenan con `dedupe_key` unica para evitar duplicados absurdos al recalcular la misma condicion.

## Archivos principales

- `supabase/migrations/0004_internal_alerts.sql`
- `lib/alerts.ts`
- `app/dashboard/alerts/page.tsx`
- `app/dashboard/alerts/actions.ts`
- `components/alert-table.tsx`
- `components/alert-badge.tsx`

## Validacion actual

- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- smoke web local de roles para `/dashboard/alerts`: PASS
- validacion real de `alerts` en Supabase: pendiente

## Bloqueo actual

La base real de Supabase todavia no tiene aplicada `0004_internal_alerts.sql`. Hasta que esa migracion exista en el proyecto real:

- `public.alerts` no existe
- `public.reconcile_missing_closure_alerts` no existe
- la UI de alertas entra en modo seguro y no muestra datos reales
- no se pueden cerrar los smoke tests de generacion de alertas
