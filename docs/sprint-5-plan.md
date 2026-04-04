# Sprint 5 Plan

Estado: en implementacion sobre `sprint-5`.

## Alcance aprobado

1. modulo de deudas
2. saldo pendiente y pagos parciales
3. modulo de reparaciones por bus
4. comprobante obligatorio
5. historial de reparaciones por unidad
6. upload de archivos a Supabase Storage
7. proximo servicio sugerido por bus

## Implementado en codigo

- migracion [0006_debts_repairs.sql](N:/projects/busescontrol/supabase/migrations/0006_debts_repairs.sql)
- modulo admin `/dashboard/debts`
- modulo admin `/dashboard/repairs`
- pagos parciales con recalculo de saldo en SQL
- upload real a bucket privado `repair-receipts`
- RPC `create_repair_with_receipt(...)`
- historial y filtros de reparaciones por bus y rango
- proximo servicio sugerido por unidad

## Pendiente para cierre del sprint

1. aplicar `0006_debts_repairs.sql` en Supabase real
2. correr smoke tests reales de Sprint 5
3. verificar regresion de Sprint 1, 2, 3 y 4 con la migracion aplicada
