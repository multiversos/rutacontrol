# AGENTS

## Contexto de producto

- Proyecto: `RutaControl`
- Uso: interno
- Roles: `admin`, `registrador`
- Los choferes no usan el sistema
- Una sola persona registra la operacion al final del dia
- Moneda operativa: bolivares con conversion a USD

## Estado actual del proyecto

- Sprint 0: cerrado
- Sprint 1: cerrado
- Sprint 2: cerrado
- Sprint 3: cerrado
- Sprint 4: cerrado
- Sprint 5: cerrado

## Reglas para futuros agentes

1. Trabajar por sprint y no mezclar alcances.
2. Mantener `daily_records` como tabla principal operativa del MVP.
3. Mantener `expenses` como detalle complementario hasta nuevo aviso.
4. No introducir Telegram, anomalias o reporting avanzado fuera del sprint correspondiente.
5. Mantener los calculos criticos en servidor o SQL; nunca depender solo del frontend.
6. Respetar `UNIQUE (bus_id, record_date)` en `daily_records`.
7. No debilitar RLS para mejorar UX.
8. Mantener `profiles` enlazada 1:1 con `auth.users(id)`.
9. Usar Server Actions para CRUD interno mientras siga aplicando esta arquitectura.

## Convenciones

- TypeScript estricto
- Import alias: `@/*`
- Componentes UI reutilizables en `components/ui`
- Clientes Supabase en `lib/supabase`
- Auth y guards en `lib/auth`
- Validadores de negocio en `lib/validators`
- ADRs en `docs/adr`

## Calidad minima antes de cerrar una fase

- Esquema SQL consistente con tipos TS
- Variables documentadas
- Rutas protegidas sin bypass
- Sin logica critica unicamente en cliente
- README y documentacion del sprint actualizados

## Fase actual permitida

Sprint 5 quedo cerrado con deudas, pagos parciales, reparaciones con comprobante y Storage operativos. Sprint 6 sigue pendiente y no iniciado; cualquier nuevo trabajo debe abrirse de forma explicita en una rama nueva y sin alterar la estabilidad de `main`.
