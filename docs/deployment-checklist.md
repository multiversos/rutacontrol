# Deployment Checklist

Estado del checklist: `completado para Sprint 1`.

## GitHub remoto

- [x] Repositorio remoto disponible en [multiversos/rutacontrol](https://github.com/multiversos/rutacontrol)
- [x] `origin` configurado correctamente
- [x] `main` sincronizada con el remoto
- [x] Release tag de Sprint 1 pendiente de creacion local en esta fase de cierre

## Supabase

- [x] Proyecto real de Supabase conectado
- [x] Variables publicas cargadas en Vercel
- [x] `supabase/migrations/0001_core.sql` aplicado
- [x] `supabase/seed.sql` aplicado
- [x] `supabase/migrations/0002_daily_records_require_active_bus.sql` aplicado
- [x] Auth, RLS y persistencia autenticada verificados

## Vercel

- [x] Proyecto enlazado
- [x] Variables publicas necesarias cargadas
- [x] Produccion operativa en [rutacontrol.vercel.app](https://rutacontrol.vercel.app)
- [x] Smoke tests autenticados ejecutados sobre produccion

## Estado final

La capa de infraestructura necesaria para Sprint 1 quedo cerrada. No hay pasos operativos pendientes para usar el MVP actual; el siguiente trabajo ya pertenece a Sprint 2.
