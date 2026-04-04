# Project Status

Fecha de actualizacion: 3 de abril de 2026.

## Estado por sprint

| Sprint | Estado | Nota |
| --- | --- | --- |
| Sprint 0 | Cerrado | Fundacion tecnica, auth base, migracion inicial y despliegue |
| Sprint 1 | Cerrado | MVP operable validado con smoke tests reales |
| Sprint 2 | No iniciado | Solo abierto a nivel de planificacion, sin features implementadas |

## Resumen ejecutivo

RutaControl quedo estable en `main` con Sprint 1 cerrado. El proyecto ya esta conectado a GitHub, Supabase y Vercel, y los criterios aprobados del MVP quedaron verificados en entorno real.

## Estado real de infraestructura

| Capa | Estado | Detalle |
| --- | --- | --- |
| Git local | Verificado | Repositorio en `main` y listo para tag de cierre |
| GitHub remoto | Verificado | `origin` apunta a `https://github.com/multiversos/rutacontrol.git` |
| Supabase | Verificado | Proyecto real conectado, esquema y seeds aplicados |
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

## Estado de Sprint 2

Sprint 2 todavia no esta implementado. El siguiente alcance permitido es:

1. cierre automatico
2. bloqueo post-cierre
3. hash SHA-256
4. diferencia de caja

## Criterio exacto de cierre actual

Sprint 1 se considera formalmente cerrado desde este estado porque:

1. `main` esta estable y recuperable
2. el repo remoto de GitHub esta operativo
3. Supabase real esta conectado y validado
4. Vercel produccion esta desplegado
5. los smoke tests autenticados pasaron de punta a punta
