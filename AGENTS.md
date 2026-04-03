# AGENTS

## Contexto de producto

- Proyecto: **RutaControl**
- Uso: interno
- Roles: `admin`, `registrador`
- Los choferes no usan el sistema
- Una sola persona registra la operación al final del día
- Moneda operativa: bolívares con conversión a USD

## Reglas para futuros agentes

1. Trabajar por sprint, sin mezclar alcances.
2. No introducir módulos de deudas, reparaciones, Telegram, anomalías o reporting avanzado antes de tiempo.
3. Mantener los cálculos críticos en servidor o SQL; nunca depender solo del frontend.
4. Respetar la restricción `UNIQUE (bus_id, record_date)` en `daily_records`.
5. Usar español en UI y documentación de producto; inglés en código.
6. Mantener la tabla `profiles` enlazada 1:1 con `auth.users(id)`.
7. No debilitar RLS para acelerar desarrollo.
8. Priorizar Server Actions para CRUD interno del MVP; reservar `app/api` para integraciones externas.

## Convenciones

- TypeScript estricto
- Import alias: `@/*`
- Componentes de UI reutilizables en `components/ui`
- Clientes Supabase en `lib/supabase`
- Auth y guards en `lib/auth`
- Validadores de negocio en `lib/validators`
- ADRs en `docs/adr`

## Calidad mínima antes de cerrar una fase

- Esquema SQL consistente con tipos TS
- Variables documentadas
- Rutas protegidas sin bypass
- Sin lógica crítica únicamente en cliente
- README y checklist actualizados
