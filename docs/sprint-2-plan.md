# Sprint 2 Plan

Estado: `abierto para ejecucion controlada`.

Rama de trabajo recomendada: `sprint-2`

Punto de partida: tag `v0.1.0-sprint1`

## Alcance estricto

Sprint 2 solo puede cubrir estos cuatro temas:

1. cierre automatico
2. bloqueo post-cierre
3. hash SHA-256
4. diferencia de caja

## Fuera de alcance

- Telegram
- deudas
- reparaciones
- anomaly engine
- reporting avanzado
- cambios de arquitectura
- rediseño de UI fuera de lo necesario para cierre operativo

## Reglas de negocio exactas

1. Un `daily_record` debe poder pasar de `draft` a `closed`.
2. El cierre debe calcularse del lado servidor o SQL, nunca solo en cliente.
3. Un registro cerrado no debe aceptar edicion posterior desde app ni desde acceso directo a base sin permiso explicito de administracion de infraestructura.
4. El cierre debe generar un `closure_hash` SHA-256 reproducible a partir de un conjunto estable de campos del registro.
5. La diferencia de caja debe quedar persistida y visible como parte del estado de cierre.
6. Si el registro ya esta cerrado, cualquier intento de mutacion debe fallar con mensaje claro en la app y con enforcement real en la capa de datos.

## Criterios de aceptacion

- Existe una accion de cierre operativa para `daily_records`.
- Al cerrar, el registro cambia a `status = closed`.
- `closed_at` queda persistido.
- `closure_hash` queda persistido con valor SHA-256 valido.
- La diferencia de caja queda calculada y persistida segun la regla de negocio definida.
- Un registro `closed` no puede editarse desde la UI.
- Un registro `closed` no puede actualizarse por acceso directo autenticado si la policy o trigger no lo permite.
- Los smoke tests de Sprint 1 siguen pasando despues del cambio.
- Existen pruebas manuales claras para cierre, reintento de edicion y bloqueo post-cierre.

## Fases de ejecucion propuestas

### Fase 1

- Definir contrato exacto de cierre sobre `daily_records`
- Confirmar campos fuente del hash
- Acordar la formula final de diferencia de caja

### Fase 2

- Crear migracion incremental para reforzar cierre en SQL
- Ajustar triggers, policies y funciones relacionadas
- Mantener compatibilidad con el esquema ya estable de Sprint 1

### Fase 3

- Implementar accion de cierre en servidor
- Bloquear edicion en rutas y formularios cuando el estado sea `closed`
- Mostrar mensajes operativos claros

### Fase 4

- Ejecutar regresion completa de Sprint 1
- Ejecutar smoke tests especificos de cierre
- Documentar evidencia de cierre de Sprint 2

## Archivos probables a tocar

- `supabase/migrations/0003_daily_record_closure.sql`
- `app/dashboard/daily/actions.ts`
- `app/dashboard/daily/page.tsx`
- `app/dashboard/daily/new/page.tsx`
- `components/daily-form.tsx`
- `components/daily-table.tsx`
- `lib/validators/daily-record.ts`
- `docs/project-status.md`
- `docs/smoke-test-sprint-1.md` solo si hiciera falta ampliar regresion

## Validaciones esperadas

- Cerrar un registro `draft` como `admin`
- Cerrar un registro `draft` como `registrador` solo si el negocio lo permite
- Intentar editar un registro ya cerrado desde la UI
- Intentar editar un registro ya cerrado por acceso directo a Supabase
- Confirmar que el hash no cambia si el registro no cambia
- Confirmar que el hash cambia si cambian los campos fuente antes del cierre
- Confirmar que la diferencia de caja queda alineada con los montos persistidos
- Confirmar que no se rompe `UNIQUE (bus_id, record_date)` ni la regla de buses activos

## Riesgos principales

- Ambiguedad en la formula final de diferencia de caja
- Definicion incompleta de los campos fuente del hash
- Doble enforcement entre app y SQL con mensajes inconsistentes
- Romper los smoke tests ya aprobados de Sprint 1

## Criterio de inicio

Sprint 2 puede arrancar sin ambiguedad desde este branch cuando:

1. el equipo acepte esta delimitacion de alcance
2. se confirme la formula exacta de diferencia de caja
3. se confirme el set exacto de campos que alimenta `closure_hash`
