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
- Sprint 3: no iniciado

## Reglas para futuros agentes

1. Trabajar por sprint y no mezclar alcances.
2. Mantener `daily_records` como tabla principal operativa del MVP.
3. Mantener `expenses` como detalle complementario hasta nuevo aviso.
4. No introducir modulos de deudas, reparaciones, Telegram, anomalias o reporting avanzado antes de tiempo.
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

## Proxima fase permitida

Sprint 3 todavia no esta abierto. Cualquier trabajo nuevo debe partir desde `main` despues del tag `v0.2.0-sprint2` y abrirse con alcance explicito antes de implementarse.
