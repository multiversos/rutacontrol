# Sprint 6 Plan

Fecha de apertura: 9 de abril de 2026.

## Objetivo de esta rama

Preparar la base Android de RutaControl usando Capacitor y volver operativas las rutas moviles base (`/mobile`) para auth, registro diario, alertas, gastos complementarios y deudas, sin rehacer la aplicacion ni alterar backend, auth, reglas de negocio o esquema de base de datos.

## Alcance confirmado

1. Integracion de Capacitor con la app web existente
2. Plataforma Android creada y sincronizable
3. Shell movil separada del dashboard desktop
4. Navegacion base `Inicio`, `Registrar`, `Buses`, `Alertas`, `Mas`
5. Ajustes de viewport, safe area y teclado para telefono
6. Documentacion de comandos `sync`, `open` y `run`
7. Flujo real de login movil con redirects correctos
8. `/mobile/register` reutilizando la logica real de `daily_records`
9. `/mobile/register/expenses` para detalle complementario en `expenses`
10. `/mobile/register/debts` reutilizando modulo real de deudas
11. `/mobile/alerts` con alertas reales, priorizacion y marcado de lectura
12. `/mobile/buses` y `/mobile/buses/[id]` con perfil semanal y mensual real

## Fuera de alcance

1. Rehacer modulos de negocio completos para movil
2. Cambiar reglas de negocio
3. Cambiar esquema SQL o politicas RLS
4. Introducir nuevas integraciones externas
5. Reportes historicos complejos, push notifications u offline

## Decision tecnica

La base Android usa Capacitor como contenedor nativo y abre la misma app Next.js ya existente en una ruta movil dedicada (`/mobile`). Asi mantenemos SSR, Supabase Auth, Server Actions y calculos criticos del servidor sin duplicar logica. Los modulos moviles nuevos reutilizan acciones, loaders, schemas y restricciones actuales; solo cambia la presentacion y la navegacion para telefono.

## Cierre de release interno Android

Documento operativo: [sprint-6-android-release.md](./sprint-6-android-release.md)

El cierre de Android agrega pulido nativo sin ampliar negocio:

1. `appStartPath=/mobile` y `server.errorPath=index.html` para arranque remoto y fallback local.
2. Status bar, safe areas, teclado y back button Android ajustados.
3. Guard movil de red/error con `@capacitor/network`.
4. Mensaje claro para sesion vencida o token invalido.
5. Metadata interna ordenada: `com.multiversos.rutacontrol`, `0.6.0-internal.1`, `60001`.
6. Documentacion de APK/AAB, keystore pendiente y checklist QA manual.
