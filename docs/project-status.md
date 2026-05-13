# Project Status

Fecha de actualizacion: 13 de mayo de 2026.

## Estado por sprint

| Sprint | Estado | Nota |
| --- | --- | --- |
| Sprint 0 | Cerrado | Fundacion tecnica, auth base, migracion inicial y despliegue |
| Sprint 1 | Cerrado | MVP operable validado con smoke tests reales |
| Sprint 2 | Cerrado | Cierre operativo validado con smoke tests reales y regresion de Sprint 1 |
| Sprint 3 | Cerrado | Dashboard admin, KPIs, filtros, historial y auditoria visible validados |
| Sprint 4 | Cerrado | Alertas internas y monitoreo operativo sin Telegram |
| Sprint 5 | Cerrado | Deudas, pagos parciales, reparaciones con comprobante, Storage e historial por unidad validados |
| Sprint 6 | En rama separada | Caja operativa con ledger auditable en `codex/operational-cash-box` |

## Resumen ejecutivo

RutaControl mantiene una base funcional validada hasta Sprint 5. La rama `codex/operational-cash-box` abre Sprint 6 para Caja operativa: saldo derivado de ledger, entradas desde cierres diarios y salidas desde pagos de deuda marcados explicitamente como salidos de caja.

## Estado real de infraestructura

| Capa | Estado | Detalle |
| --- | --- | --- |
| Git local | Verificado | Rama de cierre `sprint-5` lista para integracion final a `main` |
| GitHub remoto | Verificado | `origin` apunta a [https://github.com/multiversos/rutacontrol](https://github.com/multiversos/rutacontrol) |
| Supabase | Verificado | Proyecto real conectado con migraciones `0001` a `0007` aplicadas |
| Vercel proyecto | Verificado | Proyecto enlazado y produccion activa |
| Vercel produccion | Verificado | [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app) |
| Android base | Preparado en rama | Plataforma `android/` creada con Capacitor, shell `/mobile`, fallback remoto y metadata de release interno |

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
- Modulo de deudas operativo con pagos parciales y saldo pendiente
- Modulo de reparaciones operativo con comprobante obligatorio y Storage real
- Historial de reparaciones por bus operativo
- Proximo servicio sugerido por unidad operativo
- Caja operativa en desarrollo sobre rama separada, sin merge ni deploy

## Estado de Sprint 5

Sprint 5 queda cerrado con este alcance:

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

## Estado de Sprint 6 en rama separada

Alcance activo de Caja operativa:

1. Ledger `operational_cash_movements`
2. Backfill de netos diarios cerrados existentes
3. Sincronizacion idempotente desde `daily_records`
4. Checkbox de pago desde Caja operativa en abonos de deuda
5. Sincronizacion idempotente desde `debt_payments`
6. Tarjeta e historial inicial en `/dashboard`
7. RLS admin-only para el ledger
8. Documentacion de funcionamiento y decisiones

Validacion del branch:

- Pendiente ejecutar `npm run typecheck`
- Pendiente ejecutar `npm run lint`
- Pendiente ejecutar `npm run build`
- Pendiente smoke local autenticado

## Estado de cierre

- Sprint 0: cerrado
- Sprint 1: cerrado
- Sprint 2: cerrado
- Sprint 3: cerrado
- Sprint 4: cerrado
- Sprint 5: cerrado el 4 de abril de 2026
- Sprint 6: abierto en rama separada para Caja operativa el 13 de mayo de 2026

## Pendiente siguiente fase

Sprint 6 queda abierto solo en rama separada para Caja operativa. No hay merge a `main` ni deploy sin aprobacion.
