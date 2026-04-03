# ADR 0001: Base tecnica y modelo operativo

- Estado: Aprobado
- Fecha: 2026-04-02
- Actualizado: 2026-04-02

## Contexto

RutaControl arranca desde cero para una operacion interna pequena, con dos roles y una sola persona registrando la informacion diaria al final del dia. La prioridad es una base robusta y simple que minimice retrabajo cuando empiece el MVP operable y que no obligue a relajar seguridad para mejorar UX.

## Decisiones

### 1. `profiles` ligada 1:1 a `auth.users`

No se crea una tabla `users` paralela. La identidad vive en Supabase Auth y `public.profiles` extiende esa identidad con `name`, `role`, `active` y `last_login`.

### 2. Calculos criticos en base de datos

`income_usd`, `calculated_net` y `difference` se recalculan en SQL mediante trigger. El frontend puede mostrar calculos en vivo, pero no es la fuente final de verdad.

### 3. Seguridad desde el dia uno

Todas las tablas expuestas al cliente usan RLS. Los permisos se apoyan en helpers de rol y perfil activo. El registrador solo opera lo necesario; el admin conserva control operativo. El proyecto no usa `service_role` para exponer datos globales al cliente.

### 4. Server Actions para el CRUD interno

Para el MVP se priorizan Server Actions dentro de Next.js App Router. Esto reduce superficie tecnica, evita una capa API innecesaria en esta etapa y mantiene la logica cerca de la UI.

### 5. Segmento real `dashboard` en App Router

La operacion protegida vive en `app/dashboard/...`, no en un route group omitido. Esto garantiza que las URLs reales coincidan con `/dashboard`, `/dashboard/buses`, `/dashboard/routes`, `/dashboard/daily` y `/dashboard/daily/new`.

### 6. Proxy de proteccion y session gating

El proxy y los helpers de sesion expulsan usuarios sin `profiles` o con `profiles.active = false` para evitar estados ambiguos donde la UI navega pero RLS bloquea despues.

### 7. Zona horaria de negocio fija

Se define `America/Caracas` como zona horaria operativa para interpretacion de fechas y cierres. Los timestamps siguen almacenandose en UTC.

## Consecuencias

- El proyecto queda listo para pruebas manuales reales una vez existan credenciales de Supabase.
- `npm install`, `npm run typecheck`, `npm run lint` y `npm run build` ya fueron ejecutados localmente con exito.
- Git local ya esta inicializado; el remoto sigue pendiente por falta de un repositorio destino accesible.
- La logica de cierre total queda preparada, pero no activada por completo hasta Sprint 2.
