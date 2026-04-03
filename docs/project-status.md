# Project Status

Fecha de corte: 2 de abril de 2026.

## Resumen ejecutivo

RutaControl quedo implementado y verificado localmente como `Sprint 1 listo para conexion externa`. La base funcional del MVP ya esta estable: auth con Supabase SSR, roles `admin` y `registrador`, CRUD de rutas, CRUD de buses, registros diarios con filtros y recalculo financiero en SQL.

## Estado por capa

| Capa | Estado | Detalle |
| --- | --- | --- |
| Codigo de aplicacion | Listo | Estructura App Router y modulos de Sprint 1 cerrados |
| Validacion local | Verificado | `npm install`, `typecheck`, `lint` y `build` en verde |
| Git local | Verificado | Repo inicializado en `main` y limpio |
| GitHub remoto | Pendiente externo | `origin` configurado, pero el repo remoto no existe o no es accesible |
| Supabase | Pendiente externo | No hay proyecto real enlazado ni secretos disponibles |
| Vercel proyecto | Configurado | Proyecto creado y enlazado |
| Vercel despliegue | Verificado | Produccion y preview desplegados |

## Estado exacto hoy

- Produccion activa en [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app)
- Preview activa en [https://rutacontrol-9fz7i3mzn-multiversos-4148s-projects.vercel.app](https://rutacontrol-9fz7i3mzn-multiversos-4148s-projects.vercel.app)
- `origin` local: `https://github.com/multiversos/rutacontrol.git`
- Variables cargadas en Vercel produccion:
  - `NEXT_PUBLIC_APP_NAME`
  - `BUSINESS_TIMEZONE`
  - `NEXT_PUBLIC_SITE_URL`

## Bloqueos externos actuales

- El repo `multiversos/rutacontrol` no esta disponible para push desde este entorno.
- No existe un proyecto Supabase autenticado y enlazado.
- No existen aun `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Sin Supabase real no se puede ejecutar login operativo, CRUD persistente ni smoke test funcional.

## Criterio exacto para cerrar Sprint 1

Sprint 1 se cierra cuando se cumplan estas condiciones, sin agregar alcance nuevo:

1. GitHub remoto operativo: `git push -u origin main` exitoso y rama `main` visible en el repo remoto.
2. Supabase operativo: proyecto creado, enlazado, migracion aplicada y seed ejecutado.
3. Configuracion operativa: variables publicas de Supabase disponibles en `.env.local` y en Vercel produccion.
4. Usuarios de prueba creados: al menos un `admin` activo y un `registrador` activo con perfil sincronizado en `public.profiles`.
5. Smoke test aprobado: todos los checks de [docs/smoke-test-sprint-1.md](N:/projects/busescontrol/docs/smoke-test-sprint-1.md) pasan.

## Handoff recomendado

El siguiente paso no es desarrollar mas producto. El siguiente paso es conectar GitHub remoto, crear Supabase real, cargar las variables faltantes y ejecutar el smoke test de Sprint 1.
