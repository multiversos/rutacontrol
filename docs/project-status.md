# Project Status

Fecha de actualizacion: 4 de abril de 2026.

## Estado por sprint

| Sprint | Estado | Nota |
| --- | --- | --- |
| Sprint 0 | Cerrado | Fundacion tecnica, auth base, migracion inicial y despliegue |
| Sprint 1 | Cerrado | MVP operable validado con smoke tests reales |
| Sprint 2 | Cerrado | Cierre operativo validado con smoke tests reales de base y regresion de Sprint 1 |
| Sprint 3 | En implementacion en `sprint-3` | Dashboard admin, KPIs, filtros, historial y auditoria visible |

## Resumen ejecutivo

RutaControl mantiene `main` estable en `v0.2.0-sprint2` y ya tiene una implementacion funcional de Sprint 3 trabajando sobre la rama `sprint-3`. El proyecto sigue conectado a GitHub, Supabase y Vercel, con smoke tests reales recientes sobre la rama activa.

## Estado real de infraestructura

| Capa | Estado | Detalle |
| --- | --- | --- |
| Git local | Verificado | Repositorio en `main` y listo para tag de cierre |
| GitHub remoto | Verificado | `origin` apunta a `https://github.com/multiversos/rutacontrol.git` |
| Supabase | Verificado | Proyecto real conectado con migraciones `0001`, `0002` y `0003` aplicadas |
| Vercel proyecto | Verificado | Proyecto enlazado y produccion activa |
| Vercel produccion | Verificado | [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app) |

## Criterios aprobados de Sprint 1

- Login admin: PASS
- Login registrador: PASS
- Redireccion por rol: PASS
- Acceso a dashboard autenticado: PASS
- CRUD de rutas: PASS
- CRUD de buses: PASS
- Creacion y edicion de `daily_records`: PASS
- `UNIQUE (bus_id, record_date)`: PASS
- Rechazo real de buses inactive: PASS
- Persistencia autenticada contra Supabase: PASS
- RLS basica: PASS

## Estado funcional actual

- Login operativo con Supabase Auth
- Roles `admin` y `registrador` operativos
- Dashboard protegido funcionando
- CRUD de rutas funcionando
- CRUD de buses funcionando
- Registros diarios funcionando con recalculo SQL
- Regla real de rechazo para buses `inactive` aplicada en base de datos
- Cierre automatico operativo para `daily_records`
- Bloqueo post-cierre operativo en app y base de datos
- `closure_hash` SHA-256 persistido e inmutable despues del cierre

## Estado de Sprint 2

Sprint 2 queda cerrado el 3 de abril de 2026 con este alcance aprobado:

1. cierre automatico
2. bloqueo post-cierre
3. hash SHA-256
4. diferencia de caja

## Criterios aprobados de Sprint 2

- `daily_records` incompletos como `draft`: PASS
- cierre automatico a `closed`: PASS
- persistencia de `closed_at`: PASS
- persistencia de `closure_hash`: PASS
- `closure_hash` inmutable tras cierre: PASS
- bloqueo real de edicion post-cierre: PASS
- diferencia de caja persistida correctamente: PASS
- regresion Sprint 1: PASS

## Evidencia operativa de cierre

- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- smoke tests reales de base sobre Supabase: PASS
- smoke tests de regresion de UI y autenticacion: PASS

## Estado de Sprint 3

Sprint 3 esta implementado en la rama `sprint-3` y pendiente de cierre formal. Alcance cubierto en esta rama:

1. dashboard admin real
2. KPIs operativos
3. filtros por rango de fecha y bus
4. historial semanal y mensual
5. auditoria basica visible
6. vista diferenciada por rol

Validacion mas reciente en `sprint-3`:

- login admin a `/dashboard`: PASS
- dashboard admin renderiza sin error: PASS
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
- regresion Sprint 1 y Sprint 2: PASS

## Estado de la siguiente fase

Sprint 3 no esta mergeado en `main` todavia. `main` sigue congelada como baseline estable despues del cierre de Sprint 2 y la preparacion de un eventual Sprint 4 queda fuera del alcance actual.

## Criterio exacto de cierre actual

Sprint 2 se considera formalmente cerrado desde este estado porque:

1. `main` esta estable y recuperable
2. el repo remoto de GitHub esta operativo
3. Supabase real esta conectado y validado
4. Vercel produccion esta desplegado
5. los smoke tests reales de Sprint 2 pasaron de punta a punta
6. la regresion de Sprint 1 sigue en PASS
