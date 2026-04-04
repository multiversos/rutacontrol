# Project Status

Fecha de actualizacion: 3 de abril de 2026.

## Estado por sprint

| Sprint | Estado | Nota |
| --- | --- | --- |
| Sprint 0 | Cerrado | Fundacion tecnica, auth base, migracion inicial y despliegue |
| Sprint 1 | Cerrado | MVP operable validado con smoke tests reales |
| Sprint 2 | Cerrado | Cierre operativo validado con smoke tests reales y regresion de Sprint 1 |
| Sprint 3 | Cerrado | Dashboard admin, KPIs, filtros, historial y auditoria visible validados |
| Sprint 4 | Cerrado | Alertas internas y monitoreo operativo sin Telegram |
| Sprint 5 | En implementacion en `sprint-5` | Deudas, pagos parciales, reparaciones con comprobante y Storage |

## Resumen ejecutivo

RutaControl mantiene una base funcional validada hasta Sprint 4 y ya tiene Sprint 5 implementado en codigo sobre la rama `sprint-5`. La rama nueva agrega los modulos administrativos de deudas y reparaciones, con uploads reales a Supabase Storage y consistencia de saldo en SQL.

## Estado real de infraestructura

| Capa | Estado | Detalle |
| --- | --- | --- |
| Git local | Verificado | Rama de trabajo actual `sprint-5` |
| GitHub remoto | Verificado | `origin` apunta a [https://github.com/multiversos/rutacontrol](https://github.com/multiversos/rutacontrol) |
| Supabase | Parcial | Proyecto real conectado; Sprint 5 requiere aplicar `0006_debts_repairs.sql` |
| Vercel proyecto | Verificado | Proyecto enlazado y produccion activa |
| Vercel produccion | Verificado | [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app) |

## Estado funcional cerrado

- Login operativo con Supabase Auth
- Roles `admin` y `registrador` operativos
- Dashboard admin operativo con KPIs reales
- CRUD de rutas funcionando
- CRUD de buses funcionando
- Registros diarios funcionando con recalculo SQL
- Rechazo real para buses `inactive`
- Cierre automatico operativo para `daily_records`
- Bloqueo post-cierre operativo en app y base de datos
- `closure_hash` SHA-256 persistido e inmutable
- Historial semanal y mensual operativo
- Auditoria visible para admin operativa
- Alertas internas operativas sin Telegram

## Estado de Sprint 5

Sprint 5 queda implementado en codigo con este alcance:

1. modulo de deudas
2. pagos parciales y saldo pendiente
3. modulo de reparaciones por bus
4. comprobante obligatorio
5. historial de reparaciones por unidad
6. upload a Supabase Storage
7. proximo servicio sugerido por bus

Estado actual de validacion:

- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- rutas admin nuevas (`/dashboard/debts`, `/dashboard/repairs`) compiladas: PASS
- degradacion segura si la migracion `0006_debts_repairs.sql` aun no esta aplicada: PASS
- migracion `0006_debts_repairs.sql` aplicada en Supabase real: PENDIENTE
- smoke tests reales de Sprint 5: PENDIENTES por apply real de `0006`

## Bloqueo externo actual

La base real todavia no tiene estas tablas en cache REST:

- `public.debts`
- `public.debt_payments`
- `public.repairs`
- `public.repair_attachments`

Evidencia real observada desde la rama:

- `debts`: `404 PGRST205`
- `debt_payments`: `404 PGRST205`
- `repairs`: `404 PGRST205`
- `repair_attachments`: `404 PGRST205`

## Siguiente paso exacto

Aplicar en Supabase SQL Editor el contenido completo de:

- [supabase/migrations/0006_debts_repairs.sql](N:/projects/busescontrol/supabase/migrations/0006_debts_repairs.sql)

Despues de eso, la rama `sprint-5` ya queda lista para correr los smoke tests reales de:

- creacion de deuda
- pagos parciales y cambio de estado
- reparacion con comprobante real
- historial por bus
- upload a Storage
- bloqueo de acceso para `registrador`
