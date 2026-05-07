# Project Status

Fecha de actualizacion: 9 de abril de 2026.

## Estado por sprint

| Sprint | Estado | Nota |
| --- | --- | --- |
| Sprint 0 | Cerrado | Fundacion tecnica, auth base, migracion inicial y despliegue |
| Sprint 1 | Cerrado | MVP operable validado con smoke tests reales |
| Sprint 2 | Cerrado | Cierre operativo validado con smoke tests reales y regresion de Sprint 1 |
| Sprint 3 | Cerrado | Dashboard admin, KPIs, filtros, historial y auditoria visible validados |
| Sprint 4 | Cerrado | Alertas internas y monitoreo operativo sin Telegram |
| Sprint 5 | Cerrado | Deudas, pagos parciales, reparaciones con comprobante, Storage e historial por unidad validados |
| Sprint 6 | En rama separada | Base Android con Capacitor, experiencia movil y preparacion de release interno sobre logica existente |

## Resumen ejecutivo

RutaControl mantiene una base funcional validada hasta Sprint 5. En una rama separada de Sprint 6 ya existe una base Android con Capacitor, una shell movil propia y una experiencia movil operativa para telefono sobre la misma logica actual, sin alterar backend, auth, RLS ni esquema SQL.

## Estado real de infraestructura

| Capa | Estado | Detalle |
| --- | --- | --- |
| Git local | Verificado | Rama de cierre `sprint-5` lista para integracion final a `main` |
| GitHub remoto | Verificado | `origin` apunta a [https://github.com/multiversos/rutacontrol](https://github.com/multiversos/rutacontrol) |
| Supabase | Verificado | Proyecto real conectado con migraciones `0001` a `0007` aplicadas |
| Vercel proyecto | Verificado | Proyecto enlazado y produccion activa |
| Vercel produccion | Verificado | [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app) |
| Android base | Preparado en rama | Plataforma `android/` creada con Capacitor, shell `/mobile`, fallback remoto y metadata de release interno |

## Estado funcional cerrado

- Login operativo con Supabase Auth
- Roles `admin` y `registrador` operativos
- Dashboard admin operativo con KPIs reales
- CRUD de rutas funcionando
- CRUD de buses funcionando
- Registros diarios funcionando con recalculo SQL
- Rechazo real para buses `inactive`
- Cierre automatico operativo para `daily_records`
- Bloqueo post-cierre operativo en app y base de datos
- `closure_hash` SHA-256 persistido e inmutable
- Historial semanal y mensual operativo
- Auditoria visible para admin operativa
- Alertas internas operativas sin Telegram
- Modulo de deudas operativo con pagos parciales y saldo pendiente
- Modulo de reparaciones operativo con comprobante obligatorio y Storage real
- Historial de reparaciones por bus operativo
- Proximo servicio sugerido por unidad operativo

## Estado de Sprint 5

Sprint 5 queda cerrado con este alcance:

1. modulo de deudas
2. pagos parciales y saldo pendiente
3. modulo de reparaciones por bus
4. comprobante obligatorio
5. historial de reparaciones por unidad
6. upload a Supabase Storage
7. proximo servicio sugerido por bus

Estado actual de validacion:

- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- modulo de deudas: PASS
- deuda nueva en `pending`: PASS
- pago parcial: PASS
- paso a `partial`: PASS
- pago total y paso a `paid`: PASS
- modulo de reparaciones: PASS
- reparacion con comprobante real: PASS
- reparacion invalida sin comprobante: PASS
- historial por bus: PASS
- proximo servicio sugerido: PASS
- registrador fuera de `/dashboard/debts`: PASS
- registrador fuera de `/dashboard/repairs`: PASS
- regresion Sprint 1, 2, 3 y 4: PASS

## Estado de Sprint 6 en rama separada

Alcance preparado en la rama de trabajo Android:

1. Integracion de Capacitor
2. Plataforma Android creada
3. Shell movil `/mobile`
4. Navegacion base `Inicio`, `Registrar`, `Buses`, `Alertas`, `Mas`
5. Ajustes de viewport, safe area y teclado
6. Auth movil con redirect estable a rutas `/mobile/*`
7. Registro diario movil reutilizando `saveDailyRecordAction`
8. Alertas moviles priorizadas reutilizando `getAlertsData`
9. Gastos complementarios moviles sobre `expenses`
10. Deudas moviles sobre el modulo real de deudas y abonos
11. Perfil movil por bus con vista semanal y mensual reutilizando `lib/bus-profile`
12. Fallback local para fallo inicial de web remota
13. Guard movil de red/error con `@capacitor/network`
14. Back button, status bar, teclado y safe areas ajustados
15. Metadata de release interno y documentacion de APK/AAB

Validacion actual del branch:

- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- redirects moviles `/mobile/register/expenses`, `/mobile/register/debts` y `/mobile/alerts`: PASS
- `npm run android:sync`: PASS
- `gradlew assembleDebug`: PASS usando Android Studio JBR y SDK local detectados
- arranque real en emulador/dispositivo: pendiente porque no hay AVD creado ni dispositivo conectado

## Estado de cierre

- Sprint 0: cerrado
- Sprint 1: cerrado
- Sprint 2: cerrado
- Sprint 3: cerrado
- Sprint 4: cerrado
- Sprint 5: cerrado el 4 de abril de 2026
- Sprint 6: abierto en rama separada el 9 de abril de 2026 solo para base Android

## Pendiente siguiente fase

Sprint 6 queda abierto solo en rama separada para la experiencia Android y movil. El trabajo funcional realizado se limito a shells y flujos moviles apoyados en la logica existente, sin abrir alcances nuevos de backend ni cambios de negocio.
