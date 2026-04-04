# Smoke Test Sprint 1

Estado del checklist: `aprobado`.

Fecha de aprobacion: 3 de abril de 2026.

## Resultado final

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

## Evidencia funcional consolidada

- Produccion validada en [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app)
- Supabase real validado con usuarios `admin` y `registrador`
- Insercion directa autenticada para bus `inactive` rechazada por base de datos
- Creacion y edicion autenticada con bus `active` funcionando de punta a punta

## Uso futuro de este documento

Este archivo queda como referencia de cierre de Sprint 1. Si mas adelante se detecta una regresion, este checklist marca el piso funcional minimo que no se debe romper.
