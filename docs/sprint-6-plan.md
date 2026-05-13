# Sprint 6 Plan

Fecha de apertura original: 9 de abril de 2026.

Actualizacion de alcance en rama `codex/operational-cash-box`: 13 de mayo de 2026.

## Alcance activo de esta rama

Implementar Caja operativa como ledger auditable del dinero disponible acumulado:

1. Nueva tabla `operational_cash_movements` como historial de movimientos.
2. Backfill no destructivo de netos de `daily_records` ya cerrados.
3. Entradas automaticas desde `daily_records.status = 'closed'`.
4. Actualizacion idempotente del movimiento si se corrige un registro diario cerrado.
5. Soporte para netos negativos como salida de Caja operativa.
6. Columna `debt_payments.paid_from_operational_cash` para pagos marcados por el admin.
7. Salidas automaticas desde pagos de deuda solo cuando el checkbox este marcado.
8. Indices unicos parciales por `daily_record_id` y `debt_payment_id` para evitar duplicados.
9. RLS admin-only para lectura/escritura directa del ledger.
10. Tarjeta e historial inicial en `/dashboard`.
11. Integracion del checkbox en el formulario de abonos de `/dashboard/debts`.

## Decisiones de Caja operativa

- El saldo no se guarda como fuente de verdad; se deriva de la suma del ledger.
- Los movimientos automaticos ligados a registros diarios y pagos se actualizan en lugar de duplicarse.
- Si un registro cerrado volviera a `draft`, el movimiento asociado queda en monto `0` y direccion `adjustment`; no se borra la fila para conservar trazabilidad.
- Los pagos de deuda existentes antes de esta rama no descuentan Caja operativa porque no hay evidencia historica del origen del dinero.
- Los ajustes manuales quedan contemplados en el esquema (`manual_adjustment`), pero no se habilita UI de ajuste en esta primera version.

## Objetivo historico Android

Preparar la base Android de RutaControl usando Capacitor y volver operativas las rutas moviles base (`/mobile`) para auth, registro diario, alertas, gastos complementarios y deudas, sin rehacer la aplicacion ni alterar backend, auth, reglas de negocio o esquema de base de datos.

## Alcance confirmado

1. Integracion de Capacitor con la app web existente
2. Plataforma Android creada y sincronizable
3. Shell movil separada del dashboard desktop
4. Navegacion base `Inicio`, `Registrar`, `Buses`, `Alertas`, `Mas`
5. Ajustes de viewport, safe area y teclado para telefono
6. Documentacion de comandos `sync`, `open` y `run`
7. Flujo real de login movil con redirects correctos
8. `/mobile/register` reutilizando la logica real de `daily_records`
9. `/mobile/register/expenses` para detalle complementario en `expenses`
10. `/mobile/register/debts` reutilizando modulo real de deudas
11. `/mobile/alerts` con alertas reales, priorizacion y marcado de lectura
12. `/mobile/buses` y `/mobile/buses/[id]` con perfil semanal y mensual real

## Fuera de alcance

1. Rehacer modulos de negocio completos para movil
2. Cambiar reglas de negocio
3. Cambiar esquema SQL o politicas RLS
4. Introducir nuevas integraciones externas
5. Reportes historicos complejos, push notifications u offline

## Decision tecnica

La base Android usa Capacitor como contenedor nativo y abre la misma app Next.js ya existente en una ruta movil dedicada (`/mobile`). Asi mantenemos SSR, Supabase Auth, Server Actions y calculos criticos del servidor sin duplicar logica. Los modulos moviles nuevos reutilizan acciones, loaders, schemas y restricciones actuales; solo cambia la presentacion y la navegacion para telefono.

## Cierre de release interno Android

Documento operativo: [sprint-6-android-release.md](./sprint-6-android-release.md)

El cierre de Android agrega pulido nativo sin ampliar negocio:

1. `appStartPath=/mobile` y `server.errorPath=index.html` para arranque remoto y fallback local.
2. Status bar, safe areas, teclado y back button Android ajustados.
3. Guard movil de red/error con `@capacitor/network`.
4. Mensaje claro para sesion vencida o token invalido.
5. Metadata interna ordenada: `com.multiversos.rutacontrol`, `0.6.0-internal.1`, `60001`.
6. Documentacion de APK/AAB, keystore pendiente y checklist QA manual.
