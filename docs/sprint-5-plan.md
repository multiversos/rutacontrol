# Sprint 5 Plan

Estado: cerrado el 4 de abril de 2026.

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

## Criterios aprobados

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

## Resultado de cierre

Sprint 5 queda validado en entorno real con:

1. tablas `debts`, `debt_payments`, `repairs` y `repair_attachments` activas en Supabase
2. pagos parciales y cambio de estado operativos
3. reparaciones con comprobante real subido a Supabase Storage
4. historial por bus visible para admin
5. proximo servicio sugerido persistido y visible
6. restriccion de acceso para `registrador` validada
