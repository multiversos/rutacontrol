# Sprint 3 Plan

Estado: `implementado en rama sprint-3`, pendiente de cierre formal.

Punto de partida: `main` congelada en `v0.2.0-sprint2`

## Alcance ejecutado

Sprint 3 cubre solamente:

1. dashboard admin real
2. KPIs operativos
3. filtros por rango de fecha y bus
4. historial semanal y mensual
5. auditoria basica visible
6. vista diferenciada por rol

## Implementacion actual

- `/dashboard` muestra KPIs reales para admin:
  - ingreso del dia
  - neto del dia
  - diferencias abiertas
  - buses pendientes
- `/dashboard/daily` incorpora:
  - filtro por rango de fecha
  - filtro por bus
  - historial semanal
  - historial mensual
- `/dashboard/audit` expone auditoria visible para admin usando `audit_log`
- el registrador sigue aterrizando en `/dashboard/daily/new`
- el registrador no accede al dashboard admin

## Enfoque tecnico

- no se rehizo arquitectura
- no se agrego una migracion nueva porque `audit_log` y sus triggers ya existian
- los KPIs y resumentes leen datos server-side desde Supabase respetando RLS
- la auditoria visible reutiliza `audit_log` para `daily_records`
- `main` no fue tocada

## Smoke tests validados en `sprint-3`

- login admin a `/dashboard`: PASS
- dashboard admin sin error: PASS
- KPI ingreso del dia: PASS
- KPI neto del dia: PASS
- KPI diferencias abiertas: PASS
- KPI buses pendientes: PASS
- filtro por fecha: PASS
- filtro por bus: PASS
- historial semanal: PASS
- historial mensual: PASS
- auditoria visible para admin: PASS
- registrador sin acceso al dashboard admin: PASS
- registrador aterriza en `/dashboard/daily/new`: PASS
- creacion de `daily_records`: PASS
- cierre automatico: PASS
- edicion de cerrados bloqueada: PASS
- `UNIQUE (bus_id, record_date)`: PASS
- rechazo de buses `inactive`: PASS

## Evidencia operativa

- reporte: `C:\\Users\\parra\\AppData\\Local\\Temp\\rutacontrol-smoke-output\\sprint3-smoke-654779.json`
- HTML admin dashboard: `C:\\Users\\parra\\AppData\\Local\\Temp\\rutacontrol-smoke-output\\sprint3-admin-dashboard-654779.html`
- HTML historial: `C:\\Users\\parra\\AppData\\Local\\Temp\\rutacontrol-smoke-output\\sprint3-history-654779.html`
- HTML auditoria: `C:\\Users\\parra\\AppData\\Local\\Temp\\rutacontrol-smoke-output\\sprint3-audit-654779.html`

## Pendiente para cierre formal

- revision final del diff de `sprint-3`
- commits de cierre
- merge limpio hacia `main`
- tag de release de Sprint 3 cuando corresponda
